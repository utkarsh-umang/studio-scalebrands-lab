# Production readiness notes

Checklist of items to review and fix **before** deploying Studio (Path B) to production. Not blockers for local dev; use as a pre-launch gate.

**Related:** [`backend-plans/B0-auth-and-core-schema.md`](./backend-plans/B0-auth-and-core-schema.md), [`b11-integration-test-plan.md`](./b11-integration-test-plan.md)

---

## Priority legend

| Priority | Meaning |
|----------|---------|
| **P0** | Must fix before any public/production traffic |
| **P1** | Should fix for first production launch |
| **P2** | Hardening / follow-up soon after launch |

---

## Authentication & sessions

| # | Priority | Item | Current state | Recommended action |
|---|----------|------|---------------|-------------------|
| A1 | P0 | `SECRET_KEY` | Default `change-me-in-production` in examples | Set a long random secret in prod secrets manager; never commit. Rotating invalidates all JWTs. |
| A2 | P0 | Demo seed | `SEED_DEMO_USERS` can create `demo1234` accounts | Set `SEED_DEMO_USERS=false` in production env. |
| A3 | P0 | Bootstrap admin | `BOOTSTRAP_ADMIN_*` in env; seed upserts on every run | Use strong password; run seed only at deploy. Consider one-time bootstrap job, not repeated upsert in prod pipelines. |
| A4 | P1 | Logout / token revoke | Sign out is **client-only** (clears `localStorage`); no `POST /auth/logout` | JWT remains valid until `ACCESS_TOKEN_EXPIRE_MINUTES` expires. Add optional logout endpoint + Redis denylist if stolen-token risk matters. |
| A5 | P1 | Token storage | JWT in `localStorage` (`sbl_access_token`) | Prefer **httpOnly Secure cookies** + CSRF strategy for production to reduce XSS token theft. |
| A6 | P1 | Token lifetime | `ACCESS_TOKEN_EXPIRE_MINUTES` (default 60) | Tune for prod; consider refresh tokens if sessions should last longer without huge access-token TTL. |
| A7 | P2 | Rate limiting on login | Not implemented | Add rate limit / lockout on `POST /auth/login` to reduce brute force. |
| A8 | P2 | Password policy | Minimal validation at provision time | Enforce minimum length/complexity for client + staff provisioning. |

**What is already in place:** Protected `/api/v1/*` routes use `Authorization: Bearer <jwt>`; `get_current_user` + `require_roles` return **401** / **403**. Frontend generated client sends the token via `OpenAPI.TOKEN` after login.

---

## API exposure & network

| # | Priority | Item | Current state | Recommended action |
|---|----------|------|---------------|-------------------|
| N1 | P0 | Public bind | API may listen on `0.0.0.0:8000` in Docker | Put API behind HTTPS reverse proxy (TLS termination); do not expose Postgres/Redis/Mongo to the internet. |
| N2 | P0 | Database credentials | Default `postgres`/`postgres` in examples | Unique strong passwords; restricted network access. |
| N3 | P1 | CORS | `CORS_ORIGINS` list in `.env` | Set to **exact** production frontend origin(s) only; no `*`. |
| N4 | P1 | OpenAPI / docs | `/openapi.json`, `/docs` enabled on FastAPI app | Disable or protect in prod (`openapi_url=None`, `docs_url=None`) unless intentionally public. |
| N5 | P1 | Health endpoint | `GET /health` is public | Acceptable for load balancers; avoid leaking sensitive details in response body. |
| N6 | P2 | CORS vs curl | CORS does not block non-browser clients | Rely on JWT + network policy; do not assume CORS equals “API is private”. |

---

## Secrets & configuration

| # | Priority | Item | Current state | Recommended action |
|---|----------|------|---------------|-------------------|
| S1 | P0 | `.env` in repo | `.env` gitignored; `.env.example` only | Confirm CI/CD injects secrets; audit that real `.env` is never committed. |
| S2 | P0 | `ENVIRONMENT` | `local` default | Set `ENVIRONMENT=prod` (or `uat`) in production; verify Mongo/GCP secret paths if used. |
| S3 | P1 | GCP secrets | Optional `GCP_PROJECT_ID` / `GCP_SECRET_NAME` for Mongo | Wire prod Mongo URI via Secret Manager if not using compose. |
| S4 | P1 | Frontend API URL | `VITE_API_BASE_URL` baked at build time | Build frontend with production API URL; ensure HTTPS. |

