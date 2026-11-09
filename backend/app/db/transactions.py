"""Transaction context manager with deadlock retry."""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

import aiomysql

from app.core.logging import logger
from app.db.pool import get_db_connection

DEADLOCK_ERROR_CODE = 1213  # ER_LOCK_DEADLOCK


@asynccontextmanager
async def with_transaction() -> AsyncGenerator[aiomysql.Connection, None]:
    """Execute a block within an async database transaction with 1 deadlock retry."""
    max_attempts = 2
    for attempt in range(1, max_attempts + 1):
        async with get_db_connection() as conn:
            try:
                await conn.begin()
                yield conn
                await conn.commit()
                return
            except aiomysql.Error as err:
                await conn.rollback()
                err_code = err.args[0] if err.args else None
                if err_code == DEADLOCK_ERROR_CODE and attempt < max_attempts:
                    logger.warning(
                        "Deadlock encountered, retrying transaction",
                        attempt=attempt,
                        error=str(err),
                    )
                    continue
                logger.error("Transaction rolled back due to error", error=str(err))
                raise
            except Exception as err:
                await conn.rollback()
                logger.error("Transaction rolled back due to unhandled error", error=str(err))
                raise
