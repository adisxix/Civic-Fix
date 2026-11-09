"""Deterministic candidate duplicate detection (Stage 1)."""

from typing import Any

import aiomysql

from app.core.config import settings
from app.lib.geo import bounding_box_delats, haversine_distance_m
from app.lib.text_similarity import compute_text_similarity


async def find_duplicate_candidates(
    conn: aiomysql.Connection,
    latitude: float,
    longitude: float,
    description: str,
    category_id: int | None = None,
    department_id: int | None = None,
) -> list[dict[str, Any]]:
    """
    Find nearby and similar candidate issues for duplicate clustering.
    Stage 1: Deterministic geospatial bbox, exact haversine, and text similarity.
    """
    radius_m = settings.DUP_RADIUS_M
    d_lat, d_lng = bounding_box_delats(latitude, radius_m)

    min_lat = latitude - d_lat
    max_lat = latitude + d_lat
    min_lng = longitude - d_lng
    max_lng = longitude + d_lng

    # Pre-filter query
    query = """
    SELECT
        i.id,
        i.issue_code,
        i.title,
        i.summary,
        i.description,
        i.category_id,
        i.department_id,
        i.status,
        i.latitude,
        i.longitude,
        i.created_at,
        (SELECT COUNT(*) FROM issue_support s WHERE s.issue_id = i.id) AS supporters_count,
        (SELECT r.image_url FROM reports r WHERE r.issue_id = i.id AND r.is_primary = 1 LIMIT 1) AS image_url
    FROM issues i
    WHERE i.is_public = 1
      AND i.status IN ('reported', 'assigned', 'in_progress', 'awaiting_verification', 'reopened')
      AND i.latitude BETWEEN %s AND %s
      AND i.longitude BETWEEN %s AND %s
      AND i.created_at >= UTC_TIMESTAMP(3) - INTERVAL %s DAY
    """
    params: list[Any] = [min_lat, max_lat, min_lng, max_lng, settings.DUP_LOOKBACK_DAYS]

    if category_id is not None and department_id is not None:
        query += " AND (i.category_id = %s OR i.department_id = %s)"
        params.extend([category_id, department_id])
    elif category_id is not None:
        query += " AND i.category_id = %s"
        params.append(category_id)

    query += " ORDER BY i.id DESC LIMIT 200"

    async with conn.cursor() as cur:
        await cur.execute(query, params)
        rows = await cur.fetchall()

    candidates = []
    for row in rows:
        dist_m = haversine_distance_m(latitude, longitude, row["latitude"], row["longitude"])
        if dist_m > radius_m:
            continue

        target_text = f"{row['title']} {row['description']} {row['summary'] or ''}"
        text_sim = compute_text_similarity(description, target_text)

        same_category = 1.0 if category_id and row["category_id"] == category_id else 0.0

        # Score formula per SPEC 10.1
        score = 0.50 * (1.0 - (dist_m / radius_m)) + 0.35 * text_sim + 0.15 * same_category

        if score >= settings.DUP_MIN_SCORE:
            candidates.append(
                {
                    "issueId": row["id"],
                    "issueCode": row["issue_code"] or f"CF-{row['id']:03d}",
                    "title": row["title"],
                    "summary": row["summary"],
                    "distanceM": round(dist_m),
                    "status": row["status"],
                    "supportersCount": row["supporters_count"],
                    "imageUrl": row["image_url"],
                    "score": score,
                    "sameCategory": bool(same_category),
                }
            )

    # Sort descending by score and keep top DUP_MAX_CANDIDATES
    candidates.sort(key=lambda c: c["score"], reverse=True)
    return candidates[: settings.DUP_MAX_CANDIDATES]
