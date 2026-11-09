# CivicFix Decision Log

## 001 - Folder Naming: `frontend` and `backend`

- **Date**: 2026-11-09
- **Decision**: Name the client and server directories `frontend` and `backend` (instead of `client` and `server`) as explicitly instructed by the user.
- **Rationale**: User explicit instruction: "build the whole project now with folder names frontend and backend complete project". All root scripts, configurations, imports, and docs will reference `frontend/` and `backend/`.
- **Impact**: Root package scripts run `backend` for the Python API and `frontend` for the React client.

## 002 - LLM Provider: Support Groq API Alongside Gemini

- **Date**: 2026-11-09
- **Decision**: Add Groq API (`llama-3.3-70b-versatile`) as a supported first-class LLM provider alongside Gemini, selectable via `AI_PROVIDER=groq` in `.env`.
- **Rationale**: User requested using a Groq API key instead of Gemini for fast, free-tier structured JSON inference.
- **Impact**: Backend supports `GroqClient` for report classification, duplicate re-ranking, and cluster summarization with identical structured output schemas and deterministic offline fallback.
