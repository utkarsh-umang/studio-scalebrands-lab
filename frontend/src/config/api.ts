/**
 * API base URL for the generated client (`OpenAPI.BASE`).
 * Set `VITE_API_BASE_URL` in `frontend/.env` (e.g. http://127.0.0.1:8000). Default has no `/api/v1`
 * suffix; if you include `/api/v1`, Drive media stream URLs still resolve after normalization.
 * Backend must allow this origin in `CORS_ORIGINS` (e.g. http://localhost:5173).
 *
 * An explicitly empty string (`VITE_API_BASE_URL=` with nothing after it) means
 * same-origin — requests go through Firebase Hosting's rewrite to Cloud Run rather
 * than a hardcoded host. Only an *unset* var falls back to the local dev default.
 */
const raw = import.meta.env.VITE_API_BASE_URL
const apiBaseUrl = typeof raw === 'string' ? raw.trim() : 'http://127.0.0.1:8000'

export { apiBaseUrl }
