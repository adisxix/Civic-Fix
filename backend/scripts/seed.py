"""Database seeding script implementing SPEC 15."""

import datetime
import os
import random
import shutil
import sys
from datetime import timedelta
from pathlib import Path

import bcrypt
import pymysql
from dotenv import load_dotenv
from PIL import Image, ImageDraw

env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", 3306))
DB_USER = os.getenv("DB_USER", "civicfix")
DB_PASSWORD = os.getenv("DB_PASSWORD", "civicfix")
DB_NAME = os.getenv("DB_NAME", "civicfix")
DB_SSL = os.getenv("DB_SSL", "false").lower() in ("true", "1", "yes")
SEED_DEMO_USERS = os.getenv("SEED_DEMO_USERS", "true").lower() == "true"
DEMO_CENTER_LAT = float(os.getenv("DEMO_CENTER_LAT", 12.9716))
DEMO_CENTER_LNG = float(os.getenv("DEMO_CENTER_LNG", 77.5946))


def hash_pw(pw: str) -> str:
    return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt(10)).decode("utf-8")


def generate_placeholder_image(
    text: str, bg_color: tuple[int, int, int], filename: str
) -> tuple[str, str]:
    assets_dir = Path(__file__).resolve().parent.parent / "db" / "seeds" / "assets"
    uploads_dir = Path(__file__).resolve().parent.parent / "uploads" / "seed"
    assets_dir.mkdir(parents=True, exist_ok=True)
    uploads_dir.mkdir(parents=True, exist_ok=True)

    filepath = assets_dir / filename
    img = Image.new("RGB", (800, 600), color=bg_color)
    draw = ImageDraw.Draw(img)

    # Draw border
    draw.rectangle([10, 10, 790, 590], outline=(255, 255, 255), width=3)
    draw.text((40, 280), text, fill=(255, 255, 255))

    img.save(filepath, format="WEBP", quality=80)
    # Copy to uploads so local server serves it
    shutil.copy(filepath, uploads_dir / filename)

    key = f"seed/{filename}"
    url = f"/uploads/{key}"
    return url, key


