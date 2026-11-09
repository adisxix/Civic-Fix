"""Notification service."""

from typing import Any

import aiomysql

from app.core.logging import logger
from app.modules.notifications.repository import NotificationRepository

repo = NotificationRepository()


async def notify(
    conn: aiomysql.Connection,
    user_ids: list[int],
    notif_type: str,
    title: str,
    body: str | None = None,
    issue_id: int | None = None,
) -> None:
    """Publish in-app notification to users inside current transaction."""
    if not user_ids:
        return
    logger.info(
        "Creating notifications",
        type=notif_type,
        recipients_count=len(user_ids),
        issue_id=issue_id,
    )
    await repo.create_many(conn, user_ids, notif_type, title, body, issue_id)


class NotificationService:
    async def list_notifications(self, conn: aiomysql.Connection, user_id: int) -> dict[str, Any]:
        items = await repo.list_for_user(conn, user_id)
        unread = await repo.get_unread_count(conn, user_id)
        # Format timestamps
        for item in items:
            if item.get("created_at"):
                item["createdAt"] = item["created_at"].isoformat() + "Z"
                del item["created_at"]
            item["userId"] = item.pop("user_id", None)
            item["issueId"] = item.pop("issue_id", None)
            item["isRead"] = bool(item.pop("is_read", False))
        return {"items": items, "unreadCount": unread}

    async def mark_read(
        self, conn: aiomysql.Connection, notification_id: int, user_id: int
    ) -> bool:
        return await repo.mark_read(conn, notification_id, user_id)

    async def mark_all_read(self, conn: aiomysql.Connection, user_id: int) -> int:
        return await repo.mark_all_read(conn, user_id)
