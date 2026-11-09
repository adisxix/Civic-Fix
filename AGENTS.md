# CivicFix: Agent Rules

You are building CivicFix, a neighbourhood-first civic issue platform: React + Python/FastAPI + MySQL + Groq AI API. The full spec is docs/SPEC.md. Read the relevant section before touching any area of the code. Progress is tracked in docs/PROGRESS.md.

## Non-negotiable rules

1. **Spec is the source of truth.** If you want to deviate, write the deviation and reason in docs/DECISIONS.md first, then continue. Do not silently change the schema, API contract or status lifecycle.
2. **JavaScript tooling:** use npm for root tooling and the React client only. Use `npm install`, `npm ci`, `npm run` and `npx`. Never use pnpm, yarn or bun, and never `pnpm dlx` / `bunx`. Commit package-lock.json files for root/client only. Node 20+ is required for Vite/frontend tooling (.nvmrc), not for the API. Python backend dependencies use the project virtual environment and pip with `server/requirements.txt`; do not add a Node backend.
3. **Locked stack.**
   - Frontend: React (Vite, JavaScript/JSX), Tailwind CSS, Redux Toolkit, React Bits, Lucide React and Chart.js.
   - Backend: Python 3.12+ with FastAPI and Uvicorn.
   - Database: MySQL 8 via aiomysql and hand-written SQL.
   - Do NOT use Node/Express as the backend, PostgreSQL, SQLite, MongoDB, Firebase, Supabase, or any ORM/query builder (no SQLAlchemy ORM, Prisma, Sequelize, TypeORM or Knex).
4. **One API contract.** `docs/API_CONTRACT.md` is the single interface between client and server. Update it in the same change as any endpoint change.
5. **FastAPI layering:** `APIRouter` -> dependencies/middleware (auth, role checks, rate limit) -> thin route handler (HTTP only) -> service (business logic, transactions) -> repository (SQL). No SQL outside repositories. No business logic in route handlers. No Request/Response objects in services.
6. **SQL safety:** aiomysql parameterised queries only (`%s` placeholders). Never concatenate user input into SQL. Multi-step writes use async transactions (`with_transaction`). Lock rows with `SELECT ... FOR UPDATE` inside transactions when racing writes matter.
7. **Secrets:** the Groq key, DB credentials, JWT secret and any cloud keys live only in server env. The browser never talks to the database. Nothing secret in client code, `VITE_*` vars, Redux, logs or responses. Commit `.env.example`, never `.env`.
8. **AI assists, never decides.** Groq may suggest a category, summary, priority hint or possible duplicates. It must never create/merge issues, assign anyone, change status, or approve a closure. Every AI call has a deterministic fallback and a timeout; the app must work with AI fully offline.
9. **No auto-merge, no auto-close.** A person always confirms duplicates, routing, priority and closure.
10. **Privacy:** public endpoints never return reporter email/phone/name. Strip EXIF/GPS from uploaded photos. Ask permission (an explicit button click) before using device location.
11. **Server data lives in RTK Query, not hand-written slices.** Redux slices are only for auth session, UI state, report draft and filters.
12. **Reuse components.** Check `client/src/components/` before creating UI. No copy-pasted buttons, cards, badges or tables.
13. **Status changes only through `issue_state_machine`**, which also writes an `issue_updates` row. Never `UPDATE issues SET status` anywhere else.
14. **Seeded data is labelled "Illustrative demo data" in the UI.**
15. **Cross-platform scripts.** Everything must run on Windows, macOS and Linux: no bash-only commands in npm scripts. Use npm/concurrently only to orchestrate the React client and Python API; database utilities are Python scripts. Do not create backend JavaScript scripts.
16. **Quality gate:** ESLint + Prettier for root/client JavaScript; Ruff for Python linting and formatting. A phase is not done until root lint, format check, pytest, client tests (where present) and frontend build pass.

## Working style

Work in small, verifiable steps. After each step run the relevant check (migration, test, build, curl, or browser). Don't rewrite whole files to make small changes. Don't leave TODO stubs that pretend to work. If something is ambiguous, pick the simplest option consistent with the spec, log it in `docs/DECISIONS.md`, and continue. Finish every phase with: what was built, how to run/verify it, known gaps. Update `docs/PROGRESS.md`. Then stop and wait. Code style: Python backend (type hints, async I/O, snake_case) and JavaScript ES modules in the frontend. Keep files under 300 lines where practical and use meaningful names.
