"""Authentication dependencies reading JWT from cookie or header."""

from typing import Any

from fastapi import Request

from app.core.errors import UnauthorizedError
from app.core.security import decode_access_token
from app.db.pool import get_db_connection


async def get_current_user_optional(request: Request) -> dict[str, Any] | None:
    """Extract authenticated user if cookie or Authorization header is present."""
    token = request.cookies.get("civicfix_token")
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1]

    if not token:
        return None

    try:
        payload = decode_access_token(token)
        user_id = int(payload["sub"])
    except Exception:
        return None

    async with get_db_connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                """
                SELECT id, name, email, phone, role, ward_id, department_id, is_active
                FROM users
                WHERE id = %s
                """,
                (user_id,),
            )
            user = await cur.fetchone()
            if not user or not user["is_active"]:
                return None
            return dict(user)


async def get_current_user(request: Request) -> dict[str, Any]:
    """Require valid authenticated user."""
    user = await get_current_user_optional(request)
    if not user:
        raise UnauthorizedError("Authentication required. Please log in.")
    return user
