"""User profile router."""

from typing import Any

from fastapi import APIRouter, Depends
from pydantic import Field

from app.core.schemas import ApiModel
from app.db.pool import get_db_connection
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/users", tags=["users"])


class ProfileUpdateRequest(ApiModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    phone: str | None = Field(default=None, max_length=20)
    ward_id: int | None = None


@router.patch("/profile")
async def update_profile(
    req: ProfileUpdateRequest,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    updates = []
    params = []

    if req.name is not None:
        updates.append("name = %s")
        params.append(req.name)
    if req.phone is not None:
        updates.append("phone = %s")
        params.append(req.phone)
    if req.ward_id is not None:
        updates.append("ward_id = %s")
        params.append(req.ward_id)

    if updates:
        params.append(current_user["id"])
        sql = f"UPDATE users SET {', '.join(updates)} WHERE id = %s"
        async with get_db_connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(sql, params)
                await conn.commit()

    return {
        "data": {
            "id": current_user["id"],
            "name": req.name if req.name is not None else current_user["name"],
            "email": current_user["email"],
            "phone": req.phone if req.phone is not None else current_user.get("phone"),
            "role": current_user["role"],
            "wardId": req.ward_id if req.ward_id is not None else current_user.get("ward_id"),
            "departmentId": current_user.get("department_id"),
        }
    }
