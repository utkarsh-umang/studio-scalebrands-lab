# Path B — Backend Epic List

**Purpose:** Index for feature-by-feature backend work. Each epic gets its own plan via the `prototype-to-backend-planner` skill, then storage is consolidated into `00-storage-design.md` before implementation.

**Scope:** Path B only (raw footage / clips-ready). Path A, in-app uploads, payments, and Drive API proxy are out of scope for v1.

**Related docs:**

| Doc | Role |
|-----|------|
| [`../problem-context.md`](../problem-context.md) | Domain, roles, RBAC, full pipeline vision |
| [`../path-b-ui-spec.md`](../path-b-ui-spec.md) | Screen-level UI contract |
| [`../path-b-build-plan.md`](../path-b-build-plan.md) | Frontend build epics (Done) |
| [`../test-ui.md`](../test-ui.md) | Fix-mode flows after API cutover |
| [`../../skills/prototype-to-backend-planner/SKILL.md`](../../skills/prototype-to-backend-planner/SKILL.md) | How to write each epic plan |
| [`../../skills/database-design-consolidator/SKILL.md`](../../skills/database-design-consolidator/SKILL.md) | Merge epic plans → `00-storage-design.md` |
| [`../../.cursor/skills/backend-coding-structure/SKILL.md`](../../.cursor/skills/backend-coding-structure/SKILL.md) | Controller → service → Postgres/Mongo layout |
| [`../../.cursor/skills/backend-coding-discipline/SKILL.md`](../../.cursor/skills/backend-coding-discipline/SKILL.md) | Execution: React Query + codegen, Redux UI state, mock removal |

**Prototype sources of truth:**

- Types & seeds: `frontend/mockData/`
- Mutations: `frontend/src/pages/admin/adminWorkspaceStore.tsx`
- State rules: `frontend/src/lib/pathBStateMachine.ts`

---

## Workflow

```
1. Write epic plan (this list → B*.md)     [planning — prototype-to-backend-planner]
2. Consolidate DB → 00-storage-design.md   [planning — database-design-consolidator]
3. Reconcile each B*.md storage section  [planning — 00-reconcile-checklist.md]
4. Implement B0 → B11 in order             [execution — backend-coding-discipline skill]
5. Run test-ui.md against real API         [fix mode]
```

---

## Epic tracker

| Epic | Plan file | Status | Depends on |
|------|-----------|--------|------------|
| B0 | [`B0-auth-and-core-schema.md`](./B0-auth-and-core-schema.md) | Done | — |
| B1 | [`B1-admin-clients-batches.md`](./B1-admin-clients-batches.md) | Storage reconciled | B0 |
| B2 | [`B2-read-models-boards.md`](./B2-read-models-boards.md) | Storage reconciled | B0, B1 |
| B3 | [`B3-client-intake.md`](./B3-client-intake.md) | Done | B2 |
| B4 | [`B4-smm-clips-client-clip-review.md`](./B4-smm-clips-client-clip-review.md) | Done | B3 |
| B5 | [`B5-editor-deliverables-split.md`](./B5-editor-deliverables-split.md) | Done | B4 |
| B6 | [`B6-production-readiness-smm-qa-queue.md`](./B6-production-readiness-smm-qa-queue.md) | Done | B5 |
| B7 | [`B7-smm-internal-qa.md`](./B7-smm-internal-qa.md) | Storage reconciled | B6 |
| B8 | [`B8-client-qa-revision-via-smm.md`](./B8-client-qa-revision-via-smm.md) | Storage reconciled | B7 |
| B9 | [`B9-scheduling-credits.md`](./B9-scheduling-credits.md) | Storage reconciled | B8 |
| B10 | [`B10-deadlines-pipeline.md`](./B10-deadlines-pipeline.md) | Storage reconciled | B2 |
| B11 | [`B11-mock-removal-integration.md`](./B11-mock-removal-integration.md) | Storage reconciled | B0–B10 |
| — | [`00-storage-design.md`](./00-storage-design.md) | **Approved** | Reconciled with all B0–B11 plans |
| — | [`00-reconcile-checklist.md`](./00-reconcile-checklist.md) | **Done** | All epic storage sections patched |

Update **Status** to `Planned` → `Storage reconciled` → `In progress` → `Done` as you go.

---

## Strict implementation order

```
B0 → B1 → B2 → B3 → B4 → B5 → B6 → B7 → B8 → B9 → B10 → B11
```

B10 can be implemented any time after B2 (deadlines/pipeline reads), but keeping it after B9 avoids rework on aggregate queries. Do **not** start B3–B9 out of pipeline order.

**Planning order (recommended):** B0 + B1 + B2 first, then B3–B9, then B10–B11, then run **`database-design-consolidator`** → `00-storage-design.md` + `00-reconcile-checklist.md`.

