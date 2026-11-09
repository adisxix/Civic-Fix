"""Ward repository with strict ward scoping and triage queries."""

from datetime import UTC, datetime
from typing import Any

import aiomysql

from app.core.config import settings
from app.lib.geo import haversine_distance_m
from app.modules.issues.sla import compute_sla_state


class WardRepository:
    async def list_queue(
        self,
        conn: aiomysql.Connection,
        scope_sql: str,
        scope_params: list[Any],
        status: str | None = None,
        category: str | None = None,
        department: str | None = None,
        priority: str | None = None,
        assigned_to: int | None = None,
        search: str | None = None,
        sort: str = "age",
        page: int = 1,
        limit: int = 50,
    ) -> tuple[list[dict[str, Any]], int]:
        conditions = [scope_sql]
        params: list[Any] = list(scope_params)

        if status:
            conditions.append("i.status = %s")
            params.append(status)
        if category:
            conditions.append("c.code = %s")
            params.append(category)
        if department:
            conditions.append("d.code = %s")
            params.append(department)
        if priority:
            conditions.append("i.priority = %s")
            params.append(priority)
        if assigned_to:
            conditions.append("i.assigned_to = %s")
            params.append(assigned_to)
        if search:
            conditions.append("(i.title LIKE %s OR i.issue_code LIKE %s OR i.description LIKE %s)")
            wildcard = f"%{search}%"
            params.extend([wildcard, wildcard, wildcard])

        where_clause = " WHERE " + " AND ".join(conditions)

        count_sql = f"""
        SELECT COUNT(*) as total
        FROM issues i
        JOIN categories c ON i.category_id = c.id
        JOIN departments d ON i.department_id = d.id
        {where_clause}
        """
        async with conn.cursor() as cur:
            await cur.execute(count_sql, params)
            total = (await cur.fetchone())["total"]

        order_by = "i.created_at ASC"
        if sort == "priority":
            order_by = "FIELD(i.priority, 'critical', 'high', 'medium', 'low'), i.id DESC"
        elif sort == "support":
            order_by = "supporters_count DESC, i.id DESC"
        elif sort == "recent":
            order_by = "i.id DESC"

        items_sql = f"""
        SELECT
            i.id,
            i.issue_code,
            i.title,
            i.category_id,
            c.code as category_code,
            c.name as category_name,
            c.icon as category_icon,
            i.ward_id,
            w.name as ward_name,
            w.center_lat,
            w.center_lng,
            i.department_id,
            d.name as department_name,
            d.code as department_code,
            i.status,
            i.priority,
            i.latitude,
            i.longitude,
            i.address,
            i.assigned_to,
            u.name as assigned_to_name,
            i.first_assigned_at,
            i.sla_due_at,
            i.reopened_count,
            i.is_seed,
            i.created_at,
            i.updated_at,
            (SELECT COUNT(*) FROM reports r WHERE r.issue_id = i.id) as reports_count,
            (SELECT COUNT(*) FROM issue_support s WHERE s.issue_id = i.id) as supporters_count
        FROM issues i
        JOIN categories c ON i.category_id = c.id
        JOIN departments d ON i.department_id = d.id
        JOIN wards w ON i.ward_id = w.id
        LEFT JOIN users u ON i.assigned_to = u.id
        {where_clause}
        ORDER BY {order_by}
        LIMIT %s OFFSET %s
        """
        offset = (page - 1) * limit
        exec_params = list(params) + [limit, offset]

        async with conn.cursor() as cur:
            await cur.execute(items_sql, exec_params)
            rows = await cur.fetchall()

        now_utc = datetime.now(UTC)
        items = []
        for r in rows:
            sla_state, remaining_hours = compute_sla_state(
                status=r["status"],
                first_assigned_at=r["first_assigned_at"],
                sla_due_at=r["sla_due_at"],
            )

            # Verification overdue check (7 days without citizen action)
            verification_overdue = False
            if r["status"] == "awaiting_verification" and r["updated_at"]:
                up_at = r["updated_at"]
                if up_at.tzinfo is None:
                    up_at = up_at.replace(tzinfo=UTC)
                if (now_utc - up_at).days >= settings.VERIFICATION_OVERDUE_DAYS:
                    verification_overdue = True

            dist_from_center = None
            if r["center_lat"] is not None and r["center_lng"] is not None:
                dist_from_center = round(
                    haversine_distance_m(
                        r["center_lat"], r["center_lng"], r["latitude"], r["longitude"]
                    )
                )

            created_at = r["created_at"]
            if created_at and created_at.tzinfo is None:
                created_at = created_at.replace(tzinfo=UTC)
            age_days = (now_utc - created_at).days if created_at else 0

            items.append(
                {
                    "id": r["id"],
                    "issueCode": r["issue_code"] or f"CF-{r['id']:03d}",
                    "title": r["title"],
                    "categoryId": r["category_id"],
                    "categoryCode": r["category_code"],
                    "categoryName": r["category_name"],
                    "categoryIcon": r["category_icon"],
                    "wardId": r["ward_id"],
                    "wardName": r["ward_name"],
                    "departmentId": r["department_id"],
                    "departmentName": r["department_name"],
                    "departmentCode": r["department_code"],
                    "status": r["status"],
                    "priority": r["priority"],
                    "latitude": r["latitude"],
                    "longitude": r["longitude"],
                    "address": r["address"],
                    "assignedTo": r["assigned_to"],
                    "assignedToName": r["assigned_to_name"],
                    "slaState": sla_state.value,
                    "slaRemainingHours": remaining_hours,
                    "reportsCount": r["reports_count"],
                    "supportersCount": r["supporters_count"],
                    "verificationOverdue": verification_overdue,
                    "ageDays": age_days,
                    "distanceFromWardCenter": dist_from_center,
                    "isSeed": bool(r["is_seed"]),
                    "createdAt": r["created_at"].isoformat() + "Z" if r["created_at"] else None,
                }
            )

        if sort == "location":
            items.sort(key=lambda x: x["distanceFromWardCenter"] or float("inf"))

        return items, total

    async def get_team_members(
        self,
        conn: aiomysql.Connection,
        ward_id: int | None,
        department_id: int | None = None,
    ) -> list[dict[str, Any]]:
        conditions = ["role = 'ward_admin'", "is_active = 1"]
        params: list[Any] = []

        if ward_id is not None:
            conditions.append("(ward_id = %s OR ward_id IS NULL)")
            params.append(ward_id)

        if department_id is not None:
            conditions.append("(department_id = %s OR department_id IS NULL)")
            params.append(department_id)

        sql = f"""
        SELECT id, name, email, role, ward_id, department_id
        FROM users
        WHERE {" AND ".join(conditions)}
        ORDER BY name ASC
        """
        async with conn.cursor() as cur:
            await cur.execute(sql, params)
            rows = await cur.fetchall()

        return [
            {
                "id": r["id"],
                "name": r["name"],
                "email": r["email"],
                "role": r["role"],
                "wardId": r["ward_id"],
                "departmentId": r["department_id"],
            }
            for r in rows
        ]

    async def list_moderation_queue(
        self, conn: aiomysql.Connection, scope_sql: str, scope_params: list[Any]
    ) -> list[dict[str, Any]]:
        sql = f"""
        SELECT
            r.id as report_id,
            r.issue_id,
            r.description,
            r.image_url,
            r.flag_reason,
            r.created_at,
            i.issue_code,
            i.title as issue_title,
            i.ward_id,
            u.name as reporter_name
        FROM reports r
        JOIN issues i ON r.issue_id = i.id
        JOIN users u ON r.user_id = u.id
        WHERE r.review_status = 'flagged' AND {scope_sql}
        ORDER BY r.created_at DESC
        """
        async with conn.cursor() as cur:
            await cur.execute(sql, scope_params)
            rows = await cur.fetchall()

        return [
            {
                "reportId": r["report_id"],
                "issueId": r["issue_id"],
                "issueCode": r["issue_code"] or f"CF-{r['issue_id']:03d}",
                "issueTitle": r["issue_title"],
                "description": r["description"],
                "imageUrl": r["image_url"],
                "flagReason": r["flag_reason"],
                "reporterName": r["reporter_name"],
                "wardId": r["ward_id"],
                "createdAt": r["created_at"].isoformat() + "Z" if r["created_at"] else None,
            }
            for r in rows
        ]
