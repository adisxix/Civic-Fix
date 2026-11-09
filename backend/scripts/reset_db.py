"""Database reset script (dev only). Drops and recreates database schema."""

import os
import sys
from pathlib import Path

import pymysql
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

APP_ENV = os.getenv("APP_ENV", "development")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", 3306))
DB_USER = os.getenv("DB_USER", "civicfix")
DB_PASSWORD = os.getenv("DB_PASSWORD", "civicfix")
DB_NAME = os.getenv("DB_NAME", "civicfix")


def reset_database() -> None:
    if APP_ENV == "production":
        print("Refusing to reset database in production environment!")
        sys.exit(1)

    print(f"Resetting database '{DB_NAME}' on {DB_HOST}:{DB_PORT}...")
    try:
        conn = pymysql.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            db=DB_NAME,
            charset="utf8mb4",
            autocommit=True,
        )
    except Exception as exc:
        print(f"Failed to connect: {exc}")
        sys.exit(1)

    with conn:
        with conn.cursor() as cur:
            cur.execute("SET FOREIGN_KEY_CHECKS = 0")
            cur.execute("SHOW TABLES")
            tables = [r[0] for r in cur.fetchall()]
            for tbl in tables:
                print(f"Dropping table '{tbl}'...")
                cur.execute(f"DROP TABLE IF EXISTS `{tbl}`")
            cur.execute("SET FOREIGN_KEY_CHECKS = 1")

    print("Tables dropped. Running migrations now...")
    from backend.scripts.migrate import run_migrations

    run_migrations()


if __name__ == "__main__":
    reset_database()
