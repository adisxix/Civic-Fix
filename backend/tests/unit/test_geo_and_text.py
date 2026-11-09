"""Unit tests for geo distance and text similarity."""

from app.lib.geo import bounding_box_delats, haversine_distance_m
from app.lib.text_similarity import (
    char_trigram_dice,
    compute_text_similarity,
    normalize_text,
    token_jaccard,
)


def test_haversine_same_point():
    assert haversine_distance_m(12.9716, 77.5946, 12.9716, 77.5946) == 0.0


def test_haversine_known_distance():
    # Approx 111 meters per 0.001 deg latitude
    dist = haversine_distance_m(12.9716, 77.5946, 12.9726, 77.5946)
    assert 105.0 < dist < 115.0


def test_bounding_box_deltas():
    d_lat, d_lng = bounding_box_delats(12.9716, 150.0)
    assert d_lat > 0.0
    assert d_lng > 0.0


def test_normalize_text_english():
    raw = "The road is severely damaged with a huge pothole! Please help."
    norm = normalize_text(raw)
    assert "road" not in norm  # Stop word
    assert "pothole" in norm
    assert "damaged" in norm


def test_normalize_text_hindi():
    hindi_text = "सड़क पर बहुत बड़ा गड्ढा है।"
    norm = normalize_text(hindi_text)
    assert "सड़क" in norm
    assert "गड्ढा" in norm


def test_token_jaccard():
    s1 = {"pothole", "crater", "road"}
    s2 = {"pothole", "crater", "street"}
    score = token_jaccard(s1, s2)
    assert score == 0.5


def test_char_trigram_dice():
    score = char_trigram_dice("pothole", "potholes")
    assert score > 0.7


def test_compute_text_similarity():
    sim = compute_text_similarity("huge dangerous pothole", "dangerous pothole near junction")
    assert sim > 0.4
