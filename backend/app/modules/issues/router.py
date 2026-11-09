"""Issues router endpoints."""

from typing import Any

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile
from pydantic import Field

from app.core.constants import FeedbackOutcome, IssueStatus, UpdateType, UserRole
from app.core.errors import ForbiddenError, NotFoundError, ValidationError
from app.core.schemas import ApiModel
from app.db.pool import get_db_connection
from app.db.transactions import with_transaction
from app.middleware.auth import get_current_user_optional
from app.middleware.require_role import require_role
from app.middleware.uploads import validate_and_sanitize_image
from app.modules.issues.issue_state_machine import transition
from app.modules.issues.repository import IssueRepository

router = APIRouter(prefix="/issues", tags=["issues"])
repo = IssueRepository()


class VerifyRequest(ApiModel):
    rating: int | None = Field(default=None, ge=1, le=5)
    comment: str | None = None


@router.get("")
async def list_issues(
    ward: int | None = Query(None),
    category: str | None = Query(None),
    status: str | None = Query(None),
    q: str | None = Query(None),
    sort: str = Query("recent"),
    lat: float | None = Query(None),
    lng: float | None = Query(None),
    radius: float | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
) -> dict[str, Any]:
    async with get_db_connection() as conn:
        items, total = await repo.list_issues(
            conn=conn,
            ward_id=ward,
            category=category,
            status=status,
            search=q,
            sort=sort,
            lat=lat,
            lng=lng,
            radius_m=radius,
            page=page,
            limit=limit,
        )
        return {
            "data": items,
            "meta": {"page": page, "limit": limit, "total": total},
        }


@router.get("/nearby")
async def get_nearby_issues(
    lat: float = Query(...),
    lng: float = Query(...),
    radius: float = Query(1000.0),
    category: str | None = Query(None),
    status: str | None = Query(None),
) -> dict[str, Any]:
    async with get_db_connection() as conn:
        pins = await repo.get_nearby_pins(
            conn=conn,
            lat=lat,
            lng=lng,
            radius_m=radius,
            category=category,
            status=status,
        )
        return {"data": pins}


@router.get("/{issue_id}")
async def get_issue(
    issue_id: int,
    current_user: dict[str, Any] | None = Depends(get_current_user_optional),
) -> dict[str, Any]:
    user_id = current_user["id"] if current_user else None
    async with get_db_connection() as conn:
        issue = await repo.get_issue_by_id(conn, issue_id, user_id=user_id)
        if not issue:
            raise NotFoundError(f"Issue {issue_id} not found")
        return {"data": issue}


@router.get("/{issue_id}/timeline")
async def get_issue_timeline(issue_id: int) -> dict[str, Any]:
    async with get_db_connection() as conn:
        timeline = await repo.get_timeline(conn, issue_id, include_internal=False)
        return {"data": timeline}


@router.post("/{issue_id}/support")
async def support_issue(
    issue_id: int,
    current_user: dict[str, Any] = Depends(require_role(UserRole.CITIZEN)),
) -> dict[str, Any]:
    user_id = current_user["id"]
    async with with_transaction() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "SELECT id, status FROM issues WHERE id = %s FOR UPDATE",
                (issue_id,),
            )
            issue = await cur.fetchone()
            if not issue:
                raise NotFoundError(f"Issue {issue_id} not found")

            # Insert ignore unique support row
            await cur.execute(
                "INSERT IGNORE INTO issue_support (issue_id, user_id, created_at) VALUES (%s, %s, UTC_TIMESTAMP(3))",
                (issue_id, user_id),
            )
            if cur.rowcount > 0:
                await cur.execute(
                    """
                    INSERT INTO issue_updates (issue_id, update_type, actor_id, visibility, note, created_at)
                    VALUES (%s, %s, %s, 'public', 'Neighbourhood resident supported this issue', UTC_TIMESTAMP(3))
                    """,
                    (issue_id, UpdateType.SUPPORT_ADDED, user_id),
                )

            await cur.execute(
                "SELECT COUNT(*) as cnt FROM issue_support WHERE issue_id = %s",
                (issue_id,),
            )
            supporters_cnt = (await cur.fetchone())["cnt"]

        return {"data": {"supported": True, "supportersCount": supporters_cnt}}


