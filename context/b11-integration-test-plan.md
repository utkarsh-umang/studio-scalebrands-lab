# B11 — Integration test plan (real API)

Use this after B0–B11 implementation. Complements [`test-ui.md`](./test-ui.md) (screen-level flows); this doc covers **environment, credentials, and API-era setup**.

---

## 1. Prerequisites checklist

| Step | Command / check |
|------|-----------------|
| Postgres (and Redis if required) running | `task dev:infra` (Docker) |
| Root `.env` exists | `cp .env.example .env` and edit |
| Poetry deps installed | `task backend:install` (includes `email-validator`) |
| Postgres reachable on `POSTGRES_PORT` | Your `.env` host/port (e.g. external or custom infra) |
| Migrations + seed | `task backend:setup` or `task backend:migrate` then `task backend:seed` |
| API up | `task backend:up` (or uvicorn after migrate) |
| Frontend API URL | `frontend/.env` → `VITE_API_BASE_URL=http://127.0.0.1:8000` |
| CORS | Root `.env` `CORS_ORIGINS` includes `http://localhost:5173` |
| UI dev server | `cd frontend && npm run dev` |

**Smoke (API):**

```bash
curl -s http://127.0.0.1:8000/health
curl -s -X POST http://127.0.0.1:8000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"client@scalebrandslab.demo","password":"demo1234"}'
```

Expect `accessToken` + `user` in the login JSON.

---

## 2. Credentials — yes, they are real now

Passwords are stored **hashed in Postgres**. The frontend no longer ships demo passwords in code.

### 2.1 First admin (bootstrap) — `.env` at repo root

Set before **first** `task backend:seed` when the database has **no** admin user:

| Variable | Purpose |
|----------|---------|
| `BOOTSTRAP_ADMIN_EMAIL` | Email for the first admin account |
| `BOOTSTRAP_ADMIN_PASSWORD` | Plaintext **only in `.env`** — hashed at seed time |
| `BOOTSTRAP_ADMIN_DISPLAY_NAME` | Optional display name |

From [`.env.example`](../.env.example):

```env
BOOTSTRAP_ADMIN_EMAIL=admin@scalebrandslab.demo
BOOTSTRAP_ADMIN_PASSWORD=change-me-local-only
BOOTSTRAP_ADMIN_DISPLAY_NAME=Studio Admin
```

- Bootstrap runs **only if no admin exists**; it does not reset an existing admin password.
- **Never commit `.env`** (only `.env.example`).

### 2.2 Local demo quartet — `SEED_DEMO_USERS=true`

When `SEED_DEMO_USERS=true`, seed also upserts four accounts (password **`demo1234`**):

| Role | Email |
|------|--------|
| Client | `client@scalebrandslab.demo` |
| Editor | `editor@scalebrandslab.demo` |
| SMM | `smm@scalebrandslab.demo` |
| Admin | `admin@scalebrandslab.demo` |

**Important:** If `BOOTSTRAP_ADMIN_EMAIL` is the **same** as `admin@scalebrandslab.demo`, demo seed runs **after** bootstrap and **overwrites** that user’s password to `demo1234`. For local QA, log in as admin with **`demo1234`**, not `BOOTSTRAP_ADMIN_PASSWORD`.

**Production-style local:** Use a unique bootstrap email (e.g. `you@yourcompany.com`) + strong `BOOTSTRAP_ADMIN_PASSWORD`, and set `SEED_DEMO_USERS=false`.

### 2.3 Creating additional “real” accounts (post-seed)

| Who | How | Password |
|-----|-----|----------|
| New **client** | Admin UI → Provision new client | You choose at provision time; shown once in credentials modal |
| New **editor / SMM** | Admin UI or `POST /api/v1/admin/staff` (admin JWT) | Set at creation; returned in API response |
| New **admin** | **Not supported via API** | Only bootstrap env on empty DB |

There is **no public signup**. All accounts are admin-provisioned or seed.

---

## 3. Seeded data vs old mock IDs

After B11, batch/video IDs are **UUIDs** from the API, not `b-pipeline` / `v-p-1`.

Current seed (`seed.py`) creates minimally:

- Client profile **TechWithTim** (linked to `client@scalebrandslab.demo`)
- One active batch **July Deep Dive** at `intake_pending`

[`test-ui.md`](./test-ui.md) FLOW-2 matrix (`b-pipeline`, etc.) applies to the **old frontend mock catalog**, not the API seed. For API testing:

