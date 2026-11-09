"""Reports endpoints."""

from typing import Any

from fastapi import APIRouter, Depends, File, Form, UploadFile
from pydantic import Field

from app.core.constants import UserRole
from app.core.schemas import ApiModel
from app.db.pool import get_db_connection
from app.db.transactions import with_transaction
from app.middleware.require_role import require_role
from app.middleware.uploads import validate_and_sanitize_image
from app.modules.reports.service import ReportService

router = APIRouter(prefix="/reports", tags=["reports"])
service = ReportService()


class PrecheckRequest(ApiModel):
    description: str = Field(min_length=10)
    latitude: float
    longitude: float
    category_id: int | None = None


@router.post("/precheck")
async def report_precheck(
    req: PrecheckRequest,
    current_user: dict[str, Any] = Depends(require_role(UserRole.CITIZEN)),
) -> dict[str, Any]:
    async with get_db_connection() as conn:
        result = await service.run_precheck(
            conn=conn,
            description=req.description,
            latitude=req.latitude,
            longitude=req.longitude,
            category_id=req.category_id,
            user_id=current_user["id"],
        )
        return {"data": result}


@router.post("")
async def create_report(
    description: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    category_id: int = Form(...),
    address: str | None = Form(None),
    ai_suggested_category_id: int | None = Form(None),
    join_issue_id: int | None = Form(None),
    image: UploadFile | None = File(None),
    current_user: dict[str, Any] = Depends(require_role(UserRole.CITIZEN)),
) -> dict[str, Any]:
    image_bytes = None
    if image and image.filename:
        image_bytes = await validate_and_sanitize_image(image)

    async with with_transaction() as conn:
        result = await service.submit_report(
            conn=conn,
            user=current_user,
            description=description,
            latitude=latitude,
            longitude=longitude,
            category_id=category_id,
            address=address,
            image_bytes=image_bytes,
            ai_suggested_category_id=ai_suggested_category_id,
            join_issue_id=join_issue_id,
        )
        return {"data": result}


@router.get("/my")
async def get_my_reports(
    current_user: dict[str, Any] = Depends(require_role(UserRole.CITIZEN)),
) -> dict[str, Any]:
    from app.modules.reports.service import report_repo

    async with get_db_connection() as conn:
        reports = await report_repo.list_user_reports(conn, current_user["id"])
        return {"data": reports}
