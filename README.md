# CivicFix

**Report once. Unite neighbourhood voices. Track every action.**

CivicFix is a neighbourhood-first civic issue platform that groups similar reports into visible neighbourhood issues, streamlines department routing, and ensures citizen-verified closures.

---

## 5-Step Quickstart

### 1. Prerequisites

- Python 3.12+
- Node.js 20+
- MySQL 8.0 running on `localhost:3306`

### 2. Environment Setup

```bash
# Set up Python virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

# Install backend dependencies
pip install -r backend/requirements.txt

# Install frontend and root dependencies
npm install
npm --prefix frontend install
```

### 3. Configure Environment Variables

Copy `.env.example` templates:

```bash
# Windows:
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
# macOS/Linux:
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 4. Initialize and Seed the Database

```bash
npm run db:init
npm run db:reset
npm run db:seed
```

### 5. Start Development Servers

```bash
npm run dev
```

- Frontend UI: `http://localhost:5173`
- Backend API: `http://localhost:4000/api/v1`
- API Docs: `http://localhost:4000/docs`

---

## Seed Demo Accounts

Password for all demo accounts: `Demo@1234`

| Email                            | Role       | Scope     | Description                                |
| -------------------------------- | ---------- | --------- | ------------------------------------------ |
| `asha@demo.civicfix.test`        | Citizen    | Ward 14   | Primary demo citizen (reporter of #CF-024) |
| `ravi@demo.civicfix.test`        | Citizen    | Ward 14   | Citizen supporter                          |
| `meera@demo.civicfix.test`       | Citizen    | Ward 14   | Citizen supporter                          |
| `ward14.lead@demo.civicfix.test` | Ward Admin | Ward 14   | Ward 14 Lead (covers all departments)      |
| `roads@demo.civicfix.test`       | Ward Admin | Ward 14   | Roads & Pavements team member              |
| `lighting@demo.civicfix.test`    | Ward Admin | Ward 14   | Street Lighting team member                |
| `sanitation@demo.civicfix.test`  | Ward Admin | Ward 14   | Sanitation team member                     |
| `drainage@demo.civicfix.test`    | Ward Admin | Ward 14   | Drainage & Sewerage team member            |
| `water@demo.civicfix.test`       | Ward Admin | Ward 14   | Water Supply team member                   |
| `cityview@demo.civicfix.test`    | Ward Admin | All Wards | City-wide coordinator (ward_id NULL)       |
