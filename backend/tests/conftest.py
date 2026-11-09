"""Pytest configuration and test fixtures."""

import sys
from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient

# Add backend directory to sys.path
backend_path = Path(__file__).resolve().parent.parent
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from app.main import app


@pytest.fixture
async def async_client():
    """Async HTTP test client."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client
