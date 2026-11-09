"""Migration runner applying SQL scripts and tracking applied versions."""

import os
import sys
from pathlib import Path

import pymysql
import sqlparse
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", 3306))
DB_USER = os.getenv("DB_USER", "civicfix")
DB_PASSWORD = os.getenv("DB_PASSWORD", "civicfix")
DB_NAME = os.getenv("DB_NAME", "civicfix")
DB_SSL = os.getenv("DB_SSL", "false").lower() in ("true", "1", "yes")


def run_migrations(target_db: str | None = None) -> None:
    db = target_db or DB_NAME
    print(f"Connecting to MySQL database '{db}' as '{DB_USER}'...")
    conn_kwargs = {
        "host": DB_HOST,
        "port": DB_PORT,
        "user": DB_USER,
        "password": DB_PASSWORD,
        "db": db,
        "charset": "utf8mb4",
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
        print(f"Connection failed: {exc}")
        sys.exit(1)

    migrations_dir = Path(__file__).resolve().parent.parent / "db" / "migrations"
    migration_files = sorted(migrations_dir.glob("*.sql"))

    with conn:
        with conn.cursor() as cur:
            # Create schema_migrations table if not exists
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS schema_migrations (
                    version VARCHAR(100) NOT NULL PRIMARY KEY,
                    applied_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                """
            )

            cur.execute("SELECT version FROM schema_migrations")
            applied = {row[0] for row in cur.fetchall()}

            for mf in migration_files:
                version = mf.stem
                if version in applied:
                    print(f"Migration '{version}' already applied. Skipping.")
                    continue

                print(f"Applying migration '{version}' from {mf.name}...")
                with open(mf, encoding="utf-8") as f:
                    content = f.read()

                statements = sqlparse.split(content)
                for stmt in statements:
                    cleaned = stmt.strip()
                    if cleaned:
                        cur.execute(cleaned)

                # Record version after complete success
                cur.execute(
                    "INSERT INTO schema_migrations (version, applied_at) VALUES (%s, UTC_TIMESTAMP(3))",
                    (version,),
                )
                print(f"Successfully applied migration '{version}'.")

    print("\nAll migrations up to date.")


if __name__ == "__main__":
    run_migrations()
