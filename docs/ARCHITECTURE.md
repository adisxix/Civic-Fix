# CivicFix Architecture

## System Overview

CivicFix is architected as a clean modular monolith:

1. **Frontend (`frontend/`)**: React 19 (Vite, JavaScript), Tailwind CSS v4, Redux Toolkit + RTK Query, React Bits, Lucide React, Leaflet, and Chart.js.
2. **Backend API (`backend/`)**: Python 3.12+ with FastAPI and Uvicorn. Layered architecture: `APIRouter` -> Dependencies (Auth, Role check, Rate limit) -> Route handlers -> Service (business transactions) -> Repository (parameterised raw SQL).
3. **Database (`MySQL 8`)**: Relational database with InnoDB, utf8mb4, spatial indexing, CHECK constraints, and strict transactions.
4. **AI Assist (`Groq API`)**: Groq AI SDK (server-side only) with structured outputs, prompt-injection isolation, and deterministic local fallback (`mock.py`).

```mermaid
flowchart TD
    subgraph Browser ["Client: React + RTK Query"]
        UI["React UI (Vite + Tailwind v4)"]
        Redux["Redux Toolkit (Slices: Auth, UI, Draft)"]
        RTKQ["RTK Query (civicApi)"]
        UI --> Redux
        UI --> RTKQ
    end

    subgraph Backend ["FastAPI Application (Modular Monolith)"]
        MW["Middleware (CORS, Security Headers, Rate Limits)"]
        AuthDep["Auth & Scope Dependencies"]
        Router["APIRouters (/api/v1/...)"]
        Service["Services (Business Logic & with_transaction)"]
        Repo["Repositories (aiomysql Parameterised SQL)"]
        StateMach["Issue State Machine"]

        MW --> AuthDep --> Router --> Service
        Service --> StateMach
        Service --> Repo
    end

    subgraph Storage ["External & Persistence"]
        MySQL[("MySQL 8 (InnoDB, utf8mb4)")]
        Disk[("Local Uploads / Cloudinary")]
        Groq["Groq AI API (Assist Only)"]
    end

    RTKQ <-->|HTTP / Cookie Auth| MW
    Repo <-->|Raw SQL via aiomysql| MySQL
    Service -->|Pillow Sanitised Files| Disk
    Service -->|Classification & Duplicate Re-rank| Groq
```

---

## Issue Lifecycle State Machine

Status transitions are governed strictly by `issue_state_machine.py`. Every transition executes inside an active transaction, locks the issue row (`SELECT ... FOR UPDATE`), verifies actor permissions and prerequisite conditions, writes an immutable `issue_updates` row, and creates in-app notifications.

```mermaid
stateDiagram-v2
    [*] --> reported: Citizen submits report

    reported --> assigned: Ward Admin confirms triage (cat/dept/prio) & assigns
    reported --> rejected: Ward Admin rejects (spam/invalid)

    assigned --> in_progress: Ward Admin starts work
    assigned --> rejected: Ward Admin rejects

    in_progress --> awaiting_verification: Ward Admin uploads closure proof + note
    in_progress --> rejected: Ward Admin rejects

    awaiting_verification --> resolved: Linked Citizen confirms fix
    awaiting_verification --> resolved: Ward Admin overdue override (audited)
    awaiting_verification --> reopened: Linked Citizen flags not resolved (reason required)

    resolved --> reopened: Linked Citizen reopens within 14 days
    resolved --> [*]: Verified closure permanent

    reopened --> assigned: Ward Admin re-triages & reassigns (resets SLA)
    reopened --> rejected: Ward Admin rejects

    rejected --> [*]: Closed
```

### Transition Matrix Summary

| From                       | To                      | Actor            | Pre-conditions                                                                                  |
| -------------------------- | ----------------------- | ---------------- | ----------------------------------------------------------------------------------------------- |
| `reported`                 | `assigned`              | `ward_admin`     | Confirmed category, department, priority. Optional assignee matching department.                |
| `assigned`                 | `in_progress`           | `ward_admin`     | Direct start.                                                                                   |
| `assigned` / `in_progress` | `awaiting_verification` | `ward_admin`     | Requires at least 1 'after' evidence photo + closure note.                                      |
| `awaiting_verification`    | `resolved`              | linked `citizen` | Citizen confirmation. Overdue override permitted for ward_admin after 7 days with audited note. |
| `awaiting_verification`    | `reopened`              | linked `citizen` | Citizen dispute with reason. Increments `reopened_count`.                                       |
| `resolved`                 | `reopened`              | linked `citizen` | Allowed strictly within 14 days of `resolved_at`.                                               |
| `reopened`                 | `assigned`              | `ward_admin`     | Re-assigns and recalculates SLA clock.                                                          |
| `*`                        | `rejected`              | `ward_admin`     | Allowed from `reported`, `assigned`, `in_progress`, `reopened` with reason.                     |
