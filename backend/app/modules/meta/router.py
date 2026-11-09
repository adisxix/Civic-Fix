"""Meta and public statistic endpoints."""

from typing import Any

from fastapi import APIRouter

from app.db.pool import check_db_health, get_db_connection
from app.modules.meta.repository import MetaRepository

router = APIRouter(tags=["meta"])
repo = MetaRepository()


@router.get("/health")
async def get_health() -> dict[str, Any]:
    db_ok = await check_db_health()
    version = "initial"
    if db_ok:
        try:
            async with get_db_connection() as conn:
                version = await repo.get_latest_migration(conn)
        except Exception:
            version = "unknown"

    return {
        "data": {
            "status": "ok",
            "database": "connected" if db_ok else "disconnected",
            "migrationVersion": version,
        }
    }


@router.get("/meta")
async def get_meta() -> dict[str, Any]:
    async with get_db_connection() as conn:
        meta_data = await repo.get_reference_meta(conn)
        return {"data": meta_data}


@router.get("/public/stats")
async def get_public_stats() -> dict[str, Any]:
    async with get_db_connection() as conn:
        stats = await repo.get_public_stats(conn)
        return {"data": stats}
