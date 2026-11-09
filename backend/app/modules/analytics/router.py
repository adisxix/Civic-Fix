"""Ward analytics endpoints."""

from typing import Any

from fastapi import APIRouter, Depends, Query

from app.core.constants import UserRole
from app.core.errors import ForbiddenError
from app.db.pool import get_db_connection
from app.middleware.require_role import require_role, scope_for
from app.modules.analytics.repository import AnalyticsRepository

router = APIRouter(prefix="/ward/analytics", tags=["analytics"])
repo = AnalyticsRepository()


@router.get("/overview")
async def get_overview(
    current_user: dict[str, Any] = Depends(require_role(UserRole.WARD_ADMIN)),
) -> dict[str, Any]:
    scope_sql, scope_params = scope_for(current_user)
    async with get_db_connection() as conn:
        kpis = await repo.get_overview_kpis(conn, scope_sql, scope_params)
        return {"data": kpis}


@router.get("/categories")
async def get_categories_breakdown(
    current_user: dict[str, Any] = Depends(require_role(UserRole.WARD_ADMIN)),
) -> dict[str, Any]:
    scope_sql, scope_params = scope_for(current_user)
    async with get_db_connection() as conn:
        data = await repo.get_categories_analytics(conn, scope_sql, scope_params)
        return {"data": data}


@router.get("/timeseries")
async def get_timeseries(
    days: int = Query(30, ge=7, le=90),
    current_user: dict[str, Any] = Depends(require_role(UserRole.WARD_ADMIN)),
) -> dict[str, Any]:
    scope_sql, scope_params = scope_for(current_user)
    async with get_db_connection() as conn:
        ts = await repo.get_timeseries_analytics(conn, scope_sql, scope_params, days=days)
        return {"data": ts}


@router.get("/scorecard")
async def get_pilot_scorecard(
    current_user: dict[str, Any] = Depends(require_role(UserRole.WARD_ADMIN)),
) -> dict[str, Any]:
    scope_sql, scope_params = scope_for(current_user)
    async with get_db_connection() as conn:
        scorecard = await repo.get_scorecard_metrics(conn, scope_sql, scope_params)
        return {"data": scorecard}


@router.get("/hotspots")
async def get_hotspots(
    current_user: dict[str, Any] = Depends(require_role(UserRole.WARD_ADMIN)),
) -> dict[str, Any]:
    scope_sql, scope_params = scope_for(current_user)
    async with get_db_connection() as conn:
        hotspots = await repo.get_hotspots(conn, scope_sql, scope_params)
        return {"data": hotspots}


@router.get("/ageing")
async def get_ageing(
    current_user: dict[str, Any] = Depends(require_role(UserRole.WARD_ADMIN)),
) -> dict[str, Any]:
    scope_sql, scope_params = scope_for(current_user)
    async with get_db_connection() as conn:
        ageing = await repo.get_ageing_buckets(conn, scope_sql, scope_params)
        return {"data": ageing}


@router.get("/wards")
async def get_wards_chart(
    current_user: dict[str, Any] = Depends(require_role(UserRole.WARD_ADMIN)),
) -> dict[str, Any]:
    if current_user.get("ward_id") is not None:
        raise ForbiddenError("By-ward comparison is available only to city view accounts.")
    async with get_db_connection() as conn:
        data = await repo.get_wards_comparison(conn)
        return {"data": data}
