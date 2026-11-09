"""Initialise MySQL database and user from init.sql using root credentials."""

import os
import sys
from pathlib import Path

import pymysql
from dotenv import load_dotenv

# Load environment
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", 3306))
DB_ROOT_USER = os.getenv("DB_ROOT_USER", "root")
DB_ROOT_PASSWORD = os.getenv("DB_ROOT_PASSWORD", "")
DB_SSL = os.getenv("DB_SSL", "false").lower() in ("true", "1", "yes")


def init_database() -> None:
    init_sql_path = Path(__file__).resolve().parent.parent / "db" / "init.sql"
    if not init_sql_path.exists():
        print(f"Error: {init_sql_path} does not exist.")
        sys.exit(1)

    print(f"Connecting to MySQL server at {DB_HOST}:{DB_PORT} as '{DB_ROOT_USER}'...")
    conn_kwargs = {
        "host": DB_HOST,
        "port": DB_PORT,
        "user": DB_ROOT_USER,
        "password": DB_ROOT_PASSWORD,
        "autocommit": True,
    }
    if DB_SSL:
        import ssl

        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        conn_kwargs["ssl"] = ctx

    try:
        conn = pymysql.connect(**conn_kwargs)
    except Exception as exc:
        print(f"Failed to connect to MySQL: {exc}")
        print("Please verify MySQL Server is running and root credentials in .env are correct.")
        sys.exit(1)

    with conn:
        with conn.cursor() as cur:
            with open(init_sql_path, encoding="utf-8") as f:
                content = f.read()

            statements = [s.strip() for s in content.split(";") if s.strip()]
            for stmt in statements:
                try:
                    cur.execute(stmt)
                    print(f"Executed: {stmt[:60]}...")
                except Exception as stmt_err:
                    print(f"Warning on '{stmt[:40]}...': {stmt_err}")

    print("\nDatabase initialisation completed successfully.")


if __name__ == "__main__":
    init_database()
