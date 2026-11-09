"""Reports repository for citizen submissions and spam detection."""

from typing import Any

import aiomysql

from app.core.config import settings
from app.core.constants import ReviewStatus, UpdateType
from app.core.errors import ConflictError, NotFoundError, ValidationError
from app.lib.geo import haversine_distance_m


class ReportRepository:
    async def check_spam(
        self, conn: aiomysql.Connection, user_id: int, description: str
    ) -> tuple[ReviewStatus, str | None]:
        """Check deterministic spam heuristics per SPEC 8.3."""
        if len(description.strip()) < 10:
            return ReviewStatus.FLAGGED, "Description is under 10 characters."

        async with conn.cursor() as cur:
            # Check 1: Identical description by the same user within 1 hour
            await cur.execute(
                """
                SELECT id FROM reports
                WHERE user_id = %s AND description = %s
                  AND created_at >= UTC_TIMESTAMP(3) - INTERVAL 1 HOUR
                LIMIT 1
                """,
                (user_id, description),
            )
            if await cur.fetchone():
                return ReviewStatus.FLAGGED, "Identical description submitted within 1 hour."

            # Check 2: More than 3 reports in 10 minutes by the same user
            await cur.execute(
                """
                SELECT COUNT(*) as cnt FROM reports
                WHERE user_id = %s AND created_at >= UTC_TIMESTAMP(3) - INTERVAL 10 MINUTE
                """,
                (user_id,),
            )
            count_recent = (await cur.fetchone())["cnt"]
            if count_recent >= 3:
                return ReviewStatus.FLAGGED, "More than 3 reports submitted within 10 minutes."

            # Check daily cap
            await cur.execute(
                """
                SELECT COUNT(*) as cnt FROM reports
                WHERE user_id = %s AND created_at >= UTC_TIMESTAMP(3) - INTERVAL 1 DAY
                """,
                (user_id,),
            )
            daily_count = (await cur.fetchone())["cnt"]
            if daily_count >= settings.MAX_REPORTS_PER_DAY:
                raise ValidationError(
                    f"Daily submission limit reached ({settings.MAX_REPORTS_PER_DAY} reports per day)."
                )

        return ReviewStatus.ACCEPTED, None

    async def create_new_issue_and_report(
        self,
        conn: aiomysql.Connection,
        user_id: int,
        ward_id: int,
        category_id: int,
        description: str,
        title: str,
        summary: str,
        latitude: float,
        longitude: float,
        address: str | None,
        image_url: str | None,
        image_key: str | None,
        ai_suggested_category_id: int | None,
        language: str | None,
        review_status: ReviewStatus,
        flag_reason: str | None,
    ) -> tuple[int, int, str]:
        """Create new issue, generate issue_code, insert primary report and initial support row."""
        is_public = 1 if review_status == ReviewStatus.ACCEPTED else 0

        async with conn.cursor() as cur:
            # Get default department for category
            await cur.execute(
                "SELECT default_department_id FROM categories WHERE id = %s",
                (category_id,),
            )
            cat_row = await cur.fetchone()
            if not cat_row:
                raise ValidationError("Invalid category selected.")
            department_id = cat_row["default_department_id"]

            # 1. Insert issues row
            await cur.execute(
                """
                INSERT INTO issues (
                    title, summary, description, category_id, ward_id, department_id,
                    latitude, longitude, address, status, priority, is_public, created_by,
                    created_at, updated_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'reported', 'medium', %s, %s, UTC_TIMESTAMP(3), UTC_TIMESTAMP(3))
                """,
                (
                    title[:160],
                    summary[:500] if summary else None,
                    description,
                    category_id,
                    ward_id,
                    department_id,
                    latitude,
                    longitude,
                    address,
                    is_public,
                    user_id,
                ),
            )
            issue_id = cur.lastrowid

            # 2. Update issue_code = CONCAT('CF-', LPAD(id, 3, '0'))
            await cur.execute(
                "UPDATE issues SET issue_code = CONCAT('CF-', LPAD(id, 3, '0')) WHERE id = %s",
                (issue_id,),
            )
            issue_code = f"CF-{issue_id:03d}"

            # 3. Insert report
            await cur.execute(
                """
                INSERT INTO reports (
                    issue_id, user_id, description, image_url, image_key, latitude, longitude,
                    address, chosen_category_id, ai_suggested_category_id, language,
                    review_status, flag_reason, is_primary, created_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 1, UTC_TIMESTAMP(3))
                """,
                (
                    issue_id,
                    user_id,
                    description,
                    image_url,
                    image_key,
                    latitude,
                    longitude,
                    address,
                    category_id,
                    ai_suggested_category_id,
                    language,
                    review_status.value,
                    flag_reason,
                ),
            )
            report_id = cur.lastrowid

            # 4. Insert initial support
            await cur.execute(
                "INSERT IGNORE INTO issue_support (issue_id, user_id, created_at) VALUES (%s, %s, UTC_TIMESTAMP(3))",
                (issue_id, user_id),
            )

            # 5. Insert issue_updates row
            await cur.execute(
                """
                INSERT INTO issue_updates (
                    issue_id, update_type, from_status, to_status, actor_id, visibility, note, created_at
                )
                VALUES (%s, %s, NULL, 'reported', %s, 'public', 'Issue reported by citizen', UTC_TIMESTAMP(3))
                """,
                (issue_id, UpdateType.REPORTED, user_id),
            )

        return issue_id, report_id, issue_code

    async def join_existing_issue(
        self,
        conn: aiomysql.Connection,
        issue_id: int,
        user_id: int,
        description: str,
        latitude: float,
        longitude: float,
        address: str | None,
        image_url: str | None,
        image_key: str | None,
        category_id: int,
        ai_suggested_category_id: int | None,
        language: str | None,
        review_status: ReviewStatus,
        flag_reason: str | None,
    ) -> tuple[int, int, int]:
        """Lock issue, verify proximity and state, insert report and support, return milestone count."""
        async with conn.cursor() as cur:
            await cur.execute(
                "SELECT id, status, latitude, longitude FROM issues WHERE id = %s FOR UPDATE",
                (issue_id,),
            )
            issue = await cur.fetchone()
            if not issue:
                raise NotFoundError(f"Issue {issue_id} not found to join.")

            if issue["status"] in ("resolved", "rejected"):
                raise ConflictError("Cannot join an issue that is already resolved or closed.")

            # Validate distance within DUP_RADIUS_M * 2 (don't trust client)
            max_allowed_dist = settings.DUP_RADIUS_M * 2.0
            dist = haversine_distance_m(latitude, longitude, issue["latitude"], issue["longitude"])
            if dist > max_allowed_dist:
                raise ValidationError(
                    f"Report location ({round(dist)}m) is too far from issue ({round(max_allowed_dist)}m max)."
                )

            # Insert report
            await cur.execute(
                """
                INSERT INTO reports (
                    issue_id, user_id, description, image_url, image_key, latitude, longitude,
                    address, chosen_category_id, ai_suggested_category_id, language,
                    review_status, flag_reason, is_primary, created_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 0, UTC_TIMESTAMP(3))
                """,
                (
                    issue_id,
                    user_id,
                    description,
                    image_url,
                    image_key,
                    latitude,
                    longitude,
                    address,
                    category_id,
                    ai_suggested_category_id,
                    language,
                    review_status.value,
                    flag_reason,
                ),
            )
            report_id = cur.lastrowid

            # Insert support
            await cur.execute(
                "INSERT IGNORE INTO issue_support (issue_id, user_id, created_at) VALUES (%s, %s, UTC_TIMESTAMP(3))",
                (issue_id, user_id),
            )

            # Get new supporter count
            await cur.execute(
                "SELECT COUNT(*) as cnt FROM issue_support WHERE issue_id = %s",
                (issue_id,),
            )
            supporters_count = (await cur.fetchone())["cnt"]

            # Write timeline update
            await cur.execute(
                """
                INSERT INTO issue_updates (
                    issue_id, update_type, actor_id, visibility, note, created_at
                )
                VALUES (%s, %s, %s, 'public', 'Additional report joined by neighbourhood resident', UTC_TIMESTAMP(3))
                """,
                (issue_id, UpdateType.REPORT_ADDED, user_id),
            )

        return issue_id, report_id, supporters_count

    async def list_user_reports(
        self, conn: aiomysql.Connection, user_id: int
    ) -> list[dict[str, Any]]:
        sql = """
        SELECT
            r.id,
            r.issue_id,
            i.issue_code,
            i.title as issue_title,
            i.status as issue_status,
            r.description,
            r.image_url,
            r.latitude,
            r.longitude,
            r.address,
            r.review_status,
            r.created_at,
            c.name as category_name
        FROM reports r
        JOIN issues i ON r.issue_id = i.id
        JOIN categories c ON r.chosen_category_id = c.id
        WHERE r.user_id = %s
        ORDER BY r.created_at DESC
        """
        async with conn.cursor() as cur:
            await cur.execute(sql, (user_id,))
            rows = await cur.fetchall()

        result = []
        for r in rows:
            result.append(
                {
                    "id": r["id"],
                    "issueId": r["issue_id"],
                    "issueCode": r["issue_code"] or f"CF-{r['issue_id']:03d}",
                    "issueTitle": r["issue_title"],
                    "issueStatus": r["issue_status"],
                    "categoryName": r["category_name"],
                    "description": r["description"],
                    "imageUrl": r["image_url"],
                    "latitude": r["latitude"],
                    "longitude": r["longitude"],
                    "address": r["address"],
                    "reviewStatus": r["review_status"],
                    "createdAt": r["created_at"].isoformat() + "Z" if r["created_at"] else None,
                }
            )
        return result