- **FLOW-1 (read-only):** Use seeded client + “July Deep Dive”; create extra batches via Admin for more stages.
- **FLOW-3–7 (mutating):** Prefer **Admin → create new batch** per flow; record UUIDs in the issue log.

---

## 4. Test phases

### Phase 0 — Auth & wiring (15 min)

| # | Test | Pass criteria |
|---|------|----------------|
| 0.1 | Login as each demo role | Redirects to correct portal; no console errors |
| 0.2 | Wrong password | Login error message; no token |
| 0.3 | Refresh with token in `localStorage` | Stays logged in (`GET /auth/me`) |
| 0.4 | Logout | Token cleared; redirected to login |
| 0.5 | Client board loads | Credits + batches from API (not empty spinner forever) |
| 0.6 | Admin workspace | Client table + pipeline counts load |

### Phase 1 — Read-only tour (FLOW-1)

Follow [`test-ui.md` § FLOW-1](./test-ui.md#flow-1--full-snapshot-tour) per role. **Do not** approve/reject/submit.

Adapt expectations:

- Seeded batch title **July Deep Dive** instead of `b-new`.
- Kanban may be empty until intake/split epics advance the batch.

### Phase 2 — Admin provisioning (20 min)

| # | Test | Pass criteria |
|---|------|----------------|
| 2.1 | Provision new client | Client appears in list; credentials modal; can log in as client |
| 2.2 | Top-up credits | Balance increases after refresh |
| 2.3 | Create batch folder | Batch appears on client detail; `creditCost` reserved |
| 2.4 | Assign team (SMM + editor) | Saved; visible on client detail |
| 2.5 | Set video deadline (admin) | Appears on deadlines page |

### Phase 3 — Path B happy path (FLOW-3, one new batch)

Use a **fresh** batch created in Phase 2.

| Step | Actor | Action |
|------|--------|--------|
| 1 | Client | Submit intake (podcast URL or clips-ready) |
| 2 | SMM | Submit clips folder (if podcast path) |
| 3 | Client | Approve clips |
| 4 | Editor | Submit deliverables drive → N tickets |
| 5 | Editor | Fill video + thumbnail + title → Send to SMM QA |
| 6 | SMM | Internal QA approve |
| 7 | Client | Unified QA approve |
| 8 | SMM | Schedule each video → batch completes |
| 9 | Admin / Client | Credits debited once; “Our work” shows scheduled items |

Record **batch UUID** and **video UUIDs** in your notes for regressions.

### Phase 4 — Branch flows (pick as needed)

| Flow | Doc | Notes |
|------|-----|--------|
| Clips-ready skip clip review | FLOW-4 | Intake = clips-ready |
| QA send-back / editor fix | FLOW-5 | New batch |
| Client reject → SMM triage | FLOW-5 | Never routes directly to editor |
| Credits debit once | FLOW-6 | Complete all videos in batch |
| Regression skim | FLOW-7 | After issue log clear |

### Phase 5 — Automated gate

```bash
cd frontend && npm run build
# From repo root — allowlist: driveManifests, pathBDemoScenarios, types/pathB re-exports
rg '@mockData|MOCK_' frontend/src --glob '!**/*.test.*' --glob '!**/types/**'
task backend:test
```

---

## 5. Issue log template

| # | Flow | Role | Steps | Expected | Actual | Fixed? |
|---|------|------|-------|----------|--------|--------|
| 1 | 0.1 | Admin | Login demo admin | Board loads | | |

---

## 6. Recommended `.env` profiles

### A — Local QA (default)

```env
SEED_DEMO_USERS=true
BOOTSTRAP_ADMIN_EMAIL=admin@scalebrandslab.demo
BOOTSTRAP_ADMIN_PASSWORD=anything-for-first-run
```

Login: demo table above (`demo1234` for all four).

### B — “Real” admin only (no demo clutter)

```env
SEED_DEMO_USERS=false
BOOTSTRAP_ADMIN_EMAIL=admin@yourcompany.com
BOOTSTRAP_ADMIN_PASSWORD=<strong-secret>
```

Then provision clients/staff via Admin UI.

### C — Fresh database

```bash
# Drop/recreate DB or new database name, then:
task backend:migrate
task backend:seed
```

---

## 7. Links

| Doc | Use |
|-----|-----|
| [`test-ui.md`](./test-ui.md) | Screen-by-screen FLOW-1–7 |
| [`backend-plans/README.md`](./backend-plans/README.md) | Epic index + demo table |
| [`path-b-ui-spec.md`](./path-b-ui-spec.md) | UI contract |
