"""Haversine distance calculation in Python."""

import math

EARTH_RADIUS_M = 6371000.0


def haversine_distance_m(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Compute the great-circle distance between two points in meters using Haversine formula."""
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lng2 - lng1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    return EARTH_RADIUS_M * c


def bounding_box_delats(lat: float, radius_m: float) -> tuple[float, float]:
    """Calculate delta latitude and delta longitude for a bounding box filter."""
    d_lat = radius_m / 111320.0
    cos_lat = math.cos(math.radians(lat))
    if abs(cos_lat) < 1e-6:
        d_lng = 180.0
    else:
        d_lng = radius_m / (111320.0 * cos_lat)
    return d_lat, d_lng
