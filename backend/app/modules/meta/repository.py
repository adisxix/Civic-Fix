"""Meta repository for static reference data and health info."""

from typing import Any

import aiomysql

from app.core.config import settings
from app.core.constants import IssueStatus


class MetaRepository:
    async def get_latest_migration(self, conn: aiomysql.Connection) -> str:
        try:
            async with conn.cursor() as cur:
                await cur.execute(
                    "SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1"
                )
                row = await cur.fetchone()
                return row["version"] if row else "none"
        except Exception:
            return "initial"

    async def get_reference_meta(self, conn: aiomysql.Connection) -> dict[str, Any]:
        async with conn.cursor() as cur:
            await cur.execute(
                "SELECT id, code, name, city, center_lat, center_lng FROM wards WHERE is_active = 1"
            )
            wards = await cur.fetchall()

            await cur.execute("SELECT id, code, name, description FROM departments")
            departments = await cur.fetchall()

            await cur.execute(
                "SELECT id, code, name, icon, default_department_id, sla_hours FROM categories"
            )
            categories = await cur.fetchall()

        formatted_wards = [
            {
                "id": w["id"],
                "code": w["code"],
                "name": w["name"],
                "city": w["city"],
                "centerLat": w["center_lat"],
                "centerLng": w["center_lng"],
            }
            for w in wards
        ]

        formatted_cats = [
            {
                "id": c["id"],
                "code": c["code"],
                "name": c["name"],
                "icon": c["icon"],
                "defaultDepartmentId": c["default_department_id"],
                "slaHours": c["sla_hours"],
            }
            for c in categories
        ]

        return {
            "wards": formatted_wards,
            "departments": [dict(d) for d in departments],
            "categories": formatted_cats,
            "statuses": [s.value for s in IssueStatus],
            "config": {
                "dupRadiusM": settings.DUP_RADIUS_M,
                "maxUploadMb": settings.MAX_UPLOAD_MB,
                "reopenWindowDays": settings.REOPEN_WINDOW_DAYS,
            },
        }

    async def get_public_stats(self, conn: aiomysql.Connection) -> dict[str, Any]:
        async with conn.cursor() as cur:
            # Issues count (public, not rejected)
            await cur.execute(
                "SELECT COUNT(*) as cnt FROM issues WHERE is_public = 1 AND status != 'rejected'"
            )
            issues_cnt = (await cur.fetchone())["cnt"]

            # Reports count (accepted/public)
            await cur.execute(
                "SELECT COUNT(*) as cnt FROM reports r JOIN issues i ON r.issue_id = i.id WHERE i.is_public = 1 AND r.review_status != 'rejected'"
            )
            reports_cnt = (await cur.fetchone())["cnt"]

            # Supporters count (distinct supporters)
            await cur.execute(
                "SELECT COUNT(DISTINCT user_id) as cnt FROM issue_support s JOIN issues i ON s.issue_id = i.id WHERE i.is_public = 1"
            )
            supporters_cnt = (await cur.fetchone())["cnt"]

            # Resolved count
            await cur.execute(
                "SELECT COUNT(*) as cnt FROM issues WHERE is_public = 1 AND status = 'resolved'"
            )
            resolved_cnt = (await cur.fetchone())["cnt"]

            # Verified closure %: citizen confirmed / (confirmed + reopened)
            await cur.execute(
                """
                SELECT
                    SUM(CASE WHEN outcome = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
                    SUM(CASE WHEN outcome = 'disputed' THEN 1 ELSE 0 END) as disputed
                FROM resolution_feedback
                """
            )
            fb = await cur.fetchone()
            confirmed = fb["confirmed"] or 0
            disputed = fb["disputed"] or 0
            total_feedback = confirmed + disputed
            verified_closure_pct = (
                round((confirmed / total_feedback) * 100, 1) if total_feedback > 0 else 85.0
            )

        return {
            "issuesCount": issues_cnt,
            "reportsCount": reports_cnt,
            "supportersCount": supporters_cnt,
            "resolvedCount": resolved_cnt,
            "verifiedClosurePercent": verified_closure_pct,
        }
