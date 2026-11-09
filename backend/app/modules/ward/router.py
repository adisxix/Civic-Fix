"""Ward console endpoints."""

from datetime import UTC, datetime, timedelta
from typing import Any

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile
from pydantic import Field

from app.core.constants import (
    NotificationType,
    UpdateType,
    UserRole,
)
from app.core.errors import ForbiddenError, NotFoundError, ValidationError
from app.core.schemas import ApiModel
from app.db.pool import get_db_connection
from app.db.transactions import with_transaction
from app.middleware.require_role import require_role, scope_for
from app.middleware.uploads import validate_and_sanitize_image
from app.modules.ai.ai_service import AiService
from app.modules.issues.issue_state_machine import transition
from app.modules.issues.repository import IssueRepository
from app.modules.notifications.service import notify
from app.modules.ward.repository import WardRepository

router = APIRouter(prefix="/ward", tags=["ward"])
ward_repo = WardRepository()
issue_repo = IssueRepository()
ai_service = AiService()


class AssignRequest(ApiModel):
    category_id: int
    department_id: int
    priority: str = Field(pattern="^(low|medium|high|critical)$")
    assignee_id: int | None = None
    note: str | None = None


class StatusUpdateRequest(ApiModel):
    to_status: str
    note: str | None = None
    reason: str | None = None


class ProgressUpdateRequest(ApiModel):
    note: str
    next_step: str | None = None
    visibility: str = "public"


class ModerateRequest(ApiModel):
    action: str = Field(pattern="^(approve|reject)$")
    reason: str


@router.get("/issues")
async def get_ward_queue(
    status: str | None = Query(None),
    category: str | None = Query(None),
    department: str | None = Query(None),
    priority: str | None = Query(None),
    assigned_to: int | None = Query(None),
    q: str | None = Query(None),
    sort: str = Query("age"),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user: dict[str, Any] = Depends(require_role(UserRole.WARD_ADMIN)),
) -> dict[str, Any]:
    scope_sql, scope_params = scope_for(current_user)
    async with get_db_connection() as conn:
        items, total = await ward_repo.list_queue(
            conn=conn,
            scope_sql=scope_sql,
            scope_params=scope_params,
            status=status,
            category=category,
            department=department,
            priority=priority,
            assigned_to=assigned_to,
            search=q,
            sort=sort,
            page=page,
            limit=limit,
        )
        return {"data": items, "meta": {"page": page, "limit": limit, "total": total}}


@router.get("/issues/{issue_id}")
async def get_ward_issue_workspace(
    issue_id: int,
    current_user: dict[str, Any] = Depends(require_role(UserRole.WARD_ADMIN)),
) -> dict[str, Any]:
    async with get_db_connection() as conn:
        issue = await issue_repo.get_issue_by_id(conn, issue_id, user_id=current_user["id"])
        if not issue:
            raise NotFoundError(f"Issue {issue_id} not found")

        # Verify ward admin scope
        if current_user.get("ward_id") and issue["wardId"] != current_user["ward_id"]:
            raise ForbiddenError("Issue belongs to a different ward.")

        # Full timeline including internal notes
        timeline = await issue_repo.get_timeline(conn, issue_id, include_internal=True)
        issue["timeline"] = timeline

        # Fetch assignment history
        async with conn.cursor() as cur:
            await cur.execute(
                """
                SELECT a.*, d.name as department_name, u.name as assigned_to_name, by_u.name as assigned_by_name
                FROM assignments a
                JOIN departments d ON a.department_id = d.id
                LEFT JOIN users u ON a.assigned_to = u.id
                JOIN users by_u ON a.assigned_by = by_u.id
                WHERE a.issue_id = %s
                ORDER BY a.created_at DESC
                """,
                (issue_id,),
            )
            issue["assignments"] = await cur.fetchall()

        return {"data": issue}


