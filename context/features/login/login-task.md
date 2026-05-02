# Login — Task Context

**Related:** [Problem context](../../problem-context.md)  
**Scope:** Authentication entry point for Scale Brands Lab Studio — single login surface, verified credentials, and role-based routing after sign-in. **Target client:** web browser (responsive layout is fine; not a native mobile app).

---

## User identity (product rules)

- **No username:** There is no separate login name. The only sign-in identifier is **email**, plus **password**. **`name`** is a display/profile field, not used for authentication.
- **Client accounts** are created and managed by Admin (per problem context).
- **Employee accounts (Editor and SMM)** are created **by Admin only** — no self-sign-up for staff.

---

## Objective

Implement the platform login flow so users authenticate once and land in the correct experience for their role: **Client**, **Employee (Editor or Social Media Manager)**, or **Admin**. All account types that can log in are **provisioned by Admin**; login must not rely on the user self-declaring a role.

---

## Product Requirements (from problem context)

| Requirement | Detail |
|-------------|--------|
| Single login page | One URL / one screen for all roles — no separate “client portal” vs “staff portal” URLs unless SEO/product explicitly demands it later. |
| Login types | **Client** · **Employee** with sub-type **Editor** or **SMM** · **Admin**. |
| Post-auth behavior | **Role-based routing** — after successful login, user is sent to the dashboard shell appropriate to their role and permissions. |
| Credential source | **All** logins (Client, Employee, Admin) are **admin-provisioned**; implementation must resolve role from the server-side user record (not self-declared at login). |

---

## Functional Requirements

### 1. Login form

- Collect **email** and **password** only (no username field).
- Optional UX: “remember this device” only if session strategy supports it; otherwise omit or defer.
- Submit attempts to authenticate against the backend; show clear errors for invalid credentials without leaking whether the email exists (generic message acceptable).

### 2. Role resolution (server-side)

- **Role must come from the authenticated identity**, not from a client-controlled selector on the login page (avoid “I am an admin” dropdown tricks).
- Employee subtype (**Editor** vs **SMM**) must be stored on the user record or derived from assignment — login response should expose whatever the frontend needs for routing (`role`, `employee_kind` or equivalent).

### 3. Session / token

- Issue a **secure session or token** (e.g. HTTP-only cookie session or short-lived **JWT** + refresh policy) per team standards.
- Frontend API client (`OpenAPI` / generated client) should attach credentials consistently (e.g. `Authorization: Bearer` — already scaffolded in `frontend/src/client/core/request.ts`).

### 4. Post-login routing

- **Client** → client dashboard (or placeholder route until built).
- **Editor** → editor task queue (or placeholder).
- **SMM** → SMM home (or placeholder).
- **Admin** → admin dashboard (or placeholder).
- Unauthenticated users hitting protected routes → redirect to login with safe `returnUrl` handling (open redirect avoided).

### 5. Logout

- Invalidate session / revoke refresh token on server where applicable; clear client-side token; redirect to login.

### 6. Protected routes

- App shell routes under authentication guard; public routes: login, password recovery (if in scope), static legal pages if any.

---

## Non-functional Requirements

- **HTTPS** in production; never send credentials over plain HTTP.
- **Rate limiting** on login endpoint (backend) to reduce brute force.
- **Password storage:** hashed (e.g. bcrypt/argon2); no plaintext passwords in logs.
- **CSRF** if using cookie-based sessions for mutating routes.

---

## Alignment with Current Codebase

| Area | Notes |
|------|--------|
| Backend | `backend-app/app/core/auth.py` — `get_current_user` is currently `NotImplementedError`; login task should implement real auth and wire FastAPI dependencies. |
| Frontend | Generated OpenAPI client supports `TOKEN` / Basic auth in headers — align token storage and injection with chosen auth scheme. |
| Prototype | `context/studio-prototype.jsx` shows a **role-picker** demo — product intent per problem context is **single login + server-derived role**; use prototype for UX inspiration only, not as the security model. |

---

## Out of Scope (this task unless explicitly pulled in)

- OAuth / SSO (Google, etc.).
- Self-service registration (all account types are admin-provisioned).
- Native **iOS / Android** apps; this product is a **webapp** in the browser.
- Password reset / email verification flows — **document as follow-up** if not implemented in the same milestone.
- MFA.

---

## Acceptance Criteria (done when)

1. User can log in with valid credentials and is routed to the correct dashboard by **actual** role from the backend.
2. User cannot access another role’s routes by tampering with client-only state (validated via API/`get_current_user`).
3. Invalid credentials show a safe error; successful logout clears access and blocks protected API calls.
4. Auth integration points (`get_current_user`, frontend token) are implemented consistently enough for the next feature (e.g. first dashboard page) to call APIs as that user.

---

## Deliverables

- Backend: login (and refresh/logout if using JWT) endpoints + user model with **email** (unique), **name**, **hashed password**, **role**, and employee subtype where applicable + `get_current_user` implementation.
- Frontend: login page UI matching app theme, auth context/store, route guards, integration with API client for bearer token.
- Short developer note in README or internal doc: how to create test users per role in dev (e.g. seed script that mirrors **admin-only** creation, or a bootstrap admin).

---

## Open Questions (resolve before or during implementation)

1. **Token vs cookie session:** team preference and deployment constraints (CORS, same-site cookies for a **web** origin only).
