# CivicFix — Issues & Improvements Tracker

This document tracks identified bugs, UX design issues, and their resolutions.

---

### Identified Issues & Resolution Status

| ID | Issue Description | Component | Root Cause | Status |
| :--- | :--- | :--- | :--- | :--- |
| **ISSUE-01** | **Demo User Login Failed (HTTP 400)** | Backend (`auth/schemas.py`) | Pydantic `EmailStr` strictly rejects `.test` TLD as an RFC 6761 special-use domain. Replaced with clean regex validator that permits `.test` demo domains. | ✅ Fixed |
| **ISSUE-02** | **Frontend Login Response Uncaught TypeError** | Frontend (`LoginPage.jsx`) | Frontend accessed `res.user.full_name`, but backend envelope returns `res.data`. Resolved by normalizing `user = res?.data || res?.user || res`. | ✅ Fixed |
| **ISSUE-03** | **Cross-Site Authentication Cookie Block** | Full-Stack (`auth/router.py`, `civicApi.js`, `main.py`) | Cross-origin requests between Vercel and Render block third-party cookies. Added fallback `Authorization: Bearer <token>` in `fetchBaseQuery` and allowed `*.vercel.app` origin regex. | ✅ Fixed |
| **ISSUE-04** | **Unseeded Demo Account in Quick Login** | Frontend (`LoginPage.jsx`) | `mod@demo.civicfix.test` was in UI but not in database. Replaced with real seeded accounts (`Asha`, `Ward 14 Lead`, `Roads Dept`, `City View`). | ✅ Fixed |
| **ISSUE-05** | **Landing Page Looks Like a Slide Presentation** | Frontend (`LandingPage.jsx`) | Page previously structured like pitch deck slides with "01 / WARD 14 PILOT" and text quotes. Redesigned into a modern civic product portal with interactive issue previews, clean pillars, and clear CTAs. | ✅ Fixed |
| **ISSUE-06** | **Missing Brand Logo and Custom Favicon** | Frontend (`components`, `public/`) | Created official `CivicFixLogo.jsx` SVG badge (emerald shield + lime civic pin & fix checkmark) and replaced Vite default favicon with the official brand icon. | ✅ Fixed |
| **ISSUE-07** | **Unused Non-Contributing Assets** | Frontend (`assets/`) | Deleted unreferenced `hero.png` file to keep repository lightweight and clean. | ✅ Fixed |

---

### Verification
- **Backend Unit Tests:** 12/12 passed (`python -m pytest backend/tests`).
- **Backend Linting:** Clean (`python -m ruff check backend`).
- **Frontend ESLint:** Zero errors / zero warnings (`npm --prefix frontend run lint`).
- **Frontend Production Build:** Built cleanly with Vite (`npm --prefix frontend run build`).
- **Code Style:** 100% Prettier and Ruff formatted (`npm run format:check`).