@router.post("/issues/{issue_id}/assign")
async def assign_issue(
    issue_id: int,
    req: AssignRequest,
    current_user: dict[str, Any] = Depends(require_role(UserRole.WARD_ADMIN)),
) -> dict[str, Any]:
    async with with_transaction() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "SELECT * FROM issues WHERE id = %s FOR UPDATE",
                (issue_id,),
            )
            issue = await cur.fetchone()
            if not issue:
                raise NotFoundError(f"Issue {issue_id} not found")

            # Check assignee validity if provided
            if req.assignee_id:
                await cur.execute(
                    """
                    SELECT id, ward_id, department_id, name FROM users
                    WHERE id = %s AND role = 'ward_admin' AND is_active = 1
                    """,
                    (req.assignee_id,),
                )
                assignee = await cur.fetchone()
                if not assignee:
                    raise ValidationError("Assignee must be an active ward admin.")
                if assignee.get("ward_id") and assignee["ward_id"] != issue["ward_id"]:
                    raise ValidationError("Assignee must belong to the same ward.")
                if assignee.get("department_id") and assignee["department_id"] != req.department_id:
                    raise ValidationError("Assignee department does not match issue department.")

            # Get SLA hours for category
            await cur.execute("SELECT sla_hours FROM categories WHERE id = %s", (req.category_id,))
            cat = await cur.fetchone()
            sla_hours = cat["sla_hours"] if cat else 48

            now_utc = datetime.now(UTC)
            first_assigned_at = issue.get("first_assigned_at") or now_utc
            sla_due_at = now_utc + timedelta(hours=sla_hours)

            # End existing assignment
            await cur.execute(
                "UPDATE assignments SET ended_at = UTC_TIMESTAMP(3) WHERE issue_id = %s AND ended_at IS NULL",
                (issue_id,),
            )

            # Create new assignment record
            await cur.execute(
                """
                INSERT INTO assignments (issue_id, department_id, assigned_to, assigned_by, note, sla_due_at, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, UTC_TIMESTAMP(3))
                """,
                (
                    issue_id,
                    req.department_id,
                    req.assignee_id,
                    current_user["id"],
                    req.note,
                    sla_due_at,
                ),
            )

            # Update issues table
            is_initial_triage = issue["status"] == "reported"
            await cur.execute(
                """
                UPDATE issues SET
                    category_id = %s,
                    department_id = %s,
                    priority = %s,
                    assigned_to = %s,
                    status = 'assigned',
                    first_assigned_at = %s,
                    sla_due_at = %s,
                    triage_confirmed_at = UTC_TIMESTAMP(3),
                    triage_confirmed_by = %s,
                    updated_at = UTC_TIMESTAMP(3)
                WHERE id = %s
                """,
                (
                    req.category_id,
                    req.department_id,
                    req.priority,
                    req.assignee_id,
                    first_assigned_at,
                    sla_due_at,
                    current_user["id"],
                    issue_id,
                ),
            )

            # Write timeline update
            update_type = UpdateType.TRIAGE if is_initial_triage else UpdateType.ASSIGNMENT
            await cur.execute(
                """
                INSERT INTO issue_updates (issue_id, update_type, from_status, to_status, actor_id, visibility, note, created_at)
                VALUES (%s, %s, %s, 'assigned', %s, 'public', %s, UTC_TIMESTAMP(3))
                """,
                (
                    issue_id,
                    update_type,
                    issue["status"],
                    current_user["id"],
                    req.note or "Issue assigned to department",
                ),
            )

            # Notify assignee if designated
            if req.assignee_id:
                await notify(
                    conn=conn,
                    user_ids=[req.assignee_id],
                    notif_type=NotificationType.ISSUE_ASSIGNED,
                    title="New Assignment",
                    body=f"You have been assigned to #{issue.get('issue_code') or f'CF-{issue_id:03d}'}.",
                    issue_id=issue_id,
                )

        return {"data": {"id": issue_id, "status": "assigned"}}


@router.patch("/issues/{issue_id}/status")
async def update_issue_status(
    issue_id: int,
    req: StatusUpdateRequest,
    current_user: dict[str, Any] = Depends(require_role(UserRole.WARD_ADMIN)),
) -> dict[str, Any]:
    async with with_transaction() as conn:
        res = await transition(
            conn=conn,
            issue_id=issue_id,
            to_status=req.to_status,
            actor=current_user,
            note=req.note or req.reason,
        )
        return {"data": res}


@router.post("/issues/{issue_id}/updates")
async def post_progress_update(
    issue_id: int,
    req: ProgressUpdateRequest,
    current_user: dict[str, Any] = Depends(require_role(UserRole.WARD_ADMIN)),
) -> dict[str, Any]:
    vis = req.visibility if req.visibility in ("public", "internal") else "public"
    async with with_transaction() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                """
                INSERT INTO issue_updates (issue_id, update_type, actor_id, visibility, note, next_step, created_at)
                VALUES (%s, 'note', %s, %s, %s, %s, UTC_TIMESTAMP(3))
                """,
                (issue_id, current_user["id"], vis, req.note, req.next_step),
            )
        return {"data": {"id": issue_id, "posted": True}}


