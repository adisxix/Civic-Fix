"""Reports service handling precheck, transactional submission, and notifications."""

from typing import Any

import aiomysql

from app.core.constants import NotificationType
from app.lib.storage.index import save_image
from app.modules.ai.ai_service import AiService
from app.modules.issues.issue_state_machine import (
    get_linked_user_ids,
    get_ward_admin_ids_for_ward,
)
from app.modules.notifications.service import notify
from app.modules.reports.duplicate_detection import find_duplicate_candidates
from app.modules.reports.repository import ReportRepository

report_repo = ReportRepository()
ai_service = AiService()


class ReportService:
    async def run_precheck(
        self,
        conn: aiomysql.Connection,
        description: str,
        latitude: float,
        longitude: float,
        category_id: int | None = None,
        user_id: int | None = None,
    ) -> dict[str, Any]:
        """Perform AI classification and duplicate search without writing to DB."""
        # 1. AI classification & summary
        suggestion = await ai_service.analyze_report(conn, description, user_id=user_id)

        effective_cat_id = category_id or suggestion.get("categoryId")

        # 2. Duplicate candidates (Stage 1)
        candidates = await find_duplicate_candidates(
            conn=conn,
            latitude=latitude,
            longitude=longitude,
            description=description,
            category_id=effective_cat_id,
        )

        # 3. Duplicate re-ranking (Stage 2)
        candidates_with_verdict = await ai_service.rank_duplicates(
            conn=conn,
            new_report_text=description,
            candidates=candidates,
            user_id=user_id,
        )

        return {
            "suggestion": suggestion,
            "candidates": candidates_with_verdict,
        }

    async def submit_report(
        self,
        conn: aiomysql.Connection,
        user: dict[str, Any],
        description: str,
        latitude: float,
        longitude: float,
        category_id: int,
        address: str | None = None,
        image_bytes: bytes | None = None,
        ai_suggested_category_id: int | None = None,
        join_issue_id: int | None = None,
    ) -> dict[str, Any]:
        """Handle new report submission or join existing issue cluster atomically."""
        user_id = user["id"]
        ward_id = user.get("ward_id") or 14

        # 1. Spam check
        review_status, flag_reason = await report_repo.check_spam(conn, user_id, description)

        # 2. Save image if provided
        image_url = None
        image_key = None
        if image_bytes:
            saved = await save_image(image_bytes, folder="reports")
            image_url = saved["url"]
            image_key = saved["key"]

        # 3. Join path vs Create-new path
        if join_issue_id:
            issue_id, report_id, supporters_cnt = await report_repo.join_existing_issue(
                conn=conn,
                issue_id=join_issue_id,
                user_id=user_id,
                description=description,
                latitude=latitude,
                longitude=longitude,
                address=address,
                image_url=image_url,
                image_key=image_key,
                category_id=category_id,
                ai_suggested_category_id=ai_suggested_category_id,
                language="en",
                review_status=review_status,
                flag_reason=flag_reason,
            )

            # Check support milestones (5, 10, 25)
            if supporters_cnt in (5, 10, 25):
                reporters = await get_linked_user_ids(conn, issue_id)
                await notify(
                    conn=conn,
                    user_ids=reporters,
                    notif_type=NotificationType.SUPPORT_MILESTONE,
                    title="Support Milestone Reached!",
                    body=f"Your neighbourhood issue now has {supporters_cnt} active supporters backing it.",
                    issue_id=issue_id,
                )

            return {
                "reportId": report_id,
                "issueId": issue_id,
                "joined": True,
                "supportersCount": supporters_cnt,
            }
        else:
            # Generate AI or template title & summary
            ai_data = await ai_service.analyze_report(conn, description, user_id=user_id)
            title = ai_data.get("title") or "Civic issue reported"
            summary = ai_data.get("summary")

            issue_id, report_id, issue_code = await report_repo.create_new_issue_and_report(
                conn=conn,
                user_id=user_id,
                ward_id=ward_id,
                category_id=category_id,
                description=description,
                title=title,
                summary=summary,
                latitude=latitude,
                longitude=longitude,
                address=address,
                image_url=image_url,
                image_key=image_key,
                ai_suggested_category_id=ai_suggested_category_id,
                language=ai_data.get("language", "en"),
                review_status=review_status,
                flag_reason=flag_reason,
            )

            # Notify ward admins in scope
            admin_ids = await get_ward_admin_ids_for_ward(conn, ward_id)
            await notify(
                conn=conn,
                user_ids=admin_ids,
                notif_type=NotificationType.NEW_REPORT,
                title="New Issue Reported",
                body=f"New issue {issue_code} ({title}) reported in your ward.",
                issue_id=issue_id,
            )

            return {
                "reportId": report_id,
                "issueId": issue_id,
                "issueCode": issue_code,
                "joined": False,
                "reviewStatus": review_status.value,
            }