---

## Authorization & data access

| # | Priority | Item | Current state | Recommended action |
|---|----------|------|---------------|-------------------|
| Z1 | P1 | Role guards | Routes use `require_roles(admin|client|editor|smm)` | Re-audit new endpoints before ship; integration tests per role. |
| Z2 | P1 | Row-level access | Workspace services filter by client assignment / profile | Run fix-mode flows; add tests that client A cannot read client B batches (IDs in URL). |
| Z3 | P2 | `GET /batches/{id}` | Any authenticated user + `assert_batch_access` in service | Confirm service denies cross-tenant access (not only 404). |

---

## Frontend

| # | Priority | Item | Current state | Recommended action |
|---|----------|------|---------------|-------------------|
| F1 | P1 | Logout redirect | Fixed: clears token + navigates to `/login` | Verify after auth changes; no stale React Query `me` cache. |
| F2 | P1 | 401 handling | Clears token on failed `/me` | Extend global handler: any API **401** → logout + redirect login. |
| F3 | P2 | Drive manifests | Client-side `DRIVE_MANIFESTS` / manifest sync | Service account JSON not in browser; keep SA keys server-side only (already for manifest script). |
| F4 | P2 | Error messages | Login shows generic “Invalid email or password” | Keep generic in prod; avoid user enumeration if tightening further. |

---

## Infrastructure & deploy

| # | Priority | Item | Current state | Recommended action |
|---|----------|------|---------------|-------------------|
| I1 | P0 | `task dev:docker` | Dev-oriented: reload, bind mounts, seed on start | Use separate **production** Dockerfile/compose or K8s manifests without dev reload/seed. |
| I2 | P0 | Postgres port mapping | Compose publishes `5432:5432`; host `.env` may use custom ports | Prod DB not on public host port; app connects via private network. |
| I3 | P1 | Migrations | `alembic upgrade head` in entrypoint (dev) | Run migrations as controlled deploy step; backup before upgrade. |
| I4 | P1 | Redis | Used if token revoke / caching added later | Secure Redis; password in prod. |
| I5 | P2 | Logging & monitoring | Request ID middleware exists | Add structured logs, error tracking (Sentry etc.), uptime on `/health`. |
| I6 | P2 | Backups | Not documented in app | Automated Postgres backups + restore drill. |

---

## Operational / product

| # | Priority | Item | Current state | Recommended action |
|---|----------|------|---------------|-------------------|
| O1 | P1 | Admin provisioning | No public signup; admin via bootstrap + UI | Document runbook: create staff (Add Employees), clients, rotate passwords. |
| O2 | P1 | Credits & billing | Manual top-up / debit in app; no payment gateway | Confirm finance process matches manual credits (v1 scope). |
| O3 | P2 | Google Drive | URLs only; no Drive API proxy in v1 | Folder sharing / SA permissions documented for ops. |
| O4 | P2 | E2E tests | Manual [`test-ui.md`](./test-ui.md) fix mode | Add Playwright/smoke in CI against staging before prod promote. |

---

## Pre-launch verification (suggested)

```bash
# 1. No demo seed in prod env
#    SEED_DEMO_USERS=false

# 2. Protected route rejects anonymous
curl -s -o /dev/null -w "%{http_code}" https://<api>/api/v1/admin/clients
#    Expect 401

# 3. Wrong role gets 403 (client token on admin route)

# 4. Login + workspace with valid admin token

# 5. OpenAPI/docs disabled or auth-gated (if policy requires)

# 6. CORS from prod UI origin only (browser network tab)
```

---

## Document history

| Date | Notes |
|------|--------|
| 2026-05-23 | Initial list from B11 cutover, auth review, and local Docker/dev setup discussions |

Update this file when closing an item or discovering new production gaps.