---

## EPIC B0 — Auth & core schema

**Outcome:** Real authentication, RBAC, and baseline Postgres models shared by all epics.

| Area | Build |
|------|--------|
| Auth | Implement `get_current_user`, JWT/session, `require_roles` in `app/core/auth.py` |
| Bootstrap admin | Seed first admin from `BOOTSTRAP_ADMIN_*` in `.env` (no signup API) |
| Users | Role enum; optional `SEED_DEMO_USERS` for local quartet |
| Core entities | `client_profiles`, `batches`, `video_tickets` (minimal columns — extended in later epics) |
| API | `GET /api/v1/me` |
| Tests | Auth + role guard smoke tests |

**Replaces (frontend):** `MockAuthProvider` / `useMockAuth` (cutover can finish in B11; wire contract here).

**Store actions:** None (schema + auth only).

**Plan doc sections:** Full domain sketch, all enums, prototype-only fields to drop (`demoStage` vs server `stage`).

**Done when:** Login issues token; `me` returns role + ids; migrations apply; pytest for auth passes.

---

## EPIC B1 — Admin: clients, credits, create batch

**Outcome:** Admin can provision clients, manage credits/team/guidelines, and create batch folders.

| Commands | Store / mock |
|----------|----------------|
| Provision editor / SMM | `POST /admin/staff` *(new — no prototype store action)* |
| Provision / decommission client | `provisionClient`, `decommissionClient` |
| Top-up credits | `topUpCredits` |
| Update team, brand guidelines | `updateClientTeam`, `updateBrandGuidelines` |
| Create batch (`creditCost`, title, client) | `createBatchFolder` |

**Reads:** Client list, client detail (no batch videos required yet).

**Roles:** Admin only (mutations); admin reads.

**Done when:** Admin UI persists new clients and batches; credits balance updates on top-up.

---

## EPIC B2 — Read models (all role boards)

**Outcome:** Client, Editor, SMM, and Admin boards **load** batches and video tickets from the API.

| Reads | Replaces |
|-------|----------|
| Batches per client | `MOCK_ADMIN_BATCH_FOLDERS`, client folder views |
| Videos per batch | `MOCK_ADMIN_VIDEO_TICKETS` |
| Client profile + credits | `MOCK_ADMIN_CLIENT_PROFILES` |
| Attention / pipeline counts | Attention strips, `AdminPipelineOverview` |

**Roles:** Filtered by role (client sees own; editor/smm see assigned; admin sees all).

**Done when:** All four `/board` routes hydrate from React Query; mutations may still use local store.

---

## EPIC B3 — Client intake

**Outcome:** Client starts Path B by submitting podcast or clips-ready footage URL.

| Command | Store |
|---------|--------|
| Submit batch intake | `submitBatchIntake` |

**State:** `batchClipReviewPhaseAfterIntake`, `batchDemoStageAfterIntake` (server-owned equivalents).

**Roles:** Client.

**Done when:** Intake modal updates batch stage on server; other roles see batch on next load.

---

## EPIC B4 — SMM clips folder & client clip review

**Outcome:** SMM submits numbered clips Drive folder; client approves or rejects; clips-ready path skips client clip review.

| Commands | Store |
|----------|--------|
| Submit clips folder URL | `submitSmmClipsFolder` |
| Approve clips | `approveBatchClips` |
| Reject clips (note) | `rejectBatchClips` |

**UI:** `NumberedClipsModal`, SMM find-clips card, client clip review.

**Roles:** SMM (submit), Client (approve/reject).

**Done when:** Full clip-review loop without mock store writes.

---

## EPIC B5 — Editor deliverables split

**Outcome:** Editor links deliverables Drive; batch splits from one gate card into `n` video tickets (`1…n`).

| Command | Store |
|---------|--------|
| Submit deliverables drive | `submitEditorVideosDrive` |

**State:** `createSplitDeliverableTicket`, `batchDemoStageAfterDeliverablesSplit`, `videoCount`.

**Roles:** Editor.

**Done when:** Kanban shows N cards after submit; tickets exist in DB with clip index.

---

## EPIC B6 — Production package & SMM QA queue

**Outcome:** Per-video video/thumbnail/title fields; readiness rules; editor sends package to SMM QA.

| Commands | Store |
|----------|--------|
| Save production fields (URLs, title, sync meta) | Production UI + store patches |
| Send to SMM QA | `sendEditorDeliverableToSmmQa` |

**Rules (server):** All three deliverables present before eligible for SMM QA (per `path-b-ui-spec.md`).

**Drive:** Persist URLs + version/sync fields only; manifest sync stays client-side in v1.

