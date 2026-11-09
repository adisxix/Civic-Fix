"""Auth router endpoints."""

from typing import Any

from fastapi import APIRouter, Depends, Response

from app.core.config import settings
from app.db.pool import get_db_connection
from app.middleware.auth import get_current_user
from app.modules.auth.schemas import LoginRequest, RegisterRequest
from app.modules.auth.service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])
service = AuthService()


def set_auth_cookie(response: Response, token: str) -> None:
    samesite = settings.COOKIE_SAMESITE.lower()
    is_secure = samesite == "none" or settings.APP_ENV == "production"
    response.set_cookie(
        key="civicfix_token",
        value=token,
        httponly=True,
        samesite=samesite,
        secure=is_secure,
        max_age=7 * 24 * 3600,
        path="/",
    )


@router.post("/register")
async def register(req: RegisterRequest, response: Response) -> dict[str, Any]:
    async with get_db_connection() as conn:
        user_data, token = await service.register(conn, req)
        await conn.commit()
        set_auth_cookie(response, token)
        return {"data": user_data}


@router.post("/login")
async def login(req: LoginRequest, response: Response) -> dict[str, Any]:
    async with get_db_connection() as conn:
        user_data, token = await service.login(conn, req)
        await conn.commit()
        set_auth_cookie(response, token)
        return {"data": user_data}


@router.post("/logout")
async def logout(response: Response) -> dict[str, Any]:
    samesite = settings.COOKIE_SAMESITE.lower()
    is_secure = samesite == "none" or settings.APP_ENV == "production"
    response.delete_cookie(
        key="civicfix_token",
        httponly=True,
        samesite=samesite,
        secure=is_secure,
        path="/",
    )
    return {"data": {"message": "Logged out successfully"}}


@router.get("/me")
async def get_me(current_user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    user_data = {
        "id": current_user["id"],
        "name": current_user["name"],
        "email": current_user["email"],
        "phone": current_user.get("phone"),
        "role": current_user["role"],
        "wardId": current_user.get("ward_id"),
        "departmentId": current_user.get("department_id"),
    }
    return {"data": user_data}
