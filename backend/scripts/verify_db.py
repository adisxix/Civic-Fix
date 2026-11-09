"""Database sanity verification script."""

import os
import sys
from pathlib import Path

import pymysql
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", 3306))
DB_USER = os.getenv("DB_USER", "civicfix")
DB_PASSWORD = os.getenv("DB_PASSWORD", "civicfix")
DB_NAME = os.getenv("DB_NAME", "civicfix")


def verify_database() -> None:
    print(f"--- CIVICFIX DATABASE SANITY CHECK ({DB_NAME}) ---")
    try:
        conn = pymysql.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            db=DB_NAME,
            charset="utf8mb4",
        )
    except Exception as exc:
        print(f"Failed to connect: {exc}")
        sys.exit(1)

    tables = [
        "wards",
        "departments",
        "categories",
        "users",
        "issues",
        "reports",
        "issue_support",
        "assignments",
        "issue_updates",
        "evidence",
        "resolution_feedback",
        "notifications",
        "ai_logs",
    ]

    with conn:
        with conn.cursor() as cur:
            print("\n1. Table Row Counts:")
            for tbl in tables:
                try:
                    cur.execute(f"SELECT COUNT(*) FROM `{tbl}`")
                    cnt = cur.fetchone()[0]
                    print(f"  - {tbl:<20}: {cnt}")
                except Exception as e:
                    print(f"  - {tbl:<20}: [Missing/Error] {e}")

            print("\n2. Issues by Status:")
            cur.execute(
                "SELECT status, COUNT(*) FROM issues GROUP BY status ORDER BY COUNT(*) DESC"
            )
            for status, count in cur.fetchall():
                print(f"  - {status:<22}: {count}")

            print("\n3. Hero Issue #CF-024 Check:")
            cur.execute(
                """
                SELECT i.id, i.issue_code, i.title, i.status, i.assigned_to, u.name as assignee,
                       (SELECT COUNT(*) FROM reports WHERE issue_id = i.id) as rep_cnt,
                       (SELECT COUNT(*) FROM issue_support WHERE issue_id = i.id) as sup_cnt
                FROM issues i
                LEFT JOIN users u ON i.assigned_to = u.id
                WHERE i.id = 24
                """
            )
            hero = cur.fetchone()
            if hero:
                print(f"  - Code        : {hero[1]}")
                print(f"  - Title       : {hero[2]}")
                print(f"  - Status      : {hero[3]}")
                print(f"  - Assignee    : {hero[5]}")
                print(f"  - Reports     : {hero[6]} (Expected: 5)")
                print(f"  - Supporters  : {hero[7]} (Expected: 12)")
            else:
                print("  - [WARNING] Hero Issue #CF-024 not found!")

            print("\n4. Orphan Checks:")
            cur.execute(
                "SELECT COUNT(*) FROM reports r LEFT JOIN issues i ON r.issue_id = i.id WHERE i.id IS NULL"
            )
            orphan_reports = cur.fetchone()[0]
            cur.execute(
                "SELECT COUNT(*) FROM issue_support s LEFT JOIN issues i ON s.issue_id = i.id WHERE i.id IS NULL"
            )
            orphan_support = cur.fetchone()[0]
            print(f"  - Orphan Reports : {orphan_reports}")
            print(f"  - Orphan Support : {orphan_support}")

    print("\n--- SANITY CHECK COMPLETED ---\n")


if __name__ == "__main__":
    verify_database()
