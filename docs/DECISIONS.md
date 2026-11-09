# CivicFix Decision Log

## 001 - Folder Naming: `frontend` and `backend`

- **Date**: 2026-11-09
- **Decision**: Name the client and server directories `frontend` and `backend` (instead of `client` and `server`) as explicitly instructed by the user.
- **Rationale**: User explicit instruction: "build the whole project now with folder names frontend and backend complete project". All root scripts, configurations, imports, and docs will reference `frontend/` and `backend/`.
- **Impact**: Root package scripts run `backend` for the Python API and `frontend` for the React client.
