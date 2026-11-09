"""Issue lifecycle state machine and atomic transitions."""

import json
from datetime import UTC, datetime
from typing import Any

import aiomysql

from app.core.config import settings
from app.core.constants import IssueStatus, NotificationType, UpdateType, UserRole
from app.core.errors import ConflictError, ForbiddenError, NotFoundError, ValidationError
from app.modules.notifications.service import notify

# Data-driven transition rules
ALLOWED_TRANSITIONS: dict[str, list[str]] = {
    IssueStatus.REPORTED: [IssueStatus.ASSIGNED, IssueStatus.REJECTED],
    IssueStatus.ASSIGNED: [
        IssueStatus.IN_PROGRESS,
        IssueStatus.AWAITING_VERIFICATION,
        IssueStatus.REJECTED,
    ],
    IssueStatus.IN_PROGRESS: [IssueStatus.AWAITING_VERIFICATION, IssueStatus.REJECTED],
    IssueStatus.AWAITING_VERIFICATION: [
        IssueStatus.RESOLVED,
        IssueStatus.REOPENED,
        IssueStatus.REJECTED,
    ],
    IssueStatus.RESOLVED: [IssueStatus.REOPENED],
    IssueStatus.REOPENED: [IssueStatus.ASSIGNED, IssueStatus.REJECTED],
    IssueStatus.REJECTED: [],
}


async def get_linked_user_ids(conn: aiomysql.Connection, issue_id: int) -> list[int]:
    """Return all unique citizen user_ids linked to an issue (reporters + supporters)."""
    async with conn.cursor() as cur:
        await cur.execute(
            """
            SELECT user_id FROM reports WHERE issue_id = %s
            UNION
            SELECT user_id FROM issue_support WHERE issue_id = %s
            """,
            (issue_id, issue_id),
        )
        rows = await cur.fetchall()
        return [r["user_id"] for r in rows]


async def get_ward_admin_ids_for_ward(conn: aiomysql.Connection, ward_id: int) -> list[int]:
    """Return ward admins in scope for a ward (specific ward + city-wide ward leads)."""
    async with conn.cursor() as cur:
        await cur.execute(
            """
            SELECT id FROM users
            WHERE role = 'ward_admin' AND is_active = 1
              AND (ward_id = %s OR ward_id IS NULL)
            """,
            (ward_id,),
        )
        rows = await cur.fetchall()
        return [r["id"] for r in rows]