def seed_database() -> None:
    print(f"Seeding database '{DB_NAME}' with demo data...")
    conn_kwargs = {
        "host": DB_HOST,
        "port": DB_PORT,
        "user": DB_USER,
        "password": DB_PASSWORD,
        "db": DB_NAME,
        "charset": "utf8mb4",
        "autocommit": False,
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
        print(f"Database connection failed: {exc}")
        sys.exit(1)

    with conn:
        with conn.cursor() as cur:
            # 1. Clean existing seed data idempotently
            print("Cleaning existing seed records...")
            cur.execute("SET FOREIGN_KEY_CHECKS = 0")
            cur.execute("DELETE FROM issues WHERE is_seed = 1")
            cur.execute("DELETE FROM users WHERE is_seed = 1")
            cur.execute("SET FOREIGN_KEY_CHECKS = 1")

            # 2. Seed Users
            print("Creating demo users...")
            demo_pw_hash = hash_pw("Demo@1234")

            users_data = [
                # Asha - primary demo citizen
                (
                    "Asha Sharma",
                    "asha@demo.civicfix.org",
                    demo_pw_hash,
                    "9876543210",
                    "citizen",
                    14,
                    None,
                ),
                # Supporters & reporters
                (
                    "Ravi Kumar",
                    "ravi@demo.civicfix.org",
                    demo_pw_hash,
                    "9876543211",
                    "citizen",
                    14,
                    None,
                ),
                (
                    "Meera Rao",
                    "meera@demo.civicfix.org",
                    demo_pw_hash,
                    "9876543212",
                    "citizen",
                    14,
                    None,
                ),
                (
                    "Karthik S",
                    "karthik@demo.civicfix.org",
                    demo_pw_hash,
                    "9876543213",
                    "citizen",
                    14,
                    None,
                ),
                (
                    "Priya Nair",
                    "priya@demo.civicfix.org",
                    demo_pw_hash,
                    "9876543214",
                    "citizen",
                    14,
                    None,
                ),
                (
                    "Arjun Patel",
                    "arjun@demo.civicfix.org",
                    demo_pw_hash,
                    "9876543215",
                    "citizen",
                    14,
                    None,
                ),
                (
                    "Sunita Verma",
                    "sunita@demo.civicfix.org",
                    demo_pw_hash,
                    "9876543216",
                    "citizen",
                    14,
                    None,
                ),
                (
                    "Deepak Joshi",
                    "deepak@demo.civicfix.org",
                    demo_pw_hash,
                    "9876543217",
                    "citizen",
                    14,
                    None,
                ),
                (
                    "Ananya Roy",
                    "ananya@demo.civicfix.org",
                    demo_pw_hash,
                    "9876543218",
                    "citizen",
                    14,
                    None,
                ),
                (
                    "Vikram Reddy",
                    "vikram@demo.civicfix.org",
                    demo_pw_hash,
                    "9876543219",
                    "citizen",
                    14,
                    None,
                ),
                # Ward admins
                (
                    "Ward 14 Lead",
                    "ward14.lead@demo.civicfix.org",
                    demo_pw_hash,
                    "9876543220",
                    "ward_admin",
                    14,
                    None,
                ),
                (
                    "Roads Officer",
                    "roads@demo.civicfix.org",
                    demo_pw_hash,
                    "9876543221",
                    "ward_admin",
                    14,
                    1,
                ),
                (
                    "Lighting Officer",
                    "lighting@demo.civicfix.org",
                    demo_pw_hash,
                    "9876543222",
                    "ward_admin",
                    14,
                    2,
                ),
                (
                    "Sanitation Officer",
                    "sanitation@demo.civicfix.org",
                    demo_pw_hash,
                    "9876543223",
                    "ward_admin",
                    14,
                    3,
                ),
                (
                    "Drainage Officer",
                    "drainage@demo.civicfix.org",
                    demo_pw_hash,
                    "9876543224",
                    "ward_admin",
                    14,
                    4,
                ),
                (
                    "Water Officer",
                    "water@demo.civicfix.org",
                    demo_pw_hash,
                    "9876543225",
                    "ward_admin",
                    14,
                    5,
                ),
                (
                    "City Administrator",
                    "cityview@demo.civicfix.org",
                    demo_pw_hash,
                    "9876543226",
                    "ward_admin",
                    None,
                    None,
                ),
            ]

            user_ids = {}
            for name, email, pw, phone, role, ward_id, dept_id in users_data:
                cur.execute(
                    """
                    INSERT INTO users (name, email, password_hash, phone, role, ward_id, department_id, is_active, is_seed, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, 1, 1, UTC_TIMESTAMP(3))
                    """,
                    (name, email, pw, phone, role, ward_id, dept_id),
                )
                user_ids[email] = cur.lastrowid

            asha_id = user_ids["asha@demo.civicfix.org"]
            roads_officer_id = user_ids["roads@demo.civicfix.org"]
            ward_lead_id = user_ids["ward14.lead@demo.civicfix.org"]

            # Generate placeholder images
            pothole_img, pothole_key = generate_placeholder_image(
                "Pothole Evidence #CF-024", (180, 80, 60), "pothole_hero.webp"
            )
            after_img, after_key = generate_placeholder_image(
                "Pothole Repair Work Complete", (50, 140, 90), "pothole_after.webp"
            )
            streetlight_img, _ = generate_placeholder_image(
                "Broken Streetlight Cluster", (80, 100, 160), "light_cluster.webp"
            )
            garbage_img, _ = generate_placeholder_image(
                "Garbage Heap Cluster", (120, 100, 70), "garbage_cluster.webp"
            )

            # 3. Seed Hero Issue #CF-024 (id 24)
            print("Creating Hero Issue #CF-024...")
            now = datetime.datetime.now(datetime.UTC)
            t_report = now.replace(hour=9, minute=20, second=0, microsecond=0)
            t_assign = now.replace(hour=10, minute=5, second=0, microsecond=0)
            t_due = t_assign + timedelta(hours=72)

            cur.execute(
                """
                INSERT INTO issues (
                    id, issue_code, title, summary, description, category_id, ward_id, department_id,
                    latitude, longitude, address, status, priority, assigned_to,
                    triage_confirmed_at, triage_confirmed_by, first_assigned_at, sla_due_at,
                    is_public, is_seed, created_by, created_at, updated_at
                )
                VALUES (
                    24, 'CF-024',
                    'Large pothole on 8th Main near Market junction',
                    'Deep asphalt crater hazardous to two-wheelers and transit buses.',
                    'Large dangerous pothole forming near the market junction on 8th Main road.',
                    1, 14, 1,
                    %s, %s, '8th Main, Ward 14 (Central Market)',
                    'assigned', 'high', %s,
                    %s, %s, %s, %s,
                    1, 1, %s, %s, %s
                )
                """,
                (
                    DEMO_CENTER_LAT,
                    DEMO_CENTER_LNG,
                    roads_officer_id,
                    t_assign,
                    ward_lead_id,
                    t_assign,
                    t_due,
                    asha_id,
                    t_report,
                    t_assign,
                ),
            )

            # Insert 5 linked reports for #CF-024
            report_texts = [
                (
                    "Large dangerous road crater right outside the market gate.",
                    asha_id,
                    1,
                    pothole_img,
                    pothole_key,
                ),
                (
                    "Pothole near bus stop causing severe traffic backups.",
                    user_ids["ravi@demo.civicfix.org"],
                    0,
                    None,
                    None,
                ),
                (
                    "Deep pothole near market junction, two-wheelers slipping.",
                    user_ids["meera@demo.civicfix.org"],
                    0,
                    None,
                    None,
                ),
                (
                    "Road damage near bus stop getting worse after morning rain.",
                    user_ids["karthik@demo.civicfix.org"],
                    0,
                    None,
                    None,
                ),
                (
                    "Dangerous road crater on 8th Main.",
                    user_ids["priya@demo.civicfix.org"],
                    0,
                    None,
                    None,
                ),
            ]

            for desc, uid, is_prim, img_u, img_k in report_texts:
                cur.execute(
                    """
                    INSERT INTO reports (
                        issue_id, user_id, description, image_url, image_key, latitude, longitude,
                        address, chosen_category_id, ai_suggested_category_id, review_status,
                        is_primary, created_at
                    )
                    VALUES (24, %s, %s, %s, %s, %s, %s, '8th Main, Ward 14', 1, 1, 'accepted', %s, %s)
                    """,
                    (uid, desc, img_u, img_k, DEMO_CENTER_LAT, DEMO_CENTER_LNG, is_prim, t_report),
                )

            # 12 Supporters for #CF-024
            for uid in list(user_ids.values())[:12]:
                cur.execute(
                    "INSERT IGNORE INTO issue_support (issue_id, user_id, created_at) VALUES (24, %s, %s)",
                    (uid, t_report),
                )

            # Assignment row
            cur.execute(
                """
                INSERT INTO assignments (issue_id, department_id, assigned_to, assigned_by, note, sla_due_at, created_at)
                VALUES (24, 1, %s, %s, 'Assigned to Roads team member for asphalt patch repair.', %s, %s)
                """,
                (roads_officer_id, ward_lead_id, t_due, t_assign),
            )

            # Issue updates timeline for #CF-024
            cur.execute(
                """
                INSERT INTO issue_updates (issue_id, update_type, from_status, to_status, actor_id, visibility, note, created_at)
                VALUES (24, 'reported', NULL, 'reported', %s, 'public', 'Reported 09:20 by neighbourhood resident', %s)
                """,
                (asha_id, t_report),
            )
            cur.execute(
                """
                INSERT INTO issue_updates (issue_id, update_type, from_status, to_status, actor_id, visibility, note, created_at)
                VALUES (24, 'triage', 'reported', 'assigned', %s, 'public', 'Assigned to Roads 10:05 by Ward Lead', %s)
                """,
                (ward_lead_id, t_assign),
            )
            cur.execute(
                """
                INSERT INTO issue_updates (issue_id, update_type, actor_id, visibility, note, next_step, created_at)
                VALUES (24, 'note', %s, 'public', 'Work proof: pending', 'Inspection and tar laying scheduled for today afternoon.', %s)
                """,
                (roads_officer_id, t_assign + timedelta(minutes=10)),
            )

            # 4. Seed other ~40 Ward 14 issues across categories and statuses
            print("Seeding ~40 Ward 14 issues and ~120 reports...")
            categories = [
                (1, 1, "pothole", "Pothole on Cross Road", pothole_img),
                (2, 2, "streetlight", "Streetlight not functioning", streetlight_img),
                (3, 3, "garbage", "Overflowing garbage dump", garbage_img),
                (4, 4, "drainage", "Stormwater drain waterlogging", None),
                (5, 5, "water_leakage", "Underground pipeline water leakage", None),
            ]

            statuses_pool = [
                "reported",
                "reported",
                "reported",
                "reported",
                "reported",
                "assigned",
                "assigned",
                "assigned",
                "assigned",
                "assigned",
                "assigned",
                "assigned",
                "in_progress",
                "in_progress",
                "in_progress",
                "in_progress",
                "in_progress",
                "awaiting_verification",
                "awaiting_verification",
                "awaiting_verification",
                "awaiting_verification",
                "resolved",
                "resolved",
                "resolved",
                "resolved",
                "resolved",
                "resolved",
                "resolved",
                "resolved",
                "resolved",
                "reopened",
                "reopened",
                "reopened",
                "rejected",
            ]

            issue_idx = 30
            for i, status in enumerate(statuses_pool):
                issue_id = issue_idx + i
                cat_id, dept_id, cat_code, cat_title, img_u = random.choice(categories)
                days_ago = random.randint(1, 40)
                created_dt = now - timedelta(days=days_ago, hours=random.randint(1, 12))
                sla_hrs = 48
                first_asg = (
                    created_dt + timedelta(hours=random.randint(1, 4))
                    if status != "reported"
                    else None
                )
                sla_due = first_asg + timedelta(hours=sla_hrs) if first_asg else None
                resolved_dt = (
                    created_dt + timedelta(days=random.randint(2, 5))
                    if status == "resolved"
                    else None
                )

                # Slight random coordinate spread around ward center (leave free spot directly at hero location)
                lat_offset = random.uniform(0.001, 0.015) * random.choice([-1, 1])
                lng_offset = random.uniform(0.001, 0.015) * random.choice([-1, 1])
                issue_lat = DEMO_CENTER_LAT + lat_offset
                issue_lng = DEMO_CENTER_LNG + lng_offset

                creator_id = random.choice(list(user_ids.values())[:10])

                cur.execute(
                    """
                    INSERT INTO issues (
                        id, issue_code, title, summary, description, category_id, ward_id, department_id,
                        latitude, longitude, address, status, priority, assigned_to,
                        first_assigned_at, sla_due_at, resolved_at, reopened_count,
                        is_public, is_seed, created_by, created_at, updated_at
                    )
                    VALUES (%s, CONCAT('CF-', LPAD(%s, 3, '0')), %s, %s, %s, %s, 14, %s, %s, %s, 'Ward 14 Locality', %s, 'medium', %s, %s, %s, %s, %s, 1, 1, %s, %s, %s)
                    """,
                    (
                        issue_id,
                        issue_id,
                        f"{cat_title} #{issue_id}",
                        f"Civic problem reported regarding {cat_code} in the ward.",
                        f"Detailed description of {cat_code} impacting pedestrians and vehicles.",
                        cat_id,
                        dept_id,
                        issue_lat,
                        issue_lng,
                        status,
                        roads_officer_id if status != "reported" else None,
                        first_asg,
                        sla_due,
                        resolved_dt,
                        1 if status == "reopened" else 0,
                        creator_id,
                        created_dt,
                        created_dt,
                    ),
                )

                # Primary report
                cur.execute(
                    """
                    INSERT INTO reports (
                        issue_id, user_id, description, image_url, latitude, longitude,
                        address, chosen_category_id, review_status, is_primary, created_at
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, 'Ward 14 Locality', %s, 'accepted', 1, %s)
                    """,
                    (
                        issue_id,
                        creator_id,
                        f"Initial complaint for {cat_title}",
                        img_u,
                        issue_lat,
                        issue_lng,
                        cat_id,
                        created_dt,
                    ),
                )

                # Initial support
                cur.execute(
                    "INSERT IGNORE INTO issue_support (issue_id, user_id, created_at) VALUES (%s, %s, %s)",
                    (issue_id, creator_id, created_dt),
                )

                # Add extra reports and supporters to form clusters
                extra_reports = random.randint(1, 3)
                for _ in range(extra_reports):
                    supporter_id = random.choice(list(user_ids.values())[:10])
                    cur.execute(
                        """
                        INSERT INTO reports (
                            issue_id, user_id, description, latitude, longitude,
                            address, chosen_category_id, review_status, is_primary, created_at
                        )
                        VALUES (%s, %s, %s, %s, %s, 'Ward 14 Locality', %s, 'accepted', 0, %s)
                        """,
                        (
                            issue_id,
                            supporter_id,
                            f"Additional neighbour report for #{issue_id}",
                            issue_lat,
                            issue_lng,
                            cat_id,
                            created_dt + timedelta(hours=1),
                        ),
                    )
                    cur.execute(
                        "INSERT IGNORE INTO issue_support (issue_id, user_id, created_at) VALUES (%s, %s, %s)",
                        (issue_id, supporter_id, created_dt),
                    )

                # Timeline updates
                cur.execute(
                    """
                    INSERT INTO issue_updates (issue_id, update_type, from_status, to_status, actor_id, visibility, note, created_at)
                    VALUES (%s, 'reported', NULL, 'reported', %s, 'public', 'Reported by resident', %s)
                    """,
                    (issue_id, creator_id, created_dt),
                )

                # If awaiting verification or resolved, add evidence
                if status in ("awaiting_verification", "resolved"):
                    cur.execute(
                        """
                        INSERT INTO evidence (issue_id, uploaded_by, kind, url, caption, created_at)
                        VALUES (%s, %s, 'after', %s, 'Work completion proof', %s)
                        """,
                        (issue_id, roads_officer_id, after_img, created_dt + timedelta(days=1)),
                    )

                # If resolved, add confirmed feedback
                if status == "resolved":
                    cur.execute(
                        """
                        INSERT INTO resolution_feedback (issue_id, user_id, cycle, outcome, rating, comment, created_at)
                        VALUES (%s, %s, 0, 'confirmed', 5, 'Problem was fixed cleanly by the ward team.', %s)
                        """,
                        (issue_id, creator_id, resolved_dt or created_dt),
                    )

            # 5. Add 2 spam-flagged non-public reports
            cur.execute(
                """
                INSERT INTO issues (id, issue_code, title, summary, description, category_id, ward_id, department_id, latitude, longitude, status, is_public, is_seed, created_by, created_at, updated_at)
                VALUES (991, 'CF-991', 'Spam report test 1', 'Spam', 'Short', 1, 14, 1, %s, %s, 'reported', 0, 1, %s, %s, %s),
                       (992, 'CF-992', 'Spam report test 2', 'Spam', 'Spamming repeatedly', 1, 14, 1, %s, %s, 'reported', 0, 1, %s, %s, %s)
                """,
                (
                    DEMO_CENTER_LAT,
                    DEMO_CENTER_LNG,
                    asha_id,
                    now,
                    now,
                    DEMO_CENTER_LAT,
                    DEMO_CENTER_LNG,
                    asha_id,
                    now,
                    now,
                ),
            )
            cur.execute(
                """
                INSERT INTO reports (issue_id, user_id, description, latitude, longitude, chosen_category_id, review_status, flag_reason, is_primary, created_at)
                VALUES (991, %s, 'Short', %s, %s, 1, 'flagged', 'Description is under 10 characters.', 1, %s),
                       (992, %s, 'Spamming repeatedly', %s, %s, 1, 'flagged', 'More than 3 reports submitted within 10 minutes.', 1, %s)
                """,
                (
                    asha_id,
                    DEMO_CENTER_LAT,
                    DEMO_CENTER_LNG,
                    now,
                    asha_id,
                    DEMO_CENTER_LAT,
                    DEMO_CENTER_LNG,
                    now,
                ),
            )

            # 6. Light data for Ward 7 and Ward 21
            print("Seeding light data for Ward 7 and Ward 21 for city view...")
            other_wards = [(7, 12.9784, 77.6408), (21, 12.9352, 77.6245)]
            for w_id, w_lat, w_lng in other_wards:
                for j in range(5):
                    sub_id = 1000 + w_id * 10 + j
                    cur.execute(
                        """
                        INSERT INTO issues (
                            id, issue_code, title, summary, description, category_id, ward_id, department_id,
                            latitude, longitude, status, priority, is_public, is_seed, created_by, created_at, updated_at
                        )
                        VALUES (%s, CONCAT('CF-', %s), %s, 'City ward issue', 'Civic problem in ward.', %s, %s, %s, %s, %s, 'reported', 'medium', 1, 1, %s, %s, %s)
                        """,
                        (
                            sub_id,
                            sub_id,
                            f"Ward {w_id} Issue #{j + 1}",
                            (j % 5) + 1,
                            w_id,
                            (j % 5) + 1,
                            w_lat,
                            w_lng,
                            asha_id,
                            now,
                            now,
                        ),
                    )

            conn.commit()
            print("Successfully seeded all demo data and hero issue CF-024!")


if __name__ == "__main__":
    seed_database()
