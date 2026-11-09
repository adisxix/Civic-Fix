"""Text similarity calculation with Unicode-aware normalization."""

import re
import unicodedata

ENGLISH_STOP_WORDS = {
    "a",
    "an",
    "the",
    "and",
    "or",
    "in",
    "on",
    "at",
    "to",
    "for",
    "with",
    "by",
    "from",
    "is",
    "it",
    "this",
    "that",
    "of",
    "there",
    "near",
    "front",
    "road",
    "street",
    "area",
    "please",
    "help",
}

# Unicode-aware regex matching alphanumeric characters including Devanagari/Hindi
WORD_PATTERN = re.compile(r"[\w]+", re.UNICODE)


def normalize_text(text: str) -> str:
    """Normalize text using NFKC, lowercase, and clean spacing while preserving letters/combining marks."""
    if not text:
        return ""
    text = unicodedata.normalize("NFKC", text)
    text = text.lower()
    # Strip punctuation and symbols, preserving letters, combining marks (Hindi matras), numbers, spaces
    cleaned = "".join(
        c
        for c in text
        if not unicodedata.category(c).startswith("P")
        and not unicodedata.category(c).startswith("S")
    )
    tokens = cleaned.split()
    filtered = [t for t in tokens if t not in ENGLISH_STOP_WORDS]
    return " ".join(filtered)


def token_jaccard(tokens1: set[str], tokens2: set[str]) -> float:
    """Compute Jaccard similarity of two token sets."""
    if not tokens1 or not tokens2:
        return 0.0
    intersection = len(tokens1 & tokens2)
    union = len(tokens1 | tokens2)
    return intersection / union if union > 0 else 0.0


def char_trigram_dice(text1: str, text2: str) -> float:
    """Compute character 3-gram Dice coefficient."""
    if len(text1) < 3 or len(text2) < 3:
        return 1.0 if text1 == text2 and len(text1) > 0 else 0.0

    trigrams1 = {text1[i : i + 3] for i in range(len(text1) - 2)}
    trigrams2 = {text2[i : i + 3] for i in range(len(text2) - 2)}

    intersection = len(trigrams1 & trigrams2)
    total = len(trigrams1) + len(trigrams2)
    return (2.0 * intersection) / total if total > 0 else 0.0


def compute_text_similarity(text1: str, text2: str) -> float:
    """Calculate combined token Jaccard and character trigram Dice similarity."""
    norm1 = normalize_text(text1)
    norm2 = normalize_text(text2)

    if not norm1 or not norm2:
        return 0.0

    tokens1 = set(norm1.split())
    tokens2 = set(norm2.split())

    jaccard = token_jaccard(tokens1, tokens2)
    dice = char_trigram_dice(norm1, norm2)

    return 0.5 * jaccard + 0.5 * dice
