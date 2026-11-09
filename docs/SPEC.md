# CivicFix: Product & Technical Spec

## 1. Product summary

CivicFix: Turning local problems into visible action.  
**Tagline:** Report once. Unite neighbourhood voices. Track every action.  
A neighbourhood-first civic platform to report public issues, unite duplicate complaints and track verified resolution across city services.

Residents report potholes, streetlights, garbage, drainage and water leakage; similar reports are grouped into one visible neighbourhood issue; ward teams route and resolve them; residents verify the fix, or reopen it.

**Problem (from the deck):** city apps make reporting easy, but the same issue is filed many times and tickets get closed without a fix.  
Where the experience breaks down:

1. residents file the same issue separately
2. ownership spans several departments
3. nobody sees the area-wide picture
4. tickets are closed without a fix.

Make the neighbourhood the unit of visibility, not the single ticket.

**Three context stats shown on the landing page (use the exact wording, always with the source line):**

- **66,459 grievances** reopened by Hyderabad citizens after GHMC staff closed them without attending to them.
- **3 cities:** Hyderabad, Bengaluru and Pune officials have each acknowledged tickets being closed without a fix.
- **600M people** projected to live in India's towns and cities by 2036 (40% of the population), so the load only grows. (Context for scale, not proof of failure.)  
  _Source line:_ Deccan Chronicle (GHMC reopened grievances); Deccan Herald (BBMP Sahaaya 2.0); Punekar News, 26 Jun 2026 (PMC Care); Economic Survey 2025-26 citing World Bank (PIB).

**One shared workflow (slide 3):**  
CAPTURE (citizen report: photo, location, category, short description in one guided flow) -> CONNECT (community signal: similar reports grouped into one neighbourhood issue, so scale is visible) -> RESOLVE (ward operations: triage queue with department ownership, history and proof of work).

**Our USP:** AI-suggested duplicate clusters + citizen-verified closure, in every department. Less duplicate noise, clearer ownership, more accountable closures.

**Positioning (be upfront):** CivicFix complements existing civic tools, it does not replace them. City complaint apps (BBMP Sahaaya, MyGHMC, PMC Care), Swachhata (Janaagraha) and FixMyStreet (mySociety) are real and good. CivicFix adds: one issue model for every department, AI-suggested duplicate clusters (staff confirm), citizen-verified closure with before/after proof and a reopen path, and a ward performance view (hotspots, ageing issues, category backlogs). It is a prototype proposal, not a deployed service; municipal integrations would need local-body approval and access. Do not claim integrations that don't exist.

