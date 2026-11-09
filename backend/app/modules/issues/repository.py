"""Issues repository with raw parameterised SQL."""

from datetime import UTC, datetime
from typing import Any

import aiomysql

from app.lib.geo import bounding_box_delats, haversine_distance_m
from app.modules.issues.sla import compute_sla_state


class IssueRepository:
    async def list_issues(
        self,
        conn: aiomysql.Connection,
        ward_id: int | None = None,
        category: str | None = None,
        status: str | None = None,
        search: str | None = None,
        sort: str = "recent",
        lat: float | None = None,
        lng: float | None = None,
        radius_m: float | None = None,
        page: int = 1,
        limit: int = 20,
    ) -> tuple[list[dict[str, Any]], int]:
        conditions = ["i.is_public = 1"]
        params: list[Any] = []

        if ward_id is not None:
            conditions.append("i.ward_id = %s")
            params.append(ward_id)

        if category is not None:
            conditions.append("c.code = %s")
            params.append(category)

        if status is not None:
            conditions.append("i.status = %s")
            params.append(status)

        if search:
            conditions.append("(i.title LIKE %s OR i.description LIKE %s OR i.issue_code LIKE %s)")
            wildcard = f"%{search}%"
            params.extend([wildcard, wildcard, wildcard])

        if lat is not None and lng is not None and radius_m is not None:
            d_lat, d_lng = bounding_box_delats(lat, radius_m)
            conditions.append("i.latitude BETWEEN %s AND %s")
            conditions.append("i.longitude BETWEEN %s AND %s")
            params.extend([lat - d_lat, lat + d_lat, lng - d_lng, lng + d_lng])

        where_clause = " WHERE " + " AND ".join(conditions)

        # Count total matching
        count_sql = f"""
        SELECT COUNT(*) as total
        FROM issues i
        JOIN categories c ON i.category_id = c.id
        {where_clause}
        """
        async with conn.cursor() as cur:
            await cur.execute(count_sql, params)
            total = (await cur.fetchone())["total"]

        # Sort order
        order_by = "i.id DESC"
        if sort == "oldest":
            order_by = "i.created_at ASC"
        elif sort == "supported":
            order_by = "supporters_count DESC, i.id DESC"

        # Query items
        items_sql = f"""
        SELECT
            i.id,
            i.issue_code,
            i.title,
            i.summary,
            i.category_id,
            c.code as category_code,
            c.name as category_name,
            c.icon as category_icon,
            i.ward_id,
            w.name as ward_name,
            i.department_id,
            d.name as department_name,
            i.status,
            i.priority,
            i.latitude,
            i.longitude,
            i.address,
            i.assigned_to,
            u.name as assigned_to_name,
            i.first_assigned_at,
            i.sla_due_at,
            i.resolved_at,
            i.reopened_count,
            i.is_seed,
            i.created_at,
            (SELECT COUNT(*) FROM reports r WHERE r.issue_id = i.id AND r.review_status != 'rejected') as reports_count,
            (SELECT COUNT(*) FROM issue_support s WHERE s.issue_id = i.id) as supporters_count,
            (SELECT r.image_url FROM reports r WHERE r.issue_id = i.id AND r.is_primary = 1 LIMIT 1) as primary_image_url
        FROM issues i
        JOIN categories c ON i.category_id = c.id
        JOIN wards w ON i.ward_id = w.id
        JOIN departments d ON i.department_id = d.id
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

        items = []
        for r in rows:
            sla_state, remaining_hours = compute_sla_state(
                status=r["status"],
                first_assigned_at=r["first_assigned_at"],
                sla_due_at=r["sla_due_at"],
            )

            distance_m = None
            if lat is not None and lng is not None:
                distance_m = round(haversine_distance_m(lat, lng, r["latitude"], r["longitude"]))

            items.append(
                {
                    "id": r["id"],
                    "issueCode": r["issue_code"] or f"CF-{r['id']:03d}",
                    "title": r["title"],
                    "summary": r["summary"],
                    "categoryId": r["category_id"],
                    "categoryCode": r["category_code"],
                    "categoryName": r["category_name"],
                    "categoryIcon": r["category_icon"],
                    "wardId": r["ward_id"],
                    "wardName": r["ward_name"],
                    "departmentId": r["department_id"],
                    "departmentName": r["department_name"],
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
                    "imageUrl": r["primary_image_url"],
                    "distanceM": distance_m,
                    "isSeed": bool(r["is_seed"]),
                    "createdAt": r["created_at"].isoformat() + "Z" if r["created_at"] else None,
                }
            )

        if sort == "nearest" and lat is not None and lng is not None:
            items.sort(key=lambda x: x["distanceM"] or float("inf"))

        return items, total

    async def get_nearby_pins(
        self,
        conn: aiomysql.Connection,
        lat: float,
        lng: float,
        radius_m: float = 2000.0,
        category: str | None = None,
        status: str | None = None,
    ) -> list[dict[str, Any]]:
        d_lat, d_lng = bounding_box_delats(lat, radius_m)
        conditions = [
            "i.is_public = 1",
            "i.latitude BETWEEN %s AND %s",
            "i.longitude BETWEEN %s AND %s",
        ]
        params: list[Any] = [lat - d_lat, lat + d_lat, lng - d_lng, lng + d_lng]

        if category:
            conditions.append("c.code = %s")
            params.append(category)
        if status:
            conditions.append("i.status = %s")
            params.append(status)

        sql = f"""
        SELECT i.id, i.issue_code, i.title, i.latitude, i.longitude, i.status, c.icon as category_icon, c.code as category_code
        FROM issues i
        JOIN categories c ON i.category_id = c.id
        WHERE {" AND ".join(conditions)}
        LIMIT 200
        """
        async with conn.cursor() as cur:
            await cur.execute(sql, params)
            rows = await cur.fetchall()

        pins = []
        for r in rows:
            dist = haversine_distance_m(lat, lng, r["latitude"], r["longitude"])
            if dist <= radius_m:
                pins.append(
                    {
                        "id": r["id"],
                        "issueCode": r["issue_code"] or f"CF-{r['id']:03d}",
                        "title": r["title"],
                        "latitude": r["latitude"],
                        "longitude": r["longitude"],
                        "status": r["status"],
                        "categoryIcon": r["category_icon"],
                        "categoryCode": r["category_code"],
                    }
                )
        return pins

    async def get_issue_by_id(
        self, conn: aiomysql.Connection, issue_id: int, user_id: int | None = None
    ) -> dict[str, Any] | None:
        sql = """
        SELECT
            i.*,
            c.code as category_code,
            c.name as category_name,
            c.icon as category_icon,
            c.sla_hours,
            w.name as ward_name,
            d.name as department_name,
            u.name as assigned_to_name
        FROM issues i
        JOIN categories c ON i.category_id = c.id
        JOIN wards w ON i.ward_id = w.id
        JOIN departments d ON i.department_id = d.id
        LEFT JOIN users u ON i.assigned_to = u.id
        WHERE i.id = %s
        """
        async with conn.cursor() as cur:
            await cur.execute(sql, (issue_id,))
            issue = await cur.fetchone()
            if not issue:
                return None

            # Get reports (public: reporter display name or Anonymous, no email/phone)
            await cur.execute(
                """
                SELECT r.id, r.description, r.image_url, r.latitude, r.longitude, r.address,
                       r.created_at, r.is_primary, u.name as reporter_name
                FROM reports r
                JOIN users u ON r.user_id = u.id
                WHERE r.issue_id = %s AND r.review_status != 'rejected'
                ORDER BY r.id ASC
                """,
                (issue_id,),
            )
            reports = await cur.fetchall()

            # Get evidence
            await cur.execute(
                """
                SELECT e.id, e.kind, e.url, e.caption, e.created_at, u.name as uploaded_by_name
                FROM evidence e
                JOIN users u ON e.uploaded_by = u.id
                WHERE e.issue_id = %s
                ORDER BY e.created_at ASC
                """,
                (issue_id,),
            )
            evidence = await cur.fetchall()

            # Get supporters count
            await cur.execute(
                "SELECT COUNT(*) as cnt FROM issue_support WHERE issue_id = %s",
                (issue_id,),
            )
            supporters_cnt = (await cur.fetchone())["cnt"]

            # Viewer flags
            has_supported = False
            is_linked = False
            can_verify = False
            can_reopen = False

            if user_id:
                await cur.execute(
                    "SELECT 1 FROM issue_support WHERE issue_id = %s AND user_id = %s",
                    (issue_id, user_id),
                )
                has_supported = bool(await cur.fetchone())

                await cur.execute(
                    "SELECT 1 FROM reports WHERE issue_id = %s AND user_id = %s",
                    (issue_id, user_id),
                )
                is_reporter = bool(await cur.fetchone())
                is_linked = has_supported or is_reporter

                if is_linked:
                    if issue["status"] == "awaiting_verification":
                        can_verify = True
                        can_reopen = True
                    elif issue["status"] == "resolved" and issue.get("resolved_at"):
                        res_at = issue["resolved_at"]
                        if res_at.tzinfo is None:
                            res_at = res_at.replace(tzinfo=UTC)
                        now_utc = datetime.now(UTC)
                        if (now_utc - res_at).days <= 14:
                            can_reopen = True

        sla_state, remaining_hours = compute_sla_state(
            status=issue["status"],
            first_assigned_at=issue["first_assigned_at"],
            sla_due_at=issue["sla_due_at"],
        )

        formatted_reports = [
            {
                "id": rep["id"],
                "description": rep["description"],
                "imageUrl": rep["image_url"],
                "latitude": rep["latitude"],
                "longitude": rep["longitude"],
                "address": rep["address"],
                "reporterName": rep["reporter_name"],
                "isPrimary": bool(rep["is_primary"]),
                "createdAt": rep["created_at"].isoformat() + "Z" if rep["created_at"] else None,
            }
            for rep in reports
        ]

        formatted_evidence = [
            {
                "id": ev["id"],
                "kind": ev["kind"],
                "url": ev["url"],
                "caption": ev["caption"],
                "uploadedByName": ev["uploaded_by_name"],
                "createdAt": ev["created_at"].isoformat() + "Z" if ev["created_at"] else None,
            }
            for ev in evidence
        ]

        return {
            "id": issue["id"],
            "issueCode": issue["issue_code"] or f"CF-{issue['id']:03d}",
            "title": issue["title"],
            "summary": issue["summary"],
            "description": issue["description"],
            "categoryId": issue["category_id"],
            "categoryCode": issue["category_code"],
            "categoryName": issue["category_name"],
            "categoryIcon": issue["category_icon"],
            "wardId": issue["ward_id"],
            "wardName": issue["ward_name"],
            "departmentId": issue["department_id"],
            "departmentName": issue["department_name"],
            "status": issue["status"],
            "priority": issue["priority"],
            "latitude": issue["latitude"],
            "longitude": issue["longitude"],
            "address": issue["address"],
            "assignedTo": issue["assigned_to"],
            "assignedToName": issue["assigned_to_name"],
            "slaState": sla_state.value,
            "slaRemainingHours": remaining_hours,
            "reportsCount": len(reports),
            "supportersCount": supporters_cnt,
            "hasSupported": has_supported,
            "isLinked": is_linked,
            "canVerify": can_verify,
            "canReopen": can_reopen,
            "reports": formatted_reports,
            "evidence": formatted_evidence,
            "isSeed": bool(issue["is_seed"]),
            "createdAt": issue["created_at"].isoformat() + "Z" if issue["created_at"] else None,
        }

    async def get_timeline(
        self, conn: aiomysql.Connection, issue_id: int, include_internal: bool = False
    ) -> list[dict[str, Any]]:
        visibilities = ["'public'"]
        if include_internal:
            visibilities.append("'internal'")

        sql = f"""
        SELECT u.id, u.update_type, u.from_status, u.to_status, u.visibility,
               u.note, u.next_step, u.created_at, act.name as actor_name
        FROM issue_updates u
        LEFT JOIN users act ON u.actor_id = act.id
        WHERE u.issue_id = %s AND u.visibility IN ({", ".join(visibilities)})
        ORDER BY u.created_at ASC
        """
        async with conn.cursor() as cur:
            await cur.execute(sql, (issue_id,))
            rows = await cur.fetchall()

        timeline = []
        for r in rows:
            timeline.append(
                {
                    "id": r["id"],
                    "updateType": r["update_type"],
                    "fromStatus": r["from_status"],
                    "toStatus": r["to_status"],
                    "visibility": r["visibility"],
                    "note": r["note"],
                    "nextStep": r["next_step"],
                    "actorName": r["actor_name"] or "System",
                    "createdAt": r["created_at"].isoformat() + "Z" if r["created_at"] else None,
                }
            )
        return timeline
