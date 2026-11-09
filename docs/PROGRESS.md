# CivicFix Progress & Roadmap

## Phase Checklist

- [x] **Phase 0: Plan and scaffold (Python FastAPI + React/npm tooling)**
- [x] **Phase 1: Database (MySQL 8 aiomysql schema, migrations & seed scripts)**
- [x] **Phase 2: Backend core (auth, meta, middleware, JWT cookies, security headers, rate limits)**
- [x] **Phase 3: Backend: reports, issues, duplicate detection, uploads, EXIF strip**
- [x] **Phase 4: Backend: ward workflow (state machine, assign, evidence, verification)**
- [x] **Phase 5: Backend: Gemini AI assist + offline fallback + ward analytics**
- [x] **Phase 6: Frontend foundation (Vite, Tailwind CSS v4, RTK Query, design system)**
- [x] **Phase 7: Citizen portal (dashboard, 4-step report flow with duplicate check, my reports, notifications, profile)**
- [x] **Phase 8: Ward console and analytics (queue triage, workspace, evidence, moderation, Chart.js)**
- [x] **Phase 9: Polish, hardening, docs, quality gates (Ruff, ESLint, Prettier, Pytest, Vite build)**

---

## Priority Deliverables

### P0 (Must work for demo)

- [x] Authentication (citizen & ward admin via JWT httpOnly cookie, single-click demo logins)
- [x] Guided report form (photo, location picker with GPS, description, category)
- [x] AI precheck (suggested category, summary, duplicate detection)
- [x] Support an issue (idempotent citizen support)
- [x] Nearby feed + map view + issue detail
- [x] Ward queue (triage, status, SLA chips)
- [x] Issue assignment (department + team member)
- [x] Activity timeline with state transitions
- [x] Evidence upload (before, progress, after closure proof)
- [x] Citizen verify / reopen workflow
- [x] In-app notifications
- [x] Realistic seed demo data (Ward 14 issues, demo users, reference categories)

### P1 (Strongly expected)

- [x] SLA clock calculation and visual status chip
- [x] Before/After image comparison slider
- [x] Chart.js analytics dashboards (doughnut, timeseries line, ageing bar, hotspots)
- [x] Ward performance view (hotspots, ageing, category backlog)
- [x] Pilot scorecard metrics
- [x] Moderation (spam detection and flagging queue)
- [x] Rate limiting (global, auth, AI, reports via SlowAPI)

---

## Verification Summary

1. **Python tests**: 12/12 pytest unit tests pass (`backend/tests/unit/test_geo_and_text.py`, `backend/tests/unit/test_health_and_auth.py`).
2. **Backend linting**: `python -m ruff check backend` passes with 0 warnings.
3. **Frontend linting**: `npm --prefix frontend run lint` passes with 0 warnings.
4. **Code formatting**: `prettier --check . && python -m ruff format --check backend` passes with 0 errors.
5. **Frontend build**: `npm run build` generates optimized production bundle in `frontend/dist/`.
