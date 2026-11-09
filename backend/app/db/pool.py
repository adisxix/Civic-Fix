"""aiomysql asynchronous connection pool manager."""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

import aiomysql
from aiomysql.cursors import DictCursor

from app.core.config import settings
from app.core.logging import logger

_pool: aiomysql.Pool | None = None


async def init_pool(db_name: str | None = None) -> aiomysql.Pool:
    """Initialize aiomysql connection pool."""
    global _pool
    target_db = db_name or settings.DB_NAME
    try:
        _pool = await aiomysql.create_pool(
            host=settings.DB_HOST,
            port=settings.DB_PORT,
            user=settings.DB_USER,
            password=settings.DB_PASSWORD,
            db=target_db,
            charset="utf8mb4",
            autocommit=False,
            cursorclass=DictCursor,
            minsize=1,
            maxsize=10,
        )
        logger.info("Database connection pool initialized", db=target_db)
        return _pool
    except Exception as exc:
        logger.warning(
            "Database connection could not be established at startup",
            db=target_db,
            error=str(exc),
        )
        _pool = None
        return None  # Gracefully allow app to start and report via /health


async def close_pool() -> None:
    """Close aiomysql connection pool."""
    global _pool
    if _pool is not None:
        _pool.close()
        await _pool.wait_closed()
        _pool = None
        logger.info("Database connection pool closed")


def get_pool() -> aiomysql.Pool | None:
    return _pool


@asynccontextmanager
async def get_db_connection() -> AsyncGenerator[aiomysql.Connection, None]:
    """Acquire a connection from the pool and enforce UTC timezone."""
    pool = get_pool()
    if pool is None:
        raise RuntimeError("Database pool is not initialized or database is unreachable.")

    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SET time_zone = '+00:00'")
        yield conn


async def check_db_health() -> bool:
    """Ping MySQL database."""
    pool = get_pool()
    if pool is None:
        return False
    try:
        async with pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute("SELECT 1")
                res = await cur.fetchone()
                return res is not None
    except Exception:
        return False
