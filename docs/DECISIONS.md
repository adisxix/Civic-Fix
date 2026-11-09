# CivicFix Decision Log

## 001 - Folder Naming: `frontend` and `backend`

- **Date**: 2026-11-09
- **Decision**: Name the client and server directories `frontend` and `backend` (instead of `client` and `server`) as explicitly instructed by the user.
- **Rationale**: User explicit instruction: "build the whole project now with folder names frontend and backend complete project". All root scripts, configurations, imports, and docs will reference `frontend/` and `backend/`.
- **Impact**: Root package scripts run `backend` for the Python API and `frontend` for the React client.

## 002 - LLM Provider: Replace Gemini with Groq API

- **Date**: 2026-11-09
- **Decision**: Completely replace Gemini API with Groq API (`openai/gpt-oss-120b` / `llama`) across the entire stack.
- **Rationale**: User requested using Groq exclusively instead of Gemini for fast, free-tier structured JSON inference.
- **Impact**: Backend uses `GroqClient` for report classification, duplicate re-ranking, and cluster summarization with identical structured output schemas and deterministic offline fallback. All Gemini dependencies, configurations, and references have been removed.