@router.delete("/{issue_id}/support")
async def withdraw_support(
    issue_id: int,
    current_user: dict[str, Any] = Depends(require_role(UserRole.CITIZEN)),
) -> dict[str, Any]:
    user_id = current_user["id"]
    async with with_transaction() as conn:
        async with conn.cursor() as cur:
            # Check if user is a primary or secondary reporter
            await cur.execute(
                "SELECT 1 FROM reports WHERE issue_id = %s AND user_id = %s",
                (issue_id, user_id),
            )
            if await cur.fetchone():
                raise ForbiddenError("Reporters cannot withdraw their backing for their own issue.")

            await cur.execute(
                "DELETE FROM issue_support WHERE issue_id = %s AND user_id = %s",
                (issue_id, user_id),
            )
            await cur.execute(
                "SELECT COUNT(*) as cnt FROM issue_support WHERE issue_id = %s",
                (issue_id,),
            )
            supporters_cnt = (await cur.fetchone())["cnt"]

        return {"data": {"supported": False, "supportersCount": supporters_cnt}}


@router.post("/{issue_id}/verify")
async def verify_issue_fix(
    issue_id: int,
    req: VerifyRequest,
    current_user: dict[str, Any] = Depends(require_role(UserRole.CITIZEN)),
) -> dict[str, Any]:
    user_id = current_user["id"]
    async with with_transaction() as conn:
        # 1. State machine transition to resolved
        await transition(
            conn=conn,
            issue_id=issue_id,
            to_status=IssueStatus.RESOLVED,
            actor=current_user,
            note=req.comment or "Resident verified fix as completed.",
        )

        # 2. Record feedback entry
        async with conn.cursor() as cur:
            await cur.execute("SELECT reopened_count FROM issues WHERE id = %s", (issue_id,))
            issue = await cur.fetchone()
            cycle = issue["reopened_count"] if issue else 0

            await cur.execute(
                """
                INSERT INTO resolution_feedback (issue_id, user_id, cycle, outcome, rating, comment, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, UTC_TIMESTAMP(3))
                ON DUPLICATE KEY UPDATE rating=VALUES(rating), comment=VALUES(comment)
                """,
                (issue_id, user_id, cycle, FeedbackOutcome.CONFIRMED, req.rating, req.comment),
            )

        return {"data": {"id": issue_id, "status": IssueStatus.RESOLVED}}


@router.post("/{issue_id}/reopen")
async def reopen_issue(
    issue_id: int,
    reason: str = Form(...),
    image: UploadFile | None = File(None),
    current_user: dict[str, Any] = Depends(require_role(UserRole.CITIZEN)),
) -> dict[str, Any]:
    user_id = current_user["id"]
    if len(reason.strip()) < 5:
        raise ValidationError("A detailed reason is required to flag an issue as not resolved.")

    image_url = None
    if image and image.filename:
        image_bytes = await validate_and_sanitize_image(image)
        from app.lib.storage.index import save_image

        saved = await save_image(image_bytes, folder="reopen_evidence")
        image_url = saved["url"]

    async with with_transaction() as conn:
        # 1. State machine transition to reopened
        await transition(
            conn=conn,
            issue_id=issue_id,
            to_status=IssueStatus.REOPENED,
            actor=current_user,
            note=reason,
            metadata={"imageUrl": image_url} if image_url else None,
        )

        # 2. Record resolution feedback cycle
        async with conn.cursor() as cur:
            await cur.execute("SELECT reopened_count FROM issues WHERE id = %s", (issue_id,))
            issue = await cur.fetchone()
            cycle = issue["reopened_count"] if issue else 0

            await cur.execute(
                """
                INSERT INTO resolution_feedback (issue_id, user_id, cycle, outcome, comment, image_url, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, UTC_TIMESTAMP(3))
                ON DUPLICATE KEY UPDATE comment=VALUES(comment), image_url=VALUES(image_url)
                """,
                (issue_id, user_id, cycle, FeedbackOutcome.DISPUTED, reason, image_url),
            )

        return {"data": {"id": issue_id, "status": IssueStatus.REOPENED}}
