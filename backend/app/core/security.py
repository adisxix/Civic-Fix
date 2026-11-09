"""Password hashing and JWT generation / verification."""

from datetime import UTC, datetime, timedelta
from typing import Any

import bcrypt
import jwt

from app.core.config import settings
from app.core.errors import UnauthorizedError


def hash_password(password: str) -> str:
    """Hash password using bcrypt with minimum cost 10."""
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against bcrypt hash."""
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


def create_access_token(user_id: int, role: str, expires_delta: timedelta | None = None) -> str:
    """Create a signed JWT token."""
    expire = datetime.now(UTC) + (expires_delta if expires_delta else timedelta(days=7))
    payload = {
        "sub": str(user_id),
        "role": role,
        "exp": expire,
        "iat": datetime.now(UTC),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")


def decode_access_token(token: str) -> dict[str, Any]:
    """Decode and validate signed JWT token."""
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
    except jwt.ExpiredSignatureError as err:
        raise UnauthorizedError("Session has expired. Please log in again.") from err
    except jwt.InvalidTokenError as err:
        raise UnauthorizedError("Invalid authentication credentials.") from err
