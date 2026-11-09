"""AI service orchestrating Groq/Gemini calls and local fallbacks."""

import hashlib
import json
import time
from typing import Any

import aiomysql

from app.core.config import settings
from app.core.logging import logger
from app.modules.ai.gemini_client import GeminiClient
from app.modules.ai.groq_client import GroqClient
from app.modules.ai.mock import (
    classify_text_locally,
    summarize_reports_locally,
)

groq = GroqClient()
gemini = GeminiClient()


def get_active_client() -> tuple[Any, str, str]:
    """Return active AI client, provider name ('groq' | 'gemini' | 'mock'), and model name."""
    if (settings.AI_PROVIDER == "groq" or not settings.GEMINI_API_KEY) and groq.is_available():
        return groq, "groq", settings.GROQ_MODEL
    if gemini.is_available():
        return gemini, "gemini", settings.GEMINI_MODEL
    if groq.is_available():
        return groq, "groq", settings.GROQ_MODEL
    return None, "mock", "local-fallback"


def hash_input(text: str) -> str:
    """Hash user input with SHA-256 to avoid storing personal data in ai_logs."""
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


async def log_ai_call(
    conn: aiomysql.Connection,
    operation: str,
    user_id: int | None,
    issue_id: int | None,
    input_text: str,
    model: str,
    output: Any,
    status: str,
    latency_ms: int,
) -> None:
    """Log an AI invocation to ai_logs."""
    try:
        input_hash = hash_input(input_text)
        out_json = json.dumps(output) if output is not None else None
        async with conn.cursor() as cur:
            await cur.execute(
                """
                INSERT INTO ai_logs (operation, user_id, issue_id, input_hash, model, output, status, latency_ms, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, UTC_TIMESTAMP(3))
                """,
                (operation, user_id, issue_id, input_hash, model, out_json, status, latency_ms),
            )
            await conn.commit()
    except Exception as exc:
        logger.warning("Failed to write to ai_logs", error=str(exc))


