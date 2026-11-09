"""Notification endpoints."""

from typing import Any

from fastapi import APIRouter, Depends

from app.db.pool import get_db_connection
from app.middleware.auth import get_current_user
from app.modules.notifications.service import NotificationService

router = APIRouter(prefix="/notifications", tags=["notifications"])
service = NotificationService()


@router.get("")
async def get_notifications(
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    async with get_db_connection() as conn:
        data = await service.list_notifications(conn, current_user["id"])
        return {"data": data}


@router.patch("/{notification_id}/read")
async def mark_notification_read(
    notification_id: int,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    async with get_db_connection() as conn:
        success = await service.mark_read(conn, notification_id, current_user["id"])
        await conn.commit()
        return {"data": {"id": notification_id, "isRead": success}}


@router.post("/read-all")
async def mark_all_notifications_read(
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    async with get_db_connection() as conn:
        count = await service.mark_all_read(conn, current_user["id"])
        await conn.commit()
        return {"data": {"markedRead": count}}