async def transition(
    conn: aiomysql.Connection,
    issue_id: int,
    to_status: str,
    actor: dict[str, Any],
    note: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """
    Execute an atomic state machine transition:
    - Locks row with SELECT ... FOR UPDATE
    - Validates actor and business prerequisites
    - Updates issue record
    - Writes an issue_updates row
    - Generates corresponding notifications
    All executed within the caller's active transaction.
    """
    metadata = metadata or {}
    actor_id = actor.get("id")
    actor_role = actor.get("role")

    async with conn.cursor() as cur:
        await cur.execute(
            """
            SELECT i.*, c.sla_hours
            FROM issues i
            JOIN categories c ON i.category_id = c.id
            WHERE i.id = %s
            FOR UPDATE
            """,
            (issue_id,),
        )
        issue = await cur.fetchone()
        if not issue:
            raise NotFoundError(f"Issue {issue_id} not found")

        from_status = issue["status"]

        # 1. Validate status transition exists in allowed map
        if to_status not in ALLOWED_TRANSITIONS.get(from_status, []):
            raise ConflictError(f"Cannot transition issue from '{from_status}' to '{to_status}'.")

        linked_user_ids = await get_linked_user_ids(conn, issue_id)
        is_linked = actor_id in linked_user_ids

        now_utc = datetime.now(UTC)

        # 2. Check transition specific actor & condition requirements
        if to_status == IssueStatus.ASSIGNED:
            if actor_role != UserRole.WARD_ADMIN:
                raise ForbiddenError("Only ward admins can assign issues.")

        elif to_status == IssueStatus.IN_PROGRESS:
            if actor_role != UserRole.WARD_ADMIN:
                raise ForbiddenError("Only ward admins can start work.")

        elif to_status == IssueStatus.AWAITING_VERIFICATION:
            if actor_role != UserRole.WARD_ADMIN:
                raise ForbiddenError("Only ward admins can submit for verification.")
            # Verify at least one 'after' evidence exists
            await cur.execute(
                "SELECT COUNT(*) as cnt FROM evidence WHERE issue_id = %s AND kind = 'after'",
                (issue_id,),
            )
            ev = await cur.fetchone()
            if not ev or ev["cnt"] == 0:
                raise ValidationError(
                    "At least one completion proof ('after' photo) is required to submit for verification."
                )
            if not note:
                raise ValidationError(
                    "A closure note is required when submitting for verification."
                )

        elif to_status == IssueStatus.RESOLVED:
            # Can be confirmed by linked citizen OR ward admin overdue override
            is_ward_override = False
            if actor_role == UserRole.WARD_ADMIN:
                # Check overdue override condition
                updated_at = issue["updated_at"]
                if updated_at.tzinfo is None:
                    updated_at = updated_at.replace(tzinfo=UTC)
                days_awaiting = (now_utc - updated_at).days
                if days_awaiting < settings.VERIFICATION_OVERDUE_DAYS:
                    raise ForbiddenError(
                        f"Ward admin cannot mark resolved unless citizen verification is overdue ({settings.VERIFICATION_OVERDUE_DAYS} days)."
                    )
                if not note:
                    raise ValidationError("A reason is required for ward admin overdue override.")
                is_ward_override = True
            else:
                if not is_linked:
                    raise ForbiddenError("Only linked citizens can confirm resolution.")

            if is_ward_override:
                metadata["override"] = "closed by ward override"

        elif to_status == IssueStatus.REOPENED:
            if from_status == IssueStatus.AWAITING_VERIFICATION:
                if not is_linked:
                    raise ForbiddenError("Only linked citizens can flag an issue as not resolved.")
                if not note:
                    raise ValidationError(
                        "A reason is required when flagging an issue as not resolved."
                    )
            elif from_status == IssueStatus.RESOLVED:
                if not is_linked:
                    raise ForbiddenError("Only linked citizens can reopen an issue.")
                resolved_at = issue.get("resolved_at")
                if resolved_at:
                    if resolved_at.tzinfo is None:
                        resolved_at = resolved_at.replace(tzinfo=UTC)
                    if (now_utc - resolved_at).days > settings.REOPEN_WINDOW_DAYS:
                        raise ConflictError(
                            f"Issue cannot be reopened after {settings.REOPEN_WINDOW_DAYS} days from resolution."
                        )
                if not note:
                    raise ValidationError("A reason is required to reopen a resolved issue.")

        elif to_status == IssueStatus.REJECTED:
            if actor_role != UserRole.WARD_ADMIN:
                raise ForbiddenError("Only ward admins can reject issues.")
            if not note:
                raise ValidationError("A reason is required to reject an issue.")

        # 3. Apply status update
        update_fields = ["status = %s", "updated_at = UTC_TIMESTAMP(3)"]
        params: list[Any] = [to_status]

        if to_status == IssueStatus.RESOLVED:
            update_fields.append("resolved_at = UTC_TIMESTAMP(3)")
        elif to_status == IssueStatus.REOPENED:
            update_fields.append("reopened_count = reopened_count + 1")

        params.append(issue_id)
        sql_update = f"UPDATE issues SET {', '.join(update_fields)} WHERE id = %s"
        await cur.execute(sql_update, params)

        # 4. Insert issue_updates row
        meta_json = json.dumps(metadata) if metadata else None
        await cur.execute(
            """
            INSERT INTO issue_updates (
                issue_id, update_type, from_status, to_status, actor_id,
                visibility, note, metadata, created_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, UTC_TIMESTAMP(3))
            """,
            (
                issue_id,
                UpdateType.STATUS_CHANGED,
                from_status,
                to_status,
                actor_id,
                "public",
                note,
                meta_json,
            ),
        )

        # 5. Create notifications
        issue_title = issue["title"]
        if to_status == IssueStatus.AWAITING_VERIFICATION:
            await notify(
                conn=conn,
                user_ids=linked_user_ids,
                notif_type=NotificationType.VERIFICATION_REQUESTED,
                title="Action Required: Verify Fix",
                body=f"Work has been completed on '{issue_title}'. Please verify or dispute the fix.",
                issue_id=issue_id,
            )
        elif to_status == IssueStatus.REOPENED:
            admin_ids = await get_ward_admin_ids_for_ward(conn, issue["ward_id"])
            await notify(
                conn=conn,
                user_ids=admin_ids,
                notif_type=NotificationType.ISSUE_REOPENED,
                title="Issue Reopened",
                body=f"Resident reopened '{issue_title}': {note}",
                issue_id=issue_id,
            )
        elif to_status == IssueStatus.RESOLVED:
            await notify(
                conn=conn,
                user_ids=linked_user_ids,
                notif_type=NotificationType.STATUS_CHANGED,
                title="Issue Resolved",
                body=f"Fix has been confirmed for '{issue_title}'.",
                issue_id=issue_id,
            )

        return {
            "id": issue_id,
            "fromStatus": from_status,
            "toStatus": to_status,
        }
