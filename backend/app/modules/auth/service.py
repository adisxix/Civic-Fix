"""Authentication service."""

from typing import Any

import aiomysql

from app.core.constants import UserRole
from app.core.errors import ConflictError, UnauthorizedError
from app.core.security import create_access_token, hash_password, verify_password
from app.modules.auth.repository import AuthRepository
from app.modules.auth.schemas import LoginRequest, RegisterRequest

repo = AuthRepository()


class AuthService:
    async def register(
        self, conn: aiomysql.Connection, req: RegisterRequest
    ) -> tuple[dict[str, Any], str]:
        existing = await repo.find_by_email(conn, req.email)
        if existing:
            raise ConflictError("An account with this email address already exists.")

        hashed = hash_password(req.password)
        user_id = await repo.create_user(
            conn=conn,
            name=req.name,
            email=req.email,
            password_hash=hashed,
            role=UserRole.CITIZEN,
            ward_id=req.ward_id,
            phone=req.phone,
        )

        token = create_access_token(user_id=user_id, role=UserRole.CITIZEN)
        user_data = {
            "id": user_id,
            "name": req.name,
            "email": req.email.lower(),
            "role": UserRole.CITIZEN,
            "wardId": req.ward_id,
            "phone": req.phone,
            "departmentId": None,
        }
        return user_data, token

    async def login(
        self, conn: aiomysql.Connection, req: LoginRequest
    ) -> tuple[dict[str, Any], str]:
        user = await repo.find_by_email(conn, req.email)
        if not user or not verify_password(req.password, user["password_hash"]):
            raise UnauthorizedError("Invalid email or password.")

        if not user["is_active"]:
            raise UnauthorizedError("Account has been deactivated. Please contact support.")

        await repo.update_last_login(conn, user["id"])
        token = create_access_token(user_id=user["id"], role=user["role"])

        user_data = {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "phone": user.get("phone"),
            "role": user["role"],
            "wardId": user.get("ward_id"),
            "departmentId": user.get("department_id"),
        }
        return user_data, token