**Roles:** Editor.

**Done when:** Post-split production UI persists; gated “send to SMM QA” works.

---

## EPIC B7 — SMM internal QA

**Outcome:** SMM approves video or sends back to editor; QA comments and sold comments on version bump.

| Commands | Store |
|----------|--------|
| SMM QA approve / send back | `submitSmmQaReview` |
| Append SMM QA comment | `appendSmmQaComment` |

**UI:** `QaCommentWorkspace`, editor QA fix flow entry.

**Roles:** SMM (mutate); Editor (read flags).

**Done when:** SMM QA loop updates `owner` / stage; send-back routes to `editor_fix`.

---

## EPIC B8 — Client unified QA & revision via SMM

**Outcome:** Client approves or rejects video+thumbnail+title package; revisions never skip SMM.

| Commands | Store |
|----------|--------|
| Client approve / reject QA | `applyClientVideoDecision` |
| Client QA comment | `appendClientQaComment` |
| SMM triage revision | `smmTriageClientRevision` |

**Invariant:** Client reject → `owner: smm` / revision stage, never direct to editor.

**Roles:** Client, SMM.

**Done when:** Client QA + `SmmClientRevisionPanel` drive real state.

---

## EPIC B9 — Scheduling & credits

**Outcome:** SMM schedules each video; batch completes; credits debited once.

| Command | Store |
|---------|--------|
| Schedule video (platform, date, time) | `scheduleVideo` |
| Batch completion + debit | `creditsDebited`, deduct `creditCost` when all videos done |

**Reads:** `/client/all`, completed views for editor/smm.

**Roles:** SMM (schedule); Client (read scheduled work).

**Done when:** Terminus state persisted; credits transaction exactly once per batch.

---

## EPIC B10 — Deadlines & pipeline polish

**Outcome:** Admin sets deadlines on editor/SMM tickets; pipeline overview aggregates by stage/owner.

| Command | Store |
|---------|--------|
| Set video deadline | `setVideoDeadline` |

**Reads:** Pipeline counts, optional `setVideoOwner` if kept in product.

**Roles:** Admin.

**Done when:** Admin deadlines page and pipeline cards are API-backed.

**Note:** Can be planned early; implement after B2 (needs ticket rows) and ideally after B9 (stable stage enums).

---

## EPIC B11 — Mock removal & integration

**Outcome:** No runtime dependency on `adminWorkspaceStore` mutations or `MOCK_*` for Path B.

| Work | |
|------|--|
| Remove / gut local store writes | All actions → API |
| Remove mock imports from pages | Keep shared types until stable |
| Regenerate OpenAPI client | `task frontend:generate-client` |
| Fix mode | Run [`../test-ui.md`](../test-ui.md) flows |

**Done when:** `rg "@mockData|MOCK_" frontend/src` clean except seeds/tests; full Path B flows pass on real API.

---

## Per-epic plan checklist

When writing each `B*.md` with `prototype-to-backend-planner`, include:

- [ ] Scope (screens, routes, roles)
- [ ] Mock inventory table
- [ ] Domain entities & state transitions (this epic only)
- [ ] Draft storage (tables/collections) — reconciled later against `00-storage-design.md`
- [ ] API catalog (reads + commands)
- [ ] Frontend cutover map (mock → hook → files)
- [ ] Open questions
- [ ] Prototype-only exclusions

---

## Demo reference (implementation)

### First admin (production-style)

Set in `.env` before `alembic upgrade` + seed:

| Variable | Example |
|----------|---------|
| `BOOTSTRAP_ADMIN_EMAIL` | `admin@yourcompany.com` |
| `BOOTSTRAP_ADMIN_PASSWORD` | *(strong secret — not committed)* |
| `SEED_DEMO_USERS` | `false` in prod; `true` locally for table below |

### Demo logins (`SEED_DEMO_USERS=true` only)

| Role | Email | Password |
|------|-------|------------|
| Client | `client@scalebrandslab.demo` | `demo1234` |
| Editor | `editor@scalebrandslab.demo` | `demo1234` |
| SMM | `smm@scalebrandslab.demo` | `demo1234` |
| Admin | `admin@scalebrandslab.demo` | `demo1234` |

Create additional editors/SMMs with **`POST /api/v1/admin/staff`** (admin JWT) — see [B1 plan](./B1-admin-clients-batches.md).

Primary seed client: **c-1** (TechWithTim). See `frontend/mockData/pathBDemoScenarios.ts`.

---

## Links (quick)

| Artifact | Path |
|----------|------|
| Canonical storage (after consolidation) | `00-storage-design.md` |
| Frontend UI spec | `../path-b-ui-spec.md` |
| Fix-mode tests | `../test-ui.md` |
