"""User and Auth repository."""

from typing import Any

import aiomysql


class AuthRepository:
    async def find_by_email(self, conn: aiomysql.Connection, email: str) -> dict[str, Any] | None:
        async with conn.cursor() as cur:
            await cur.execute(
                """
                SELECT id, name, email, password_hash, phone, role, ward_id, department_id, is_active
                FROM users
                WHERE LOWER(email) = LOWER(%s)
                """,
                (email,),
            )
            row = await cur.fetchone()
            return dict(row) if row else None

    async def create_user(
        self,
        conn: aiomysql.Connection,
        name: str,
        email: str,
        password_hash: str,
        role: str,
        ward_id: int | None,
        phone: str | None = None,
    ) -> int:
        async with conn.cursor() as cur:
            await cur.execute(
                """
                INSERT INTO users (name, email, password_hash, role, ward_id, phone, is_active, created_at)
                VALUES (%s, LOWER(%s), %s, %s, %s, %s, 1, UTC_TIMESTAMP(3))
                """,
                (name, email, password_hash, role, ward_id, phone),
            )
            return cur.lastrowid

    async def update_last_login(self, conn: aiomysql.Connection, user_id: int) -> None:
        async with conn.cursor() as cur:
            await cur.execute(
                "UPDATE users SET last_login_at = UTC_TIMESTAMP(3) WHERE id = %s",
                (user_id,),
            )
