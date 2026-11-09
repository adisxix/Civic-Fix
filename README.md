# CivicFix

CivicFix is a neighbourhood-first civic issue reporting and resolution platform designed to turn local problems into visible community action. Built with React and powered by a high-performance Python FastAPI backend, MySQL 8, Groq AI, and Cloudinary, CivicFix transforms fragmented civic complaints into unified neighbourhood issues. Beyond basic complaint ticketing, the platform solves the core breakdowns of municipal management: residents file duplicate reports without knowing, tickets get closed without real fixes, and departments lack cross-ward visibility. Using Groq AI-powered duplicate detection, CivicFix clusters similar nearby reports under a single visible issue with community upvoting. Ward operations teams gain an interactive triage console with SLA tracking, before/after proof verification, and automated citizen closure confirmation—preventing premature closures and ensuring real accountability.

## Features

- **AI-Assisted Duplicate Clustering:** Detects nearby complaints with similar descriptions using Groq AI (`openai/gpt-oss-120b`) and spatial distance scoring to group duplicates into unified neighbourhood issues.
- **Citizen-Verified Closure:** Issues cannot be silently closed by officials—residents verify resolution with interactive Before/After image comparison sliders and can reopen tickets if work is incomplete.
- **Interactive Ward Feed & Map:** Live geospatial issue explorer with Leaflet map, cluster markers, status color-coding, and location-based sorting.
- **Multi-Step Report Flow:** Guided citizen reporting wizard with GPS location picker, mobile camera image upload, and real-time AI category suggestion.
- **Community Support & Upvoting:** Neighbours can support existing issues with a single tap, increasing issue priority without flooding municipal queues.
- **Ward Management Console:** Comprehensive triage workspace for ward admins to assign departments, dispatch team members, record progress updates, and review evidence.
- **SLA Clock & Automated Overdue Overrides:** Built-in service level agreement countdowns with at-risk warnings and overdue flags based on category severity.
- **Real-Time Analytics & Pilot Scorecard:** Chart.js-powered visual metrics for category distribution, resolution timelines, ageing backlogs, and duplicate reduction rates.
- **Privacy by Design:** Automatic EXIF metadata stripping from uploaded photos; citizen contact info and personal data are never exposed on public endpoints.
- **Deterministic Offline Fallback:** Full application resilience—if Groq AI is offline, local heuristic keyword matching takes over seamlessly.

## Tech Stack

- **ReactJS (Vite)**
- **Python (FastAPI)**
- **MySQL 8 (via aiomysql & pymysql)**
- **Groq AI API (openai/gpt-oss-120b)**
- **Cloudinary (Image Storage)**
- **Tailwind CSS**
- **Redux Toolkit & RTK Query**
- **React Leaflet (OpenStreetMap)**
- **Chart.js (react-chartjs-2)**
- **Lucide React Icons**

## ⚙️ Getting Started

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) (v20+) and [Python](https://www.python.org/) (v3.12+) installed on your machine, along with [Git](https://git-scm.com/) and [MySQL 8](https://dev.mysql.com/downloads/installer/) (or a cloud MySQL instance like [TiDB Cloud](https://tidbcloud.com)).

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/adisxix/Civic-Fix.git
   cd Civic-Fix
   ```

2. **Setup Backend:**

   ```bash
   cd backend
   python -m venv .venv

   # On Windows:
   .\.venv\Scripts\activate
   # On macOS/Linux:
   source .venv/bin/activate

   pip install -r requirements.txt
   ```

3. **Configure Environment Variables:**
   Copy the example environment files:

   ```bash
   # In backend directory:
   copy .env.example .env     # Windows
   # or: cp .env.example .env # macOS/Linux
   ```

   _(Update your database credentials, Groq API key, and Cloudinary settings in `backend/.env`)_

4. **Initialize & Seed Database:**

   ```bash
   python scripts/init_db.py
   python scripts/migrate.py
   python scripts/seed.py
   ```

5. **Run Backend Server:**

   ```bash
   python -m uvicorn app.main:app --host 0.0.0.0 --port 4000 --reload
   ```

6. **Setup Frontend (in a new terminal):**

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

7. **Open Application:**
   Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable                | Description                                            | Default                    |
| :---------------------- | :----------------------------------------------------- | :------------------------- |
| `APP_ENV`               | Application environment (`development` / `production`) | `development`              |
| `PORT`                  | FastAPI backend server port                            | `4000`                     |
| `CLIENT_ORIGIN`         | Allowed CORS frontend origin                           | `http://localhost:5173`    |
| `DB_HOST`               | MySQL database host address                            | `localhost`                |
| `DB_PORT`               | MySQL database port                                    | `3306`                     |
| `DB_USER`               | MySQL database user                                    | `civicfix`                 |
| `DB_PASSWORD`           | MySQL database password                                | `civicfix`                 |
| `DB_NAME`               | MySQL database name                                    | `civicfix`                 |
| `DB_SSL`                | Enable TLS/SSL connection (`true` / `false`)           | `false`                    |
| `JWT_SECRET`            | Secret key for signing JWT tokens                      | `change-me-long-random...` |
| `JWT_EXPIRES_IN`        | JWT token expiration duration                          | `7d`                       |
| `COOKIE_SAMESITE`       | Cookie SameSite policy (`lax` / `none`)                | `lax`                      |
| `STORAGE_DRIVER`        | Media storage provider (`local` / `cloudinary`)        | `local`                    |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud identifier                            | -                          |
| `CLOUDINARY_API_KEY`    | Cloudinary API key                                     | -                          |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret                                  | -                          |
| `GROQ_API_KEY`          | Groq AI API key for fast inference                     | -                          |
| `GROQ_MODEL`            | Groq LLM model name                                    | `openai/gpt-oss-120b`      |
| `GROQ_TIMEOUT_MS`       | AI request timeout in milliseconds                     | `8000`                     |
| `DUP_RADIUS_M`          | Duplicate detection spatial radius (meters)            | `150`                      |
| `DUP_LOOKBACK_DAYS`     | Lookback window for similar issues (days)              | `30`                       |

### Frontend (`frontend/.env`)

| Variable       | Description                                  | Default                        |
| :------------- | :------------------------------------------- | :----------------------------- |
| `VITE_API_URL` | Base API URL pointing to the FastAPI backend | `http://localhost:4000/api/v1` |

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](https://github.com/adisxix/Civic-Fix/blob/main/LICENSE) file for details.

## 👤 Author

**Aditya Sharma**  
GitHub: [@adisxix](https://github.com/adisxix)
