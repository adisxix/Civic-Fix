"""Notifications repository."""

from typing import Any

import aiomysql


class NotificationRepository:
    async def create_many(
        self,
        conn: aiomysql.Connection,
        user_ids: list[int],
        notif_type: str,
        title: str,
        body: str | None,
        issue_id: int | None,
    ) -> None:
        if not user_ids:
            return

        query = """
        INSERT INTO notifications (user_id, type, title, body, issue_id, is_read, created_at)
        VALUES (%s, %s, %s, %s, %s, 0, UTC_TIMESTAMP(3))
        """
        async with conn.cursor() as cur:
            params = [(uid, notif_type, title, body, issue_id) for uid in set(user_ids)]
            await cur.executemany(query, params)

    async def list_for_user(
        self, conn: aiomysql.Connection, user_id: int, limit: int = 50
    ) -> list[dict[str, Any]]:
        query = """
        SELECT id, user_id, type, title, body, issue_id, is_read, created_at
        FROM notifications
        WHERE user_id = %s
        ORDER BY created_at DESC
        LIMIT %s
        """
        async with conn.cursor() as cur:
            await cur.execute(query, (user_id, limit))
            rows = await cur.fetchall()
            return [dict(r) for r in rows]

    async def get_unread_count(self, conn: aiomysql.Connection, user_id: int) -> int:
        query = "SELECT COUNT(*) as cnt FROM notifications WHERE user_id = %s AND is_read = 0"
        async with conn.cursor() as cur:
            await cur.execute(query, (user_id,))
            row = await cur.fetchone()
            return row["cnt"] if row else 0

    async def mark_read(
        self, conn: aiomysql.Connection, notification_id: int, user_id: int
    ) -> bool:
        query = "UPDATE notifications SET is_read = 1 WHERE id = %s AND user_id = %s"
        async with conn.cursor() as cur:
            await cur.execute(query, (notification_id, user_id))
            return cur.rowcount > 0

    async def mark_all_read(self, conn: aiomysql.Connection, user_id: int) -> int:
        query = "UPDATE notifications SET is_read = 1 WHERE user_id = %s AND is_read = 0"
        async with conn.cursor() as cur:
            await cur.execute(query, (user_id,))
            return cur.rowcount