class AiService:
    async def analyze_report(
        self,
        conn: aiomysql.Connection,
        description: str,
        user_id: int | None = None,
    ) -> dict[str, Any]:
        """Classify report, suggest category, generate title and summary."""
        async with conn.cursor() as cur:
            await cur.execute("SELECT code, id FROM categories ORDER BY id ASC")
            rows = await cur.fetchall()
            cat_map = {r["code"]: r["id"] for r in rows}
            category_codes = list(cat_map.keys())

        client, provider, model = get_active_client()
        start_time = time.time()

        if client is not None:
            try:
                res = await client.classify_report(description, category_codes)
                latency = int((time.time() - start_time) * 1000)
                if res.category_code in cat_map:
                    data = {
                        "categoryCode": res.category_code,
                        "categoryId": cat_map[res.category_code],
                        "title": res.title[:80],
                        "summary": res.summary[:200],
                        "priorityHint": res.priority_hint,
                        "keywords": res.keywords,
                        "language": res.language,
                        "confidence": res.confidence,
                        "source": provider,
                    }
                    await log_ai_call(
                        conn,
                        "classify",
                        user_id,
                        None,
                        description,
                        model,
                        data,
                        "ok",
                        latency,
                    )
                    return data
            except Exception as exc:
                logger.warning(
                    f"{provider.capitalize()} classification failed, degrading to fallback",
                    error=str(exc),
                )
                latency = int((time.time() - start_time) * 1000)
                await log_ai_call(
                    conn,
                    "classify",
                    user_id,
                    None,
                    description,
                    model,
                    None,
                    "fallback",
                    latency,
                )

        # Fallback local deterministic classifier
        data = classify_text_locally(description)
        data["categoryId"] = cat_map.get(data["categoryCode"], 1)
        latency = int((time.time() - start_time) * 1000)
        await log_ai_call(
            conn,
            "classify",
            user_id,
            None,
            description,
            "local-fallback",
            data,
            "fallback",
            latency,
        )
        return data

    async def rank_duplicates(
        self,
        conn: aiomysql.Connection,
        new_report_text: str,
        candidates: list[dict[str, Any]],
        user_id: int | None = None,
    ) -> list[dict[str, Any]]:
        """Re-rank candidate issues using Groq/Gemini, or fallback."""
        if not candidates:
            return []

        start_time = time.time()
        candidate_ids = {c["issueId"] for c in candidates}
        client, provider, model = get_active_client()

        if client is not None:
            try:
                verdicts = await client.re_rank_duplicates(new_report_text, candidates)
                latency = int((time.time() - start_time) * 1000)
                verdict_map = {v.issue_id: v for v in verdicts if v.issue_id in candidate_ids}
                for c in candidates:
                    v = verdict_map.get(c["issueId"])
                    if v:
                        c["aiVerdict"] = {
                            "sameProblem": v.same_problem,
                            "confidence": v.confidence,
                            "reason": v.reason[:200],
                            "source": provider,
                        }
                    else:
                        c["aiVerdict"] = {
                            "sameProblem": c["score"] >= 0.50,
                            "confidence": "medium" if c["score"] >= 0.50 else "low",
                            "reason": f"{c['distanceM']} m away in the same locality",
                            "source": "fallback",
                        }
                await log_ai_call(
                    conn,
                    "duplicates",
                    user_id,
                    None,
                    new_report_text,
                    model,
                    candidates,
                    "ok",
                    latency,
                )
                return candidates
            except Exception as exc:
                logger.warning(
                    f"{provider.capitalize()} duplicate re-ranking failed, degrading to fallback",
                    error=str(exc),
                )
                latency = int((time.time() - start_time) * 1000)
                await log_ai_call(
                    conn,
                    "duplicates",
                    user_id,
                    None,
                    new_report_text,
                    model,
                    None,
                    "fallback",
                    latency,
                )

        # Fallback ranking based on spatial + lexical scores
        for c in candidates:
            c["aiVerdict"] = {
                "sameProblem": c["score"] >= 0.50,
                "confidence": "medium" if c["score"] >= 0.50 else "low",
                "reason": f"{c['distanceM']} m away in the same locality",
                "source": "fallback",
            }
        latency = int((time.time() - start_time) * 1000)
        await log_ai_call(
            conn,
            "duplicates",
            user_id,
            None,
            new_report_text,
            "local-fallback",
            candidates,
            "fallback",
            latency,
        )
        return candidates

    async def summarize_issue(
        self,
        conn: aiomysql.Connection,
        issue_id: int,
        user_id: int | None = None,
    ) -> dict[str, Any]:
        """Generate or regenerate multi-report issue summary."""
        async with conn.cursor() as cur:
            await cur.execute(
                "SELECT description FROM reports WHERE issue_id = %s ORDER BY id ASC",
                (issue_id,),
            )
            reports = await cur.fetchall()

        if not reports:
            return {
                "summary": "No reports found for this issue.",
                "recurringDetails": [],
                "source": "fallback",
            }

        reports_text = [r["description"] for r in reports]
        combined_text = "\n".join(reports_text)
        start_time = time.time()
        client, provider, model = get_active_client()

        if client is not None:
            try:
                res = await client.summarize_cluster(reports_text)
                latency = int((time.time() - start_time) * 1000)
                data = {
                    "summary": res.summary[:240],
                    "recurringDetails": res.recurring_details,
                    "source": provider,
                }
                await log_ai_call(
                    conn,
                    "summarize",
                    user_id,
                    issue_id,
                    combined_text,
                    model,
                    data,
                    "ok",
                    latency,
                )
                return data
            except Exception as exc:
                logger.warning(
                    f"{provider.capitalize()} issue summary failed",
                    error=str(exc),
                )
                latency = int((time.time() - start_time) * 1000)
                await log_ai_call(
                    conn,
                    "summarize",
                    user_id,
                    issue_id,
                    combined_text,
                    model,
                    None,
                    "fallback",
                    latency,
                )

        # Fallback
        data = summarize_reports_locally([{"description": t} for t in reports_text])
        latency = int((time.time() - start_time) * 1000)
        await log_ai_call(
            conn,
            "summarize",
            user_id,
            issue_id,
            combined_text,
            "local-fallback",
            data,
            "fallback",
            latency,
        )
        return data
