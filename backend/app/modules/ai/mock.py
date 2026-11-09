"""Deterministic fallback classifier and mock generator."""

from typing import Any

KEYWORD_MAP = {
    "pothole": [
        "pothole",
        "crater",
        "road",
        "gaddha",
        "asphalt",
        "tar",
        "pavement",
        "bump",
        "broken road",
        "divot",
    ],
    "streetlight": ["light", "lamp", "pole", "dark", "bulb", "streetlight", "flicker", "wire"],
    "garbage": ["garbage", "waste", "trash", "kachra", "bin", "dump", "litter", "smell", "rotting"],
    "drainage": [
        "drain",
        "sewer",
        "waterlog",
        "naali",
        "overflow",
        "gutters",
        "clogged",
        "flooding",
    ],
    "water_leakage": [
        "leak",
        "pipe",
        "water",
        "pipeline",
        "valve",
        "supply",
        "burst",
        "drinking water",
    ],
}


def classify_text_locally(text: str) -> dict[str, Any]:
    """Deterministic keyword-based classification with template title & summary."""
    lower_text = text.lower()
    matched_code = "pothole"
    max_matches = 0

    for code, keywords in KEYWORD_MAP.items():
        matches = sum(1 for kw in keywords if kw in lower_text)
        if matches > max_matches:
            max_matches = matches
            matched_code = code

    # Infer language (simple check for Devanagari range)
    is_hindi = any("\u0900" <= char <= "\u097f" for char in text)
    language = "hi" if is_hindi else "en"

    # Category readable titles
    titles = {
        "pothole": "Road damage or pothole reported",
        "streetlight": "Streetlight failure or outage",
        "garbage": "Overflowing waste or garbage pile",
        "drainage": "Blocked drainage or waterlogging",
        "water_leakage": "Water supply pipeline leakage",
    }

    # Clean description snippet for title
    words = text.strip().split()
    snippet = " ".join(words[:6]) if words else "Civic issue"
    title = f"{titles.get(matched_code, 'Civic issue')} ({snippet})"[:80]
    summary = (
        f"Issue reported regarding {matched_code.replace('_', ' ')} in the locality: {text[:150]}"[
            :200
        ]
    )

    return {
        "categoryCode": matched_code,
        "title": title,
        "summary": summary,
        "priorityHint": "medium",
        "keywords": [w for w in words[:5] if len(w) > 3],
        "language": language,
        "confidence": "medium",
        "source": "fallback",
    }


def rank_duplicates_locally(candidates: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Local fallback duplicate re-ranking."""
    ranked = []
    for c in candidates:
        ranked.append(
            {
                "issueId": c["issueId"],
                "sameProblem": c["score"] >= 0.50,
                "confidence": "medium" if c["score"] >= 0.50 else "low",
                "reason": f"Located within {c['distanceM']}m in same locality",
            }
        )
    return ranked


def summarize_reports_locally(reports: list[dict[str, Any]]) -> dict[str, Any]:
    """Local multi-report summary fallback."""
    count = len(reports)
    summary = f"Cluster of {count} report(s) submitted by neighbourhood residents."
    recurring = ["Repeated mentions of civic obstruction", "Local community impact"]
    return {
        "summary": summary[:240],
        "recurringDetails": recurring,
        "source": "fallback",
    }
