"""Unit tests for health endpoint, error envelope, and security."""

import pytest

from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)


def test_password_hashing():
    pw = "SecretPassword123!"
    hashed = hash_password(pw)
    assert hashed != pw
    assert verify_password(pw, hashed) is True
    assert verify_password("WrongPassword", hashed) is False


def test_jwt_token_flow():
    token = create_access_token(user_id=42, role="citizen")
    payload = decode_access_token(token)
    assert payload["sub"] == "42"
    assert payload["role"] == "citizen"


@pytest.mark.asyncio
async def test_health_endpoint(async_client):
    res = await async_client.get("/api/v1/health")
    assert res.status_code == 200
    body = res.json()
    assert "data" in body
    assert body["data"]["status"] == "ok"


@pytest.mark.asyncio
async def test_unauthorized_protected_endpoint(async_client):
    res = await async_client.get("/api/v1/notifications")
    assert res.status_code == 401
    body = res.json()
    assert "error" in body
    assert body["error"]["code"] == "UNAUTHORIZED"
