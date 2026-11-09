"""Role and scope enforcement dependencies."""

from collections.abc import Callable
from typing import Any

from fastapi import Depends

from app.core.constants import UserRole
from app.core.errors import ForbiddenError
from app.middleware.auth import get_current_user


def require_role(*allowed_roles: UserRole | str) -> Callable:
    """Dependency factory checking user role."""
    roles = {r.value if isinstance(r, UserRole) else r for r in allowed_roles}

    async def _checker(current_user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
        if current_user.get("role") not in roles:
            raise ForbiddenError("You do not have permission to access this resource.")
        return current_user

    return _checker


def scope_for(user: dict[str, Any]) -> tuple[str, list[Any]]:
    """
    Return SQL WHERE snippet and params for ward scoping.
    If ward_id is NULL (e.g., city-view admin), no ward filter is applied.
    """
    ward_id = user.get("ward_id")
    if ward_id is None:
        return "1=1", []
    return "ward_id = %s", [ward_id]