**Central workflow (slide 5), everything is built around this:**  
Report -> AI assist -> Cluster -> Route -> Verify  
_Example:_ a resident reports a pothole (#CF-024), neighbours support the same issue instead of opening new tickets, the ward assigns it to Roads, work proof is uploaded, the resident confirms or reopens.

---

## 2. Scope and priorities

Hackathon scope (slide 9): one demo ward (Ward 14), five issue categories, citizen and ward-admin roles, seeded sample data. The full loop must work end to end before anything else is polished.

| Priority | Meaning                | Contents                                                                                                                                                                                                                                                                                     |
| -------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P0**   | Must work for the demo | Auth, guided report form with photo + location, AI precheck (category + summary + possible duplicates), support an issue, nearby feed + map + issue detail, ward queue, assign (department + team member), status timeline, evidence upload, citizen verify/reopen, notifications, seed data |
| **P1**   | Strongly expected      | SLA clock, before/after slider, Chart.js analytics (by category, status, time), ward performance view (hotspots, ageing, category backlogs), pilot scorecard, moderation (spam flags), rate limiting                                                                                         |
| **P2**   | Stretch                | Gemini insights on aggregated stats, Gemini image analysis, PWA manifest, Hindi UI strings, department-scoped permissions                                                                                                                                                                    |

**Out of scope:** payments, native apps, real municipal API integration, WebSockets, multi-city tenancy, email/SMS/OAuth (write a notifier interface that only creates in-app notifications), admin user-management UI (users are created by seed and registration).

---

## 3. Locked tech stack

Mirrors the deck's "Technology stack" slide: a focused React + SQL build, with AI as an assist.

| Layer    | Tech                                                   | Role (from the deck) |
| -------- | ------------------------------------------------------ | -------------------- |
| Frontend | React.js (Vite, JavaScript/JSX)                        | Application UI       |
| Frontend | Tailwind CSS (v4, @tailwindcss/vite, CSS-first @theme) | Styling              |
| Frontend | Redux (Redux Toolkit + RTK Query)                      | Shared state         |
| Frontend | React Bits                                             | Components, motion   |
| Frontend | Lucide React                                           | Icons                |
| Frontend | Chart.js (react-chartjs-2)                             | Analytics dashboard  |
| Backend  | Python 3.12+ + FastAPI + Uvicorn                       | Secure API           |
| Database | SQL: MySQL 8 (InnoDB, utf8mb4) via aiomysql            | Records              |
| AI       | Gemini API (google-genai Python SDK), server-side only | AI assist            |

**Supporting libraries (not in the deck, needed to make it work):**  
Frontend: `react-router-dom`, `react-hook-form` + `zod`, `react-leaflet` + `leaflet` (OpenStreetMap tiles, no API key), `date-fns`, `sonner` (toasts).  
Python server: `fastapi`, `uvicorn[standard]`, `pydantic`, `pydantic-settings`, `aiomysql`, `bcrypt`, `PyJWT`, `python-multipart`, `Pillow`, `slowapi`, `structlog`, `python-dotenv`, `google-genai`, `sqlparse`.  
Optional: `cloudinary` Python SDK (images default to local disk).

**Tooling:** npm for root/frontend JavaScript packages and scripts only · ESLint + Prettier for JavaScript · Ruff for Python lint/format · pytest + pytest-asyncio + httpx for FastAPI tests · concurrently (root dev script).

**Database rules:** MySQL 8.0.16+ (CHECK constraints enforced). Driver aiomysql with an asynchronous connection pool. Hand-written SQL in repositories, no ORM. Plain .sql migration files + a small Python migration runner. Use ENUM for fixed vocabularies. All SQL isolated in repositories so the dialect is contained in one layer.  
**Architecture (slide 8):** React app + UI + Redux <-> Secure API (Python + FastAPI) <-> SQL DB (records), with Gemini called only by the API as an AI assist. The React client never connects to SQL. Database credentials and the Gemini key never live in the client. Architecture style: modular monolith (one FastAPI application, feature modules). No microservices.

---

## 4. Repo structure and npm scripts

```text
civicfix/
├── package.json (root: JS tooling and cross-platform convenience scripts)
├── package-lock.json
├── .nvmrc .python-version .editorconfig .prettierrc .prettierignore .gitignore
├── AGENTS.md README.md docker-compose.yml (compose file = optional MySQL)
├── docs/ SPEC.md API_CONTRACT.md ARCHITECTURE.md DECISIONS.md PROGRESS.md DEMO_SCRIPT.md
├── server/
│   ├── requirements.txt pyproject.toml .env.example
│   ├── db/ init.sql migrations/001_schema.sql 002_reference_data.sql seeds/seed.py seeds/assets/ uploads/
│   ├── scripts/ init_db.py migrate.py reset_db.py seed.py verify_db.py
│   ├── app/
│   │   ├── main.py
│   │   ├── core/ config.py constants.py errors.py logging.py security.py
│   │   ├── db/ pool.py transactions.py
│   │   ├── middleware/ auth.py require_role.py rate_limits.py security_headers.py error_handler.py uploads.py
│   │   ├── lib/ geo.py text_similarity.py storage/(local.py, cloudinary.py, index.py)
│   │   └── modules/
│   │       ├── auth/ users/ meta/
│   │       ├── issues/ issue_state_machine.py sla.py
│   │       ├── reports/ duplicate_detection.py
│   │       ├── ward/ (queue, assign, progress, evidence, moderation)
│   │       ├── resolution/ notifications/ analytics/
│   │       └── ai/ gemini_client.py ai_service.py prompts/ schemas.py mock.py
│   │       (each module: router.py · schemas.py · service.py · repository.py)
│   └── tests/ conftest.py unit/ integration/
└── client/
    ├── package.json package-lock.json eslint.config.js vite.config.js index.html .env.example
    └── src/
        ├── main.jsx App.jsx
        ├── app/ store.js hooks.js router.jsx guards.jsx
        ├── features/ auth · issues · report · ward · notifications · analytics
        │   (each: api.js via injectEndpoints, optional slice, components/, pages/)
        ├── components/ ui/ layout/ shared/ reactbits/
        ├── lib/ constants.js format.js geo.js cn.js
        └── styles/ index.css
```

**Root package.json scripts (cross-platform):**  
`dev` (FastAPI + React via concurrently) · `dev:server` (`python -m uvicorn app.main:app --reload --app-dir server`) · `dev:client` · `lint` (Ruff + client ESLint) · `format` · `format:check` · `test` (pytest + client tests) · `build` (client) · `db:init` · `db:migrate` · `db:seed` · `db:reset` · `db:verify`. npm installs root/client JavaScript tools; pip installs the Python backend.

**Target setup experience (README):**

```bash
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
python -m pip install -r server/requirements.txt
npm install
npm --prefix client install
# Copy server/.env.example to server/.env and client/.env.example to client/.env
npm run db:init
npm run db:reset
npm run db:seed
npm run dev
```

---

## 5. Roles and permissions

Two roles, as in the deck (citizen and ward admin):

| Role         | Who              | Can do                                                                                                                                                                                                                                                                      |
| ------------ | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `citizen`    | Resident         | Browse public feed and map; report; support an existing issue; track own reports; verify or reopen issues they are linked to; notifications; profile                                                                                                                        |
| `ward_admin` | Ward team member | Review the shared ward queue; confirm category/department/priority; assign ownership (department + responsible team member); publish progress notes with next step; upload evidence and closure proof; moderate flagged reports; reject invalid issues; view ward analytics |

**Details:**

- `users.ward_id` scopes a ward admin to their ward. `ward_id NULL` = can view all wards (used only for one seeded "city view" account so the by-ward charts and the ward x category backlog have something to compare; no separate UI).
- `users.department_id` on a ward admin marks a team member of that department (the "responsible team member" an issue can be assigned to). `department_id NULL` on a ward admin = ward lead, covers all departments.
- All ward admins in scope share the same queue and the same powers ("one shared record"); the UI highlights "Assigned to me". (P2: department-scoped permissions.)
- A ward admin can never mark an issue citizen-confirmed (except the audited overdue override in 6.1).
- Scope helper: `scope_for(user)` returns the SQL filter (`ward_id = %s` with its parameter, or no ward filter). Apply it in the repository layer for every ward-console query. Test it.

---

## 6. Domain rules

### 6.1 Issue lifecycle (state machine)

Statuses: `reported`, `assigned`, `in_progress`, `awaiting_verification`, `resolved`, `reopened`, `rejected`.

| From                                                 | To                      | Actor            | Requirements                                                                                                                                                                                                                                                           |
| ---------------------------------------------------- | ----------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reported`                                           | `assigned`              | `ward_admin`     | Triage confirmed in the same action: category, department, priority. Optional team member (must be a ward_admin of the issue's ward whose department matches). Sets `triage_confirmed_*`, `assigned_to`, `first_assigned_at`, `sla_due_at`, inserts an assignments row |
| `assigned`                                           | `in_progress`           | `ward_admin`     | none ("Start work")                                                                                                                                                                                                                                                    |
| `assigned` or `in_progress`                          | `awaiting_verification` | `ward_admin`     | At least one after evidence (completion proof) + a closure note. Notifies all linked citizens (verification requested)                                                                                                                                                 |
| `awaiting_verification`                              | `resolved`              | linked `citizen` | "Confirm the fix". Sets `resolved_at`. Ward admin override allowed only when verification is overdue (`VERIFICATION_OVERDUE_DAYS`, default 7) and with a reason; flagged "closed by ward override" in the timeline                                                     |
| `awaiting_verification`                              | `reopened`              | linked `citizen` | "Flag it as not resolved": reason required, optional photo. Increments `reopened_count`                                                                                                                                                                                |
| `resolved`                                           | `reopened`              | linked `citizen` | Only within `REOPEN_WINDOW_DAYS` (default 14) of `resolved_at`                                                                                                                                                                                                         |
| `reopened`                                           | `assigned`              | `ward_admin`     | Triage again + assign (resets SLA clock)                                                                                                                                                                                                                               |
| `reported` / `assigned` / `in_progress` / `reopened` | `rejected`              | `ward_admin`     | Reason required (spam, invalid, out of scope)                                                                                                                                                                                                                          |

**Terminal:** `rejected`, and `resolved` (unless reopened inside the window).  
Reassigning someone is an assignment event, not a status change.  
**Implementation:** `issue_state_machine.py` exports a data-driven transition map plus `transition(conn, issue_id, to_status, actor, note, metadata)` which: locks the row (`SELECT ... FOR UPDATE`), validates actor + requirements, updates the issue, inserts an `issue_updates` row, creates notifications, all inside the caller's transaction. Every other module calls this function.  
**Verification rule:** the ward team uploads proof; residents confirm or dispute. No AI path can close an issue. If no linked citizen responds within `VERIFICATION_OVERDUE_DAYS`, the issue is flagged "verification overdue" in the ward queue (computed, never auto-closed).

### 6.2 Priority and routing

- `priority`: `low` | `medium` | `high` | `critical`, default `medium`. Gemini may suggest a priority hint; the ward admin confirms at assignment.
- No automatic escalation from support counts (show the support count prominently, allow sorting by it).
- `department_id` is set at creation from `categories.default_department_id` (a deterministic rule, not AI) and confirmed or changed by the ward admin at assignment.

### 6.3 SLA clock

`sla_due_at` = first assignment time + `categories.sla_hours` (reset when reassigned after a reopen).  
SLA state is computed, never stored:

- `none` (unassigned or closed)
- `on_track` (<75% of window elapsed)
- `at_risk` (>=75%)
- `breached` (past due).  
  Shown as a coloured chip + countdown.

### 6.4 Support vs report

A report = one citizen's submission (photo, text, coordinates), attached to exactly one issue.  
A support (row in `issue_support`) = a citizen backing an existing issue without writing a new report; one per user per issue (unique constraint).  
The reporter of any report is automatically also a supporter.  
Support count = distinct supporters.  
Report count = rows in `reports`.  
A user is "linked" to an issue if they have a report or a support on it. Only linked citizens can verify/reopen.

---

## 7. Database (MySQL 8)

Core SQL entities (slide 8): `users`, `wards`, `departments`, `issues`, `issue_updates`, `issue_support`, `evidence`, `assignments`.  
Supporting tables: `categories`, `reports`, `resolution_feedback`, `notifications`, `ai_logs`. Use these exact names.  
"Indexed on ward, category, status and date. Status changes are kept as history" (`issue_updates`).  
Conventions: InnoDB, `utf8mb4`, `INT UNSIGNED AUTO_INCREMENT` ids, `DATETIME(3)` timestamps stored in UTC, `DOUBLE` for lat/lng (maps to Python float), `TINYINT(1)` booleans (convert to real bool values in repository mappers), `ENUM` for fixed vocabularies. aiomysql returns naive datetime objects for DATETIME; repository mappers must interpret stored values as UTC and serialize API timestamps as ISO-8601 UTC strings.

`server/db/init.sql` (run once as MySQL root; the Python `db:init` script does this) creates the databases and an app user:

```sql
CREATE DATABASE IF NOT EXISTS civicfix CHARACTER SET utf8mb4;
CREATE DATABASE IF NOT EXISTS civicfix_test CHARACTER SET utf8mb4;
CREATE USER IF NOT EXISTS 'civicfix'@'%' IDENTIFIED BY 'civicfix';
GRANT ALL PRIVILEGES ON civicfix.* TO 'civicfix'@'%';
GRANT ALL PRIVILEGES ON civicfix_test.* TO 'civicfix'@'%';
FLUSH PRIVILEGES;
```

`server/db/migrations/001_schema.sql` implements this schema (all FKs and indexes):

```sql
CREATE TABLE wards (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  city VARCHAR(100) NULL,
  center_lat DOUBLE NULL, center_lng DOUBLE NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE departments (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(40) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE categories (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(40) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(40) NOT NULL, -- lucide icon name
  default_department_id INT UNSIGNED NOT NULL,
  sla_hours INT UNSIGNED NOT NULL,
  CONSTRAINT fk_cat_dept FOREIGN KEY (default_department_id) REFERENCES departments(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE, -- default collation is case-insensitive
  password_hash VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NULL,
  role ENUM('citizen','ward_admin') NOT NULL,
  ward_id INT UNSIGNED NULL, -- ward_admin: scope (NULL = all wards)
  department_id INT UNSIGNED NULL, -- ward_admin team member's department (NULL = ward lead)
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  is_seed TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  last_login_at DATETIME(3) NULL,
  CONSTRAINT fk_users_ward FOREIGN KEY (ward_id) REFERENCES wards(id),
  CONSTRAINT fk_users_dept FOREIGN KEY (department_id) REFERENCES departments(id),
  CONSTRAINT chk_users_dept CHECK (role = 'ward_admin' OR department_id IS NULL)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE issues (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  issue_code VARCHAR(16) NULL UNIQUE, -- 'CF-024'; set right after insert from the id: CONCAT('CF-', LPAD(id,3,'0'))
  title VARCHAR(160) NOT NULL,
  summary VARCHAR(500) NULL,
  description TEXT NOT NULL,
  category_id INT UNSIGNED NOT NULL,
  ward_id INT UNSIGNED NOT NULL,
  department_id INT UNSIGNED NOT NULL,
  latitude DOUBLE NOT NULL, longitude DOUBLE NOT NULL,
  address VARCHAR(255) NULL,
  status ENUM('reported','assigned','in_progress','awaiting_verification','resolved','reopened','rejected')
    NOT NULL DEFAULT 'reported',
  priority ENUM('low','medium','high','critical') NOT NULL DEFAULT 'medium',
  assigned_to INT UNSIGNED NULL,
  triage_confirmed_at DATETIME(3) NULL, triage_confirmed_by INT UNSIGNED NULL,
  first_assigned_at DATETIME(3) NULL, sla_due_at DATETIME(3) NULL, resolved_at DATETIME(3) NULL,
  reopened_count SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  is_public TINYINT(1) NOT NULL DEFAULT 1, -- 0 while a spam-flagged report awaits moderation
  is_seed TINYINT(1) NOT NULL DEFAULT 0,
  created_by INT UNSIGNED NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_issues_cat FOREIGN KEY (category_id) REFERENCES categories(id),
  CONSTRAINT fk_issues_ward FOREIGN KEY (ward_id) REFERENCES wards(id),
  CONSTRAINT fk_issues_dept FOREIGN KEY (department_id) REFERENCES departments(id),
  CONSTRAINT fk_issues_asg FOREIGN KEY (assigned_to) REFERENCES users(id),
  CONSTRAINT fk_issues_tri FOREIGN KEY (triage_confirmed_by) REFERENCES users(id),
  CONSTRAINT fk_issues_by FOREIGN KEY (created_by) REFERENCES users(id),
  KEY idx_issues_ward_cat_status_date (ward_id, category_id, status, created_at),
  KEY idx_issues_status (status),
  KEY idx_issues_created (created_at),
  KEY idx_issues_geo (latitude, longitude),
  KEY idx_issues_assigned (assigned_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE reports (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  issue_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  description TEXT NOT NULL,
  image_url VARCHAR(500) NULL, image_key VARCHAR(255) NULL,
  latitude DOUBLE NOT NULL, longitude DOUBLE NOT NULL, address VARCHAR(255) NULL,
  chosen_category_id INT UNSIGNED NOT NULL,
  ai_suggested_category_id INT UNSIGNED NULL,
  language VARCHAR(10) NULL,
  review_status ENUM('accepted','flagged','rejected') NOT NULL DEFAULT 'accepted',
  flag_reason VARCHAR(255) NULL,
  is_primary TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_rep_issue FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE,
  CONSTRAINT fk_rep_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_rep_cat FOREIGN KEY (chosen_category_id) REFERENCES categories(id),
  CONSTRAINT fk_rep_aicat FOREIGN KEY (ai_suggested_category_id) REFERENCES categories(id),
  KEY idx_rep_issue (issue_id),
  KEY idx_rep_user_date (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE issue_support (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  issue_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_support (issue_id, user_id),
  CONSTRAINT fk_sup_issue FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE,
  CONSTRAINT fk_sup_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE assignments (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  issue_id INT UNSIGNED NOT NULL,
  department_id INT UNSIGNED NOT NULL,
  assigned_to INT UNSIGNED NULL, -- responsible team member (optional)
  assigned_by INT UNSIGNED NOT NULL,
  note VARCHAR(500) NULL,
  sla_due_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  ended_at DATETIME(3) NULL,
  CONSTRAINT fk_asg_issue FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE,
  CONSTRAINT fk_asg_dept FOREIGN KEY (department_id) REFERENCES departments(id),
  CONSTRAINT fk_asg_to FOREIGN KEY (assigned_to) REFERENCES users(id),
  CONSTRAINT fk_asg_by FOREIGN KEY (assigned_by) REFERENCES users(id),
  KEY idx_asg_issue (issue_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE issue_updates ( -- the timeline AND the status history
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  issue_id INT UNSIGNED NOT NULL,
  update_type ENUM('reported','report_added','support_added','triage','assignment','status_changed',
    'note','evidence_added','verification','reopened','moderation') NOT NULL,
  from_status VARCHAR(30) NULL, to_status VARCHAR(30) NULL,
  actor_id INT UNSIGNED NULL,
  visibility ENUM('public','internal') NOT NULL DEFAULT 'public',
  note TEXT NULL,
  next_step VARCHAR(255) NULL, -- "action note and next step" published by the ward team
  metadata JSON NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_upd_issue FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE,
  CONSTRAINT fk_upd_actor FOREIGN KEY (actor_id) REFERENCES users(id),
  KEY idx_upd_issue_date (issue_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE evidence ( -- ward-team work proof (citizen photos live on reports)
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  issue_id INT UNSIGNED NOT NULL,
  uploaded_by INT UNSIGNED NOT NULL,
  kind ENUM('before','progress','after') NOT NULL, -- 'after' = completion / closure proof
  url VARCHAR(500) NOT NULL, storage_key VARCHAR(255) NULL,
  caption VARCHAR(255) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_ev_issue FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE,
  CONSTRAINT fk_ev_user FOREIGN KEY (uploaded_by) REFERENCES users(id),
  KEY idx_ev_issue (issue_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE resolution_feedback (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  issue_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  cycle SMALLINT UNSIGNED NOT NULL DEFAULT 0, -- = issues.reopened_count when feedback was given
  outcome ENUM('confirmed','disputed') NOT NULL,
  rating TINYINT UNSIGNED NULL,
  comment TEXT NULL, image_url VARCHAR(500) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_feedback (issue_id, user_id, cycle),
  CONSTRAINT chk_rating CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),
  CONSTRAINT fk_fb_issue FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE,
  CONSTRAINT fk_fb_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE notifications (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  type VARCHAR(40) NOT NULL, title VARCHAR(160) NOT NULL, body VARCHAR(500) NULL,
  issue_id INT UNSIGNED NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_not_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_not_issue FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE,
  KEY idx_not_user (user_id, is_read, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE ai_logs (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  operation ENUM('classify','duplicates','summarize') NOT NULL,
  user_id INT UNSIGNED NULL, issue_id INT UNSIGNED NULL,
  input_hash CHAR(64) NULL, -- hash, never raw text (avoid storing personal data)
  model VARCHAR(80) NULL, output JSON NULL,
  status ENUM('ok','fallback','error') NOT NULL,
  latency_ms INT UNSIGNED NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**Reference data (`002_reference_data.sql`):**

| Department               | Category (code)                                | SLA hours | Lucide icon  |
| ------------------------ | ---------------------------------------------- | --------- | ------------ |
| Roads & Pavements        | Pothole / road damage (`pothole`)              | 72        | construction |
| Street Lighting          | Broken streetlight (`streetlight`)             | 48        | lamp         |
| Sanitation & Solid Waste | Garbage / overflowing bin (`garbage`)          | 24        | trash-2      |
| Drainage & Sewerage      | Blocked drain / waterlogging (`drainage`)      | 48        | waves        |
| Water Supply             | Water leakage / supply issue (`water_leakage`) | 24        | droplets     |

_(Verify each icon name exists in the installed lucide-react; substitute a close one if not.)_

**MySQL rules the agent must follow:**  
aiomysql pool with minsize 1, maxsize 10, autocommit disabled and charset utf8mb4. Set `time_zone = '+00:00'` on each acquired connection. Return ISO-8601 UTC strings from the API; aiomysql returns naive datetime values, so repository mappers must treat stored timestamps as UTC. Use `cursor.execute(sql, params)` with `%s` placeholders and parameter tuples. For `IN` lists, create only the placeholder count dynamically and pass every value separately. Validate `LIMIT` and `OFFSET` as integers before binding. Use `DictCursor` for named columns. MySQL 8 runs with `ONLY_FULL_GROUP_BY`: every selected non-aggregate column must be in `GROUP BY` (group by the same expressions you select). The Python migration runner reads plain .sql files and executes statements individually with `sqlparse`; do not enable multi-statement execution on the application pool. DDL auto-commits in MySQL, so keep each migration file small and re-runnable; the runner records the version only after success in `schema_migrations(version, applied_at)`. Idempotent support: `INSERT IGNORE INTO issue_support ...` (unique key does the work), then check `cursor.rowcount`. Race safety: the issue row is locked with `SELECT ... FOR UPDATE` in the same transaction that joins a report to it or changes its status. Retry a transaction once on deadlock (MySQL error 1213 / `ER_LOCK_DEADLOCK`).

`issue_code`: insert the issue, then in the same transaction `UPDATE issues SET issue_code = CONCAT('CF-', LPAD(id, 3, '0')) WHERE id = %s`. Seeded issues use explicit ids so the hero issue is CF-024 (id 24). Counts (report count, support count) are computed with subqueries/joins, never stored (no drift). Medians, time-series gap filling and distance maths are done in Python on small SQL result sets (see 10 and 12), keeping the SQL portable and simple.

---

## 8. Backend architecture

### 8.1 Request flow

FastAPI `APIRouter` -> dependencies/middleware (rate limit, auth, `require_role`, Pydantic validation) -> thin route handler (HTTP only) -> service (business logic, async transactions) -> repository (SQL) -> MySQL

### 8.2 Conventions

- Base path `/api/v1`.
- Success: `{ "data": ..., "meta"?: {...} }`.
- Error: `{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details"?: [...] } }`.
- Error classes in `app/core/errors.py` (`ValidationError` 400, `UnauthorizedError` 401, `ForbiddenError` 403, `NotFoundError` 404, `ConflictError` 409, `RateLimitError` 429); FastAPI exception handlers map them; unknown errors give a generic 500 (no stack in production).
- Pagination `?page=1&limit=20` (max 100) with `meta: {page, limit, total}`.
- Environment validated with `pydantic-settings` at startup; fail fast with a readable message.
- Pydantic v2 models use `camelCase` JSON aliases for the existing API contract (for example `issueId`, `toStatus` and `categoryId`), while Python attributes remain `snake_case`. Use one shared `to_camel` alias generator, `populate_by_name=True`, and response serialization by alias so React payloads remain compatible.
- `structlog` JSON request logging; never log passwords, tokens, API keys, or full descriptions.
- `GET /api/v1/health` returns DB connectivity + latest migration version.

### 8.3 Security (slide 7: rate limits, spam flags, moderation, duplicate review)

- Passwords: bcrypt (cost 10+), min length 8.
- Auth: JWT in an httpOnly cookie (`SameSite=Lax` locally; `SameSite=None; Secure` for cross-site production, controlled by env). 7-day expiry. `GET /auth/me` rehydrates the client session.
- CORS: FastAPI `CORSMiddleware` allow-list from `CLIENT_ORIGIN`, `allow_credentials=true`. Add explicit security headers with a small custom ASGI middleware (the Python equivalent of Helmet).
- Rate limits: global 120/min/IP; auth endpoints 10/15 min/IP; AI endpoints 20/hour/user; report creation max `MAX_REPORTS_PER_DAY` (default 10) per user (DB-checked).
- Spam flags on `POST /reports` (cheap, deterministic): identical description by the same user within 1 hour, description under 10 characters, or more than 3 reports in 10 minutes means `review_status='flagged'` and the new issue is created with `is_public=0` until a ward admin approves or rejects it.
- Uploads: jpeg/png/webp only, max 5 MB (`MAX_UPLOAD_MB`), validate by decoding with Pillow, re-encode with Pillow (max 1600 px, strip EXIF/GPS metadata). Read uploads with FastAPI `UploadFile` and enforce the size limit while streaming; do not trust the filename or browser MIME type.
- Role + scope checks happen in the service/repository layer too, not only in routes.
- Public responses never include reporter identity, contact details or internal notes.

### 8.4 Image storage

`app/lib/storage/index.py` exposes async `save_image(data, folder) -> {url, key}` and `delete_image(key)`. `STORAGE_DRIVER=local` (default; writes to `server/uploads/`, mounted by FastAPI at `/uploads`) or `cloudinary` (optional Python SDK). Seed images are generated placeholders on the local driver.

### 8.5 Notifications

`notifications/service.py` exposes `notify(conn, user_ids, type, title, body, issue_id)`, called inside transactions.  
Types: `issue_assigned` (to the assigned team member), `status_changed` (to all linked citizens), `verification_requested` (to all linked citizens), `issue_reopened` (to ward admins in scope), `support_milestone` (to reporters at 5/10/25 supporters), `new_report` (to ward admins in scope). Computed "verification overdue" shows in the ward queue. The client polls `GET /notifications` every 30 s. Delivery sits behind a notifier interface so email/SMS could be added later.

---

## 9. API contract (v1)

Write this out in full in `docs/API_CONTRACT.md` (request params, body, response shape, errors, role) during Phase 0. Roles: P public, C citizen, W ward admin.

### Meta and public

| Method | Path            | Role | Purpose                                                                                     |
| ------ | --------------- | ---- | ------------------------------------------------------------------------------------------- |
| GET    | `/health`       | P    | Health + migration version                                                                  |
| GET    | `/meta`         | P    | Wards, departments, categories, statuses, config (dup radius)                               |
| GET    | `/public/stats` | P    | Landing counts: issues, reports, supporters, resolved, verified-closure % (aggregates only) |

### Auth and profile

| Method | Path             | Role | Purpose                                                  |
| ------ | ---------------- | ---- | -------------------------------------------------------- |
| POST   | `/auth/register` | P    | Create a citizen account (name, email, password, wardId) |
| POST   | `/auth/login`    | P    | Sets cookie                                              |
| POST   | `/auth/logout`   | any  | Clears cookie                                            |
| GET    | `/auth/me`       | any  | Current user                                             |
| PATCH  | `/users/profile` | any  | name, phone, wardId                                      |

### Issues and reports (citizen experience)

| Method | Path                   | Role | Purpose                                                                                                                                                                                                                  |
| ------ | ---------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| GET    | `/issues`              | P    | Public feed. Query: ward, category, status, q, sort (recent, supported, oldest, nearest), lat, lng, radius, page, limit                                                                                                  |
| GET    | `/issues/nearby`       | P    | Lightweight map markers: lat, lng, radius, category, status                                                                                                                                                              |
| GET    | `/issues/:id`          | P    | Public detail (no private data); with a session adds viewer flags: hasSupported, isLinked, canVerify, canReopen                                                                                                          |
| GET    | `/issues/:id/timeline` | P    | Public issue_updates only                                                                                                                                                                                                |
| POST   | `/reports/precheck`    | C    | Body {description, latitude, longitude, categoryId?} returns AI suggestion + duplicate candidates. Writes nothing                                                                                                        |
| POST   | `/reports`             | C    | multipart/form-data: image, description, latitude, longitude, address, categoryId, aiSuggestedCategoryId?, joinIssueId?. With joinIssueId attaches the report and a support to that issue; otherwise creates a new issue |
| GET    | `/reports/my`          | C    | My reports with their issue status                                                                                                                                                                                       |
| POST   | `/issues/:id/support`  | C    | Support without a new report (idempotent)                                                                                                                                                                                |
| DELETE | `/issues/:id/support`  | C    | Withdraw support (not allowed for the issue's reporter)                                                                                                                                                                  |
| POST   | `/issues/:id/verify`   | C    | {rating?, comment?} only while awaiting_verification (linked)                                                                                                                                                            |
| POST   | `/issues/:id/reopen`   | C    | {reason, image?} from awaiting_verification, or resolved within the window (linked)                                                                                                                                      |

### Notifications

| Method | Path                      | Role     | Purpose             |
| ------ | ------------------------- | -------- | ------------------- |
| GET    | `/notifications`          | any auth | List + unread count |
| PATCH  | `/notifications/:id/read` | any auth | Mark one            |
| POST   | `/notifications/read-all` | any auth | Mark all            |

### Ward team console

| Method | Path                          | Role | Purpose                                                                                                                                                                       |
| ------ | ----------------------------- | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/ward/issues`                | W    | Shared queue. Filters: status, category, department, priority, sla, ageBucket, assignedTo, q. Sorts: age, priority, support, location (location = nearest to the ward centre) |
| GET    | `/ward/issues/:id`            | W    | Full workspace: all reports (reporter display name only), supporter count, all updates (public + internal), evidence, assignments, AI summary, SLA state                      |
| POST   | `/ward/issues/:id/assign`     | W    | {categoryId, departmentId, priority, assigneeId?, note?} confirms triage and assigns ownership (reported to assigned; on an assigned issue it records a reassignment)         |
| PATCH  | `/ward/issues/:id/status`     | W    | {toStatus, note?, reason?} via the state machine (start work, submit for verification, reassign after reopen, reject, overdue override)                                       |
| POST   | `/ward/issues/:id/updates`    | W    | Publish progress: {note, nextStep?, visibility}                                                                                                                               |
| POST   | `/ward/issues/:id/evidence`   | W    | multipart: image, kind (before, progress, after), caption                                                                                                                     |
| POST   | `/ward/issues/:id/ai-summary` | W    | Regenerate the Gemini summary of all reports (suggestion only)                                                                                                                |
| GET    | `/ward/team`                  | W    | Team members of the issue's ward, filterable by department (for the assignee dropdown)                                                                                        |
| GET    | `/ward/moderation`            | W    | Flagged reports/issues awaiting review                                                                                                                                        |
| POST   | `/ward/issues/:id/moderate`   | W    | {action (approve, reject), reason}                                                                                                                                            |
| GET    | `/ward/analytics/overview`    | W    | KPI cards                                                                                                                                                                     |
| GET    | `/ward/analytics/categories`  | W    | Category distribution + resolution time                                                                                                                                       |
| GET    | `/ward/analytics/timeseries`  | W    | Reports and issues per day (days=30)                                                                                                                                          |
| GET    | `/ward/analytics/scorecard`   | W    | Pilot scorecard metrics (see 12)                                                                                                                                              |
| GET    | `/ward/analytics/hotspots`    | W    | Binned open-issue hotspots                                                                                                                                                    |
| GET    | `/ward/analytics/ageing`      | W    | Ageing buckets by category                                                                                                                                                    |
| GET    | `/ward/analytics/wards`       | W    | (ward_id NULL only) By-ward comparison + ward x category backlog matrix                                                                                                       |

Every endpoint has a Pydantic request/response model where applicable, returns the standard envelope, and has at least one pytest/httpx test for success + one for auth failure.

---

## 10. Duplicate detection and clustering (the USP; spend the most effort here)

**Goal (slide 5):** "Same category, nearby location and similar text." Detect possible matches, show them to the resident, let the resident choose. Never auto-merge. Ward staff can see the whole cluster.

### 10.1 Stage 1: candidates (deterministic, source of truth)

Config (env, tunable; engineering defaults, not proven thresholds):
`DUP_RADIUS_M=150`, `DUP_LOOKBACK_DAYS=30`, `DUP_MAX_CANDIDATES=5`, `DUP_MIN_SCORE=0.35`.

1. **SQL bounding-box pre-filter (uses `idx_issues_geo`):**  
   `dLat = r/111320`, `dLng = r/(111320 * cos(lat))`.  
   Filter `is_public = 1`, `status IN ('reported', 'assigned', 'in_progress', 'awaiting_verification', 'reopened')`, `created_at >= UTC_TIMESTAMP(3) - INTERVAL %s DAY`, and `(category_id = %s OR department_id = %s)` of the chosen category. Also select the support count via subquery. Cap at 200 rows.
2. **Exact distance in Python (`app/lib/geo.py`, haversine, earth radius 6,371,000 m, unit-tested with known city-block distances).** Drop anything beyond the radius.
3. **Text similarity in Python (`app/lib/text_similarity.py`, pure and unit-tested):**  
   Normalise (NFKC, lowercase, strip punctuation using Unicode-aware regex `[\p{L}\p{N}]` so Hindi works, remove a small English stop-word list), then `textSim = 0.5 * tokenJaccard + 0.5 * charTrigramDice`, range 0 to 1. Compare against `title + ' ' + description` of the issue.
4. **Score each candidate in [0,1]:**  
   `score = 0.50 * (1 - distance/radius) + 0.35 * textSim + 0.15 * (same category ? 1 : 0)`
5. **Keep the top `DUP_MAX_CANDIDATES` with `score >= DUP_MIN_SCORE`, sorted by score.**  
   Return `distanceM`. Note: location + category alone can clear the threshold, which is intended. Text similarity is weak across synonyms ("pothole" vs "road crater") and across languages, which is exactly why stage 2 exists.

### 10.2 Stage 2: Gemini re-rank (assistive)

Send the new text + up to 5 candidate summaries to Gemini (see 11). Gemini returns per candidate `sameProblem` (bool), `confidence` (`high`, `medium`, `low`) and a one-line `reason`.  
The backend:

- discards any `issueId` that was not in the candidate list,
- clamps `reason` to 200 chars,
- keeps the stage-1 score as the ordering and attaches Gemini's verdict as a badge,
- on any Gemini failure, timeout or invalid JSON, returns stage-1 candidates only with `source: "sql"`.

### 10.3 Flow

1. Report form step 2 calls `POST /reports/precheck` and gets `{suggestion, candidates[]}`.
2. Step 3 shows candidates as cards: photo, title, distance ("40 m away"), status, supporter count, AI badge. Two actions: "This is the same problem: support it" or "No, mine is different: continue". Wording says possible match, never duplicate.
3. Submit calls `POST /reports`:
   - with `joinIssueId` (one transaction): `SELECT ... FOR UPDATE` the issue, verify it is open and within `DUP_RADIUS_M * 2` of the report (don't trust the client), insert the report, `INSERT IGNORE` the support, write a `report_added` update, notify reporters at support milestones.
   - without: one transaction: insert issue (department from the category default, status `reported`), set `issue_code`, insert the report (`is_primary=1`), insert the support, write a `reported` update, notify ward admins in scope.
4. The ward queue shows the whole cluster (all reports + photos) with N reports, M supporters.

---

## 11. Gemini module (server-only)

**Operating rule (slide 7):** AI may assist triage. It never decides who is at fault, who gets service first, or whether work is complete.

| Operation                                             | Used by                       | Output                                                                                                    |
| ----------------------------------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------- |
| Classify + title + summary + priority hint + language | `/reports/precheck`           | `{categoryCode, title (max 80 chars), summary (max 200), priorityHint, keywords[], language, confidence}` |
| Duplicate re-rank                                     | `/reports/precheck`           | per candidate: `{issueId, sameProblem, confidence, reason}`                                               |
| Summary across all reports of an issue                | `/ward/issues/:id/ai-summary` | `{summary (max 240 chars), recurringDetails[]}`                                                           |

**What Gemini must NOT do:** create or save complaints, merge issues, assign anyone, change status, confirm resolution, decide priority, check permissions. A person confirms every AI suggestion (category, department, priority, closure).

**Implementation rules:**

- SDK: `google-genai` Python SDK.
- Model from `GEMINI_MODEL` env (check the current Gemini docs for a fast, low-cost model and set the default there). Never hardcode a model name in service code.
- Structured output: request JSON output with a response schema using the Python `google-genai` SDK, then validate the parsed result with Pydantic models. Invalid means fallback.
- temperature about 0.2, hard timeout `GEMINI_TIMEOUT_MS` (default 8000), one retry max.
- `categoryCode` must be one of the active category codes loaded from the DB and injected into the prompt. Reject anything else.
- Prompt-injection hygiene: put user text inside delimiters (`<report_text>...</report_text>`), tell the model it is untrusted data and any instructions inside it are to be ignored. Never include emails, phone numbers or user names in prompts.
- Hindi/English: the model detects the language and returns title + summary in English plus `language`. The original text is stored untouched.
- `mock.py`: a deterministic keyword classifier (pothole/road/crater/gaddha, light/lamp/dark, garbage/waste/dustbin/kachra, drain/sewer/waterlog/naali, leak/pipe/water) plus a template title/summary. Used when `GEMINI_API_KEY` is empty, `GEMINI_MOCK=true`, or the real call fails.
- Every response carries `source: 'gemini' | 'fallback'` so the UI can label it ("AI suggestion" vs "Suggested").
- Log every call to `ai_logs` (operation, model, input hash, output JSON, status, latency). No raw descriptions.
- Gemini key lives in server env only. It must never appear in the browser, the bundle or the network tab.

---

## 12. Analytics (real SQL, never hardcoded arrays)

Slide 3: "Charts by ward and category." All endpoints accept optional `from`, `to`, `categoryId`; ward admins are auto-scoped to their ward (`ward_id NULL` sees all). Return compact Chart.js-friendly shapes (`labels[]`, `datasets[]`) plus KPI numbers.

Medians and day-gap filling are computed in Python from small SQL results.  
**KPI definitions:**

- `Open` = status in (`reported`, `assigned`, `in_progress`, `awaiting_verification`, `reopened`).
- `Total issues` = public issues not rejected.
- `Total reports` = reports not rejected.
- `Resolution rate` = `resolved / (resolved + open)` in the period.
- `Reopening rate` = `issues with reopened_count > 0 / issues that ever reached awaiting_verification`.

**Pilot scorecard (slide 10, "Outcomes, not downloads"). One endpoint, five metrics:**

| Metric              | Deck caption                                                           | Definition                                                                                     |
| ------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Report quality      | % with usable location + evidence                                      | Share of reports that have an image AND coordinates within 5 km of the ward centre             |
| Duplicate reduction | Similar reports grouped into one issue instead of opening a new ticket | `(reports - issues) / reports * 100` (share of reports that joined an existing issue)          |
| Time to triage      | Report to department assignment                                        | Median hours from `issues.created_at` to `first_assigned_at`                                   |
| Verified closure    | Accepted vs reopened resolutions                                       | Citizen-confirmed closures / (confirmed + reopened); show overdue-override closures separately |
| Backlog visibility  | Open issues by ward and category                                       | Matrix of open counts, ward x category                                                         |

Footer on the panel: "PILOT: one ward | one locality | feedback-led". Metrics are evaluation measures, not promised outcomes; say so in a small caption.

**Charts (Chart.js):**

| Chart                                     | Type           | Question it answers                                     |
| ----------------------------------------- | -------------- | ------------------------------------------------------- |
| Issues by category                        | Doughnut       | What are residents reporting?                           |
| Issues by ward (city view only)           | Bar            | Which ward carries the load?                            |
| Reports over time                         | Line           | Is volume rising? (fill empty days with 0 in JS/Python) |
| Open issues by department                 | Horizontal bar | Who is overloaded?                                      |
| Average resolution time by category       | Bar            | Which problems stay open longest?                       |
| Ageing buckets (0-3, 4-7, 8-14, 15+ days) | Stacked bar    | Where are stale issues piling up?                       |
| KPI cards                                 | Number + delta | Open / resolved / reopened / awaiting verification      |

**Ward performance view (slide 4: hotspots, ageing issues, category backlogs):** bin open issues into about 200 m cells (`ROUND(latitude / 0.002)`, `ROUND(longitude / 0.002)` in `GROUP BY`, selecting the same expressions), return `{lat, lng, count, topCategory}`; render as sized circles on the Leaflet map plus a ranked table "Hotspots in Ward 14". Add an ageing list (oldest open issues) and a category backlog table.

---

## 13. Design system and visual language

Match the deck exactly: calm, civic, trustworthy, confident. Dark forest panels with a lime accent on a soft paper background. Cards with generous whitespace and quiet borders. Not startup-purple, not generic dashboard blue.

**Tokens (in `styles/index.css` under `@theme`; use semantic names in components, never raw hex):**

| Token        | Hex       | Use                                                                          |
| ------------ | --------- | ---------------------------------------------------------------------------- |
| `ink`        | `#122D27` | Primary dark, headings, hero panels                                          |
| `forest-800` | `#1B3B33` | Sidebar, main buttons                                                        |
| `forest-700` | `#245445` | Hover states                                                                 |
| `forest-600` | `#2A5B45` | Accent containers                                                            |
| `forest-500` | `#316B54` | Borders on dark                                                              |
| `moss`       | `#4F6158` | Secondary text                                                               |
| `lime`       | `#C8EC78` | Accent, highlights, primary CTA on dark                                      |
| `lime-soft`  | `#E6F4C9` | Callout/banner backgrounds ("Make the neighbourhood the unit of visibility") |
| `paper`      | `#F4F7F2` | Page background                                                              |
| `mist`       | `#EAF0E8` | Surfaces, subtle cards                                                       |
| `sage-200`   | `#DDE8E0` | Dividers, quiet borders                                                      |
| `sage-300`   | `#D5E0D6` | Outer borders                                                                |
| `signal`     | `#E8893A` | Attention (awaiting verification, SLA at risk, the "!" alert dot)            |
| `danger`     | `#B42318` | Reopened, breached, destructive                                              |

**Status colours (single `StatusBadge`, icon + label, never colour alone):**  
`reported` = slate, `assigned` = teal, `in_progress` = blue, `awaiting_verification` = signal, `resolved` = green, `reopened` = red, `rejected` = grey. Priority and SLA chips follow the same pattern.

**Typography:** Headings Plus Jakarta Sans, body Inter, issue codes (`#CF-024`) in JetBrains Mono chips. Install with `npm install @fontsource/...` packages (no runtime CDN).

**Shape and motion:** `rounded-2xl` cards, 1px `sage-300` borders, soft shadows only on hover. Motion is purposeful (list entrances, count-ups, status changes) and respects `prefers-reduced-motion`.

**Deck-style details to reuse:** small uppercase section labels ("01 / PROBLEM STATEMENT" style) above headings; numbered step circles in lime; dark callout bars with lime text for the "Operating rule" and "Make the neighbourhood the unit of visibility" lines; an "Illustrative demo data" pill on seeded content. Responsive: the citizen portal is mobile-first (reporting happens on phones; bottom tab bar on mobile, sidebar on desktop). The ward console is desktop-first but usable at tablet width.

**Accessibility:** visible focus rings, labelled inputs, at least 4.5:1 text contrast, keyboard-operable dialogs, `aria-live` for toasts and AI suggestion updates, alt text on issue photos, never colour-only status.

---

## 14. Frontend architecture

### 14.1 Routes

| Route                 | Screen                                    | Guard      |
| --------------------- | ----------------------------------------- | ---------- |
| `/`                   | Landing                                   | public     |
| `/issues`             | Public feed + map toggle                  | public     |
| `/issues/:id`         | Issue detail (extra actions if logged in) | public     |
| `/login`, `/register` | Auth                                      | guest-only |
| `/app`                | Citizen dashboard                         | citizen    |
| `/app/report`         | Report flow                               | citizen    |
| `/app/my-reports`     | My reports                                | citizen    |
| `/app/notifications`  | Notifications                             | any auth   |
| `/app/profile`        | Profile                                   | any auth   |
| `/ward`               | Ward dashboard                            | ward_admin |
| `/ward/queue`         | Shared queue                              | ward_admin |
| `/ward/issues/:id`    | Issue workspace                           | ward_admin |
| `/ward/moderation`    | Flagged reports                           | ward_admin |
| `/ward/analytics`     | Analytics + performance view + scorecard  | ward_admin |

`guards.jsx`: `RequireAuth`, `RequireRole(roles)`, `GuestOnly`. After login redirect by role (citizen to `/app`, ward admin to `/ward`). Unknown routes get a friendly 404.

### 14.2 Layouts

- `PublicLayout` (top nav + footer with "Prototype proposal. Municipal integrations would need local-body approval and access.")
- `CitizenLayout` (mobile bottom tabs: Home, Feed, Report (prominent), Alerts, Me; desktop sidebar)
- `WardConsoleLayout` (dark forest-800 sidebar, header with ward context, notification bell).

### 14.3 Shared components (build once, reuse everywhere)

`components/ui`: Button, Card, Input, Textarea, Select, Modal/ConfirmDialog, Tabs, Badge, Skeleton, Pagination, Tooltip.  
`components/shared`: AppSidebar, AppHeader, StatCard (CountUp), IssueCard, IssueTable, StatusBadge, CategoryBadge, PriorityBadge, SlaChip, ReportForm (multi-step), LocationPicker, ImageUploader, ActivityTimeline, BeforeAfterSlider, AiSuggestionChip (labelled "AI suggestion", never auto-applied), SupportButton, FilterBar, NotificationPanel, EmptyState, ErrorState, IllustrativeDataBadge, ChartCard, CalloutBar.

### 14.4 State management

RTK Query `civicApi` base slice (`fetchBaseQuery`, `credentials: 'include'`, base URL from `VITE_API_URL`), extended with `injectEndpoints` per feature.  
Tags: `Me`, `Meta`, `Issue`, `IssueList`, `Timeline`, `MyReports`, `Notification`, `WardQueue`, `Analytics`, `Moderation`.  
Slices: `authSlice` (user, status; hydrated by `/auth/me` at boot, cleared on 401), `uiSlice` (sidebar, modals, map/list preference), `reportDraftSlice` (multi-step draft: location, description, image preview ref, chosen category, AI suggestion, chosen join target; persisted in `sessionStorage`), `filtersSlice` (feed + queue filters and sort, synced to URL query params).  
Invalidation: support/verify/reopen invalidate `Issue(id)`, `Timeline(id)`, `IssueList`, `MyReports`, `Notification`. Ward assign/status/update/evidence invalidate `Issue(id)`, `Timeline(id)`, `WardQueue`, `Analytics`, `Notification`. Report create invalidates `IssueList`, `MyReports`, `Analytics`.  
Optimistic update for the support toggle (roll back on error). Notifications poll every 30 s. MySQL is the source of truth; Redux is client state.

### 14.5 Key screens (build these properly)

- **Landing:** hero with the headline _Turning local problems into visible action_ and the tagline; a mini "Ward 14 / live issue map" preview with the card _Pothole reported, #CF-024, 12 nearby residents support, Assigned to Roads_ (flagged "Illustrative demo data"); the three context stats from section 1 with the source line; "Where the experience breaks down" four steps (Report, Route, Track, Verify) with the lime callout; the CAPTURE / CONNECT / RESOLVE three-column solution block; the 5-step workflow strip (Report, AI assist, Cluster, Route, Verify) with the "Assist, don't decide." panel; a "Build on what works" comparison (existing tools vs what CivicFix adds, slide 4 wording, with the note that CivicFix complements and does not replace them); the four trust cards (Privacy by design, Human-reviewed AI, Evidence and accountability, Abuse and data integrity) and the operating-rule bar; live public/stats counters; CTAs Report an issue and Browse your ward.
- **Public feed (`/issues`):** FilterBar (ward, category, status, search, sort incl. "Most supported" and "Nearest me", which asks for location permission on click). List/Map toggle. Cards show photo, #CF-0xx chip, title, category, status, distance, "12 residents support", age. Map uses status-coloured markers with clustering. Skeletons while loading; EmptyState with a CTA when nothing matches.
- **Issue detail (`/issues/:id`):** header (code, title, status, priority, category, ward, department, named owner, SLA chip) · photo gallery · BeforeAfterSlider once after evidence exists · counts (reports, supporters) · mini-map · ActivityTimeline of public updates (e.g. Reported 09:20, Assigned to Roads 10:05, Work proof pending) · SupportButton · AI summary chip when available · verification panel only when `viewer.canVerify`: "The team says this is fixed. Is it?" with _Yes, it's fixed_ (rating + comment) and _No, it's not resolved_ (reason + optional photo) · reopen button inside the window for linked citizens.
- **Report flow (`/app/report`, 4 steps, mobile-first):** mirrors the deck's "See it. Report it. Follow it.":
  1. _Where:_ map with a draggable pin; a "Use my current location" button (explicit click calls `navigator.geolocation`; handle denied/unavailable gracefully; fall back to pin + landmark text). Optional debounced reverse geocode on pin drop (cached; fully optional).
  2. _What:_ photo upload (camera on mobile via `capture`), short description (min 10 chars), category select. On continue call `/reports/precheck` and show AiSuggestionChip ("AI suggests: Pothole. Looks right?" Accept / Change). Never auto-apply.
  3. _Check:_ possible-match cards (10.3). Loading state while the precheck runs; if none, say so and continue.
  4. _Review and submit:_ exactly what will be public, privacy note ("Your contact details are never shown publicly"), submit, then a success screen with the #CF-xxx code and a link to follow it.
- **Citizen dashboard:** big Report an issue button; 4 StatCards (my reports, in progress, awaiting my verification, resolved); a "Needs your verification" list on top when relevant; nearby issues map; recent activity.
- **Ward queue (`/ward/queue`):** "Triage. Assign. Prove action.": table (`IssueTable`) with code, title, category, cluster size (reports / supporters), priority, status, age, SLA chip, owner, "verification overdue" badge; filters and sorts (location, age, priority, support); tabs for All, Needs assignment, Awaiting verification, Recently reopened; row click opens the workspace.
- **Issue workspace:** left: the cluster (all reports with photos, original text, language) + AI summary (regenerate button, labelled as a suggestion) + map; right: action panel that shows only valid next actions for the current status: Assign form (category, department, priority, team member, note; AI suggestions shown as hints) · Start work · Publish progress (action note + next step, public or internal) · Attach closure proof (completion photo + closure note, required before Submit for verification) · Reject (reason) · overdue override. Below: full timeline including internal notes. Closing/destructive actions use `ConfirmDialog`.
- **Ward analytics (`/ward/analytics`):** KPI cards, the Chart.js set from section 12, the pilot scorecard panel, hotspot map + ranked table, ageing list, category backlog table; "city view" account also sees the by-ward chart and ward x category matrix.
- **Moderation (`/ward/moderation`):** flagged items with reason, approve/reject.

### 14.6 Maps

`react-leaflet` with OpenStreetMap tiles (keep the required attribution). Marker colour = status. `LocationPicker` is reusable. Fix Leaflet's default marker icon path under Vite and import Leaflet's CSS. Lazy-load map code (`React.lazy`) so the landing page stays fast.

### 14.7 UX quality bar

Every data screen has loading skeletons, an empty state and an error state with retry. Forms validate inline in the client with zod + react-hook-form; API request/response validation uses Pydantic in FastAPI. Toasts for success/failure. No layout shift. No dead buttons: if a feature isn't built, don't render its control.

### 14.8 React Bits usage

React Bits is a copy-in component library (not a single npm package). Use the install method shown on its docs site (copy the JS + Tailwind variant of a component, or its CLI run through npx; never pnpm dlx or bunx) into `client/src/components/reactbits/`, keeping attribution comments.  
Use sparingly and purposefully:

- Landing hero: `BlurText` or `SplitText` for the headline; `Aurora` (or another subtle background) behind the hero only, lazy-loaded and disabled under `prefers-reduced-motion`.
- `CountUp` inside StatCard and landing counters.
- `SpotlightCard` as the base for feature cards and hover on IssueCard.
- `AnimatedList` for notifications and activity.
- `ShinyText` or `GradientText` for the "AI suggestion" accent only.
- `Stepper` (or custom) for the 4-step report flow if it fits.  
  If a component's name or props differ from what you expect, adapt; don't invent APIs. Animation must never block interaction or hurt mobile performance.

### 14.9 Chart.js

Register only the elements used. One ChartCard wrapper handles title, loading, empty state and a consistent palette from the design tokens. Charts read from the analytics endpoints; no hardcoded arrays.

---

## 15. Seed data and demo story

`python server/scripts/seed.py` (idempotent; clears only rows with `is_seed = 1`). Every seeded issue shows the "Illustrative demo data" badge. Seeded photos are generated placeholder images saved to `server/db/seeds/assets`, not hot-linked.  
**Wards:** Ward 14 is the demo ward (centred on `DEMO_CENTER_LAT/LNG`) with full data and all users. Ward 7 and Ward 21 get light data only, so the by-ward chart and the ward x category backlog matrix are not empty for the city view.

**Users (demo only; password `Demo@1234`; seeded only when `SEED_DEMO_USERS=true`):**

| Email                                                           | Role       | Notes                                            |
| --------------------------------------------------------------- | ---------- | ------------------------------------------------ |
| `asha@demo.civicfix.test`                                       | citizen    | Ward 14, reporter of #CF-024 (hero demo citizen) |
| `ravi@demo.civicfix.test`, `meera@demo.civicfix.test` + 7 more  | citizen    | supporters / other reporters                     |
| `ward14.lead@demo.civicfix.test`                                | ward_admin | Ward 14, department_id NULL (ward lead)          |
| `roads@demo.civicfix.test`                                      | ward_admin | Ward 14, Roads & Pavements team member           |
| `lighting@`, `sanitation@`, `drainage@`, `water@` (same domain) | ward_admin | Ward 14, one team member per department          |
| `cityview@demo.civicfix.test`                                   | ward_admin | `ward_id NULL` (all wards, for by-ward charts)   |

About 40 issues in Ward 14 over the last 45 days, around 120 reports, plus about 10 issues spread over Ward 7 and Ward 21. All five categories. Every status represented: roughly 6 reported, 8 assigned, 6 in progress, 5 awaiting verification, 10 resolved (with before/after evidence), 3 to 4 reopened, 1 rejected, and 2 spam-flagged (non-public). A few SLA at-risk and breached; realistic ageing spread.  
Hero issue **#CF-024 (id 24)**: a pothole in Ward 14, status assigned to Roads and the Roads team member, 12 supporters, 5 linked reports with varied wording ("Large pothole near market", "Road damage near bus stop", "Dangerous road crater"), timeline Reported 09:20, Assigned to Roads 10:05, Work proof: pending (seed these as today's date).  
Two more cluster demos: a streetlight cluster (4 reports) and a garbage cluster (3 reports). Leave a free spot near #CF-024 so the live demo can create a new pothole report that triggers a possible-match suggestion.

---

## 16. Environment variables

### `server/.env.example`

```env
APP_ENV=development
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
DB_HOST=localhost
DB_PORT=3306
DB_USER=civicfix
DB_PASSWORD=civicfix
DB_NAME=civicfix
DB_NAME_TEST=civicfix_test
DB_SSL=false
DB_ROOT_USER=root # used ONLY by the root db:init script (delegates to Python); never needed at runtime
DB_ROOT_PASSWORD=
JWT_SECRET=change-me-long-random
JWT_EXPIRES_IN=7d
COOKIE_SAMESITE=lax # 'none' (with Secure) for cross-site production deploys
STORAGE_DRIVER=local # local | cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
MAX_UPLOAD_MB=5
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash # set per current Gemini docs (fast, low-cost model)
GEMINI_TIMEOUT_MS=8000
GEMINI_MOCK=false
DUP_RADIUS_M=150
DUP_LOOKBACK_DAYS=30
DUP_MAX_CANDIDATES=5
DUP_MIN_SCORE=0.35
REOPEN_WINDOW_DAYS=14
VERIFICATION_OVERDUE_DAYS=7
MAX_REPORTS_PER_DAY=10
SEED_DEMO_USERS=true
DEMO_CENTER_LAT=12.9716
DEMO_CENTER_LNG=77.5946
```

### `client/.env.example`

```env
VITE_API_URL=http://localhost:4000/api/v1
```

Nothing else. No secrets with a `VITE_` prefix, ever.  
`docker-compose.yml` (optional): a `mysql:8` service with a named volume, port 3306, `MYSQL_ROOT_PASSWORD` from env, and `--character-set-server=utf8mb4`. Users without Docker can use a local MySQL 8 install instead. If neither is available, stop and ask; do not substitute another database.

---

## 17. Testing and verification

- **Backend (pytest + httpx against `DB_NAME_TEST`) must cover:**
  - State machine: every allowed transition succeeds for the right actor; every disallowed one returns 403/409; each writes an `issue_updates` row. A ward admin cannot move an issue to resolved (outside the overdue override); a non-linked citizen cannot verify/reopen; the reopen window is enforced. `awaiting_verification` is rejected without an after evidence record.
  - Duplicate engine: bbox/radius/lookback/status/category filtering; scoring order is stable; `geo.py` haversine and `text_similarity.py` have their own unit tests; Gemini failure falls back to stage-1 only.
  - Support uniqueness (double tap does nothing bad); the reporter cannot withdraw their own support.
  - Scope: a ward admin only sees their ward; `ward_id NULL` sees all.
  - Auth matrix: 401 without cookie, 403 wrong role, on a sample of every route group.
  - Upload validation: wrong type, oversize, EXIF stripped.
  - Analytics on a tiny known fixture (including the median and scorecard maths).
  - Public endpoints leak no emails, phones or reporter names.
- **Frontend:** `npm run lint` and `npm run build` pass with zero errors/warnings. Use the Antigravity browser to walk the demo script (section 18) at phone width and desktop width and capture screenshots into the walkthrough artifact.

---

## 18. Definition of done and the demo script

Done means this works end to end on seeded data, with Gemini both on and off (`GEMINI_MOCK=true`).  
It is the deck's demo story: Resident reports pothole, neighbours support, ward assigns, work proof uploaded, resident confirms or reopens.

1. **Resident (phone width):** log in as Asha. The feed and map show seeded issues including #CF-024 (12 supporters, assigned to Roads).
2. **Start a new pothole report near #CF-024.** Step 2 shows an AI category suggestion. Step 3 shows #CF-024 as a possible match with distance and reason. Tap "Support this issue instead": supporters 12 to 13 and the timeline records it. (Also demo the other branch: "mine is different" creates a new issue.)
3. **Ward lead:** log in. The queue shows #CF-024 as 5 reports, 13 supporters. Open the workspace, confirm category/department/priority, assign to the Roads team member; the SLA clock starts.
4. **Roads team member:** Start work, publish a progress note with a next step, attach completion proof, then Submit for verification.
5. **Resident:** the notification arrives. Open the issue, use the before/after slider and Confirm the fix (status `resolved`). Repeat on another issue and flag it as not resolved (status `reopened`, ward admins notified).
6. **Ward analytics:** KPI cards, charts, hotspots and the pilot scorecard reflect the new actions (duplicate reduction, time to triage, verified closure, backlog).
7. **Trust check:** no endpoint lets AI or the ward team mark an issue citizen-confirmed; public responses expose no private data; the Gemini key and DB credentials never appear in the browser network tab or bundle.

Also deliver: `README.md` (setup in the 5 commands from section 4, demo accounts, env, scripts), `docs/DEMO_SCRIPT.md`, `docs/ARCHITECTURE.md` (Mermaid diagram), and `docs/API_CONTRACT.md` matching the code.

---

## 19. Common pitfalls to avoid

- Using pnpm or yarn, or adding an ORM / another database "to make it easier".
- SQL in controllers, or status updates outside the state machine.
- aiomysql gotchas: use `%s` (not `?`) placeholders; use `DictCursor` consistently; close cursors and release pooled connections; DATETIME values are naive so interpret them as UTC; avoid connection leaks; respect `ONLY_FULL_GROUP_BY` and keep all timestamps in UTC.
- Treating Gemini output as trusted (always schema-validate; allow-list ids and codes).
- Letting an AI suggestion silently overwrite the resident's chosen category.
- Hardcoded chart data, or analytics computed in React.
- Building three apps. It is one React app with role-based routes.
- Leaflet markers invisible under Vite (icon path fix) and Leaflet CSS not imported.
- Cookies failing in production: cross-site needs `SameSite=None; Secure` + CORS `credentials: true` + correct `CLIENT_ORIGIN`.
- npm scripts that only work in bash.
- Making a pretty UI over a broken loop. The report to verified-closure loop comes first.