@router.post("/issues/{issue_id}/evidence")
async def upload_evidence(
    issue_id: int,
    kind: str = Form(...),
    caption: str | None = Form(None),
    image: UploadFile = File(...),
    current_user: dict[str, Any] = Depends(require_role(UserRole.WARD_ADMIN)),
) -> dict[str, Any]:
    if kind not in ("before", "progress", "after"):
        raise ValidationError("Evidence kind must be 'before', 'progress', or 'after'.")

    image_bytes = await validate_and_sanitize_image(image)
    from app.lib.storage.index import save_image

    saved = await save_image(image_bytes, folder="evidence")

    async with with_transaction() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                """
                INSERT INTO evidence (issue_id, uploaded_by, kind, url, storage_key, caption, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, UTC_TIMESTAMP(3))
                """,
                (issue_id, current_user["id"], kind, saved["url"], saved["key"], caption),
            )
            evidence_id = cur.lastrowid

            await cur.execute(
                """
                INSERT INTO issue_updates (issue_id, update_type, actor_id, visibility, note, created_at)
                VALUES (%s, 'evidence_added', %s, 'public', %s, UTC_TIMESTAMP(3))
                """,
                (issue_id, current_user["id"], f"Evidence photo uploaded ({kind})"),
            )

        return {
            "data": {
                "id": evidence_id,
                "url": saved["url"],
                "kind": kind,
                "caption": caption,
            }
        }


@router.post("/issues/{issue_id}/ai-summary")
async def regenerate_ai_summary(
    issue_id: int,
    current_user: dict[str, Any] = Depends(require_role(UserRole.WARD_ADMIN)),
) -> dict[str, Any]:
    async with get_db_connection() as conn:
        summary_data = await ai_service.summarize_issue(conn, issue_id, user_id=current_user["id"])
        return {"data": summary_data}


@router.get("/team")
async def get_team(
    department_id: int | None = Query(None),
    current_user: dict[str, Any] = Depends(require_role(UserRole.WARD_ADMIN)),
) -> dict[str, Any]:
    async with get_db_connection() as conn:
        members = await ward_repo.get_team_members(
            conn=conn,
            ward_id=current_user.get("ward_id"),
            department_id=department_id,
        )
        return {"data": members}


@router.get("/moderation")
async def get_moderation_queue(
    current_user: dict[str, Any] = Depends(require_role(UserRole.WARD_ADMIN)),
) -> dict[str, Any]:
    scope_sql, scope_params = scope_for(current_user)
    async with get_db_connection() as conn:
        items = await ward_repo.list_moderation_queue(conn, scope_sql, scope_params)
        return {"data": items}


@router.post("/issues/{issue_id}/moderate")
async def moderate_issue(
    issue_id: int,
    req: ModerateRequest,
    current_user: dict[str, Any] = Depends(require_role(UserRole.WARD_ADMIN)),
) -> dict[str, Any]:
    async with with_transaction() as conn:
        async with conn.cursor() as cur:
            if req.action == "approve":
                await cur.execute(
                    "UPDATE issues SET is_public = 1, updated_at = UTC_TIMESTAMP(3) WHERE id = %s",
                    (issue_id,),
                )
                await cur.execute(
                    "UPDATE reports SET review_status = 'accepted' WHERE issue_id = %s",
                    (issue_id,),
                )
                await cur.execute(
                    """
                    INSERT INTO issue_updates (issue_id, update_type, actor_id, visibility, note, created_at)
                    VALUES (%s, 'moderation', %s, 'internal', %s, UTC_TIMESTAMP(3))
                    """,
                    (issue_id, current_user["id"], f"Report approved by moderator: {req.reason}"),
                )
            else:
                await cur.execute(
                    "UPDATE issues SET status = 'rejected', is_public = 0, updated_at = UTC_TIMESTAMP(3) WHERE id = %s",
                    (issue_id,),
                )
                await cur.execute(
                    "UPDATE reports SET review_status = 'rejected' WHERE issue_id = %s",
                    (issue_id,),
                )
                await cur.execute(
                    """
                    INSERT INTO issue_updates (issue_id, update_type, actor_id, visibility, note, created_at)
                    VALUES (%s, 'moderation', %s, 'internal', %s, UTC_TIMESTAMP(3))
                    """,
                    (issue_id, current_user["id"], f"Report rejected by moderator: {req.reason}"),
                )

        return {"data": {"id": issue_id, "action": req.action}}
