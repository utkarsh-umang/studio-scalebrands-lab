# Backend plan: B10 — Deadlines & pipeline polish

**Epic:** B10  
**Status:** Storage reconciled  
**Depends on:** [B0](./B0-auth-and-core-schema.md), [B2](./B2-read-models-boards.md) (ticket/batch reads); **implement after** [B3](./B3-client-intake.md)–[B9](./B9-scheduling-credits.md) for stable `pipeline_stage` / owner rollup  
**Blocks:** [B11](./B11-mock-removal-integration.md) (admin pages off store)  
**Index:** [`README.md`](./README.md)

---

## Summary

Give admins **API-backed pipeline visibility** and **deadline editing** on internal tickets. Port [`adminPipeline.ts`](../../frontend/src/lib/adminPipeline.ts) to the server for `GET /admin/pipeline` (batch counts by dominant owner + active batch list). Persist **due dates** on `video_tickets.deadline_at` via `PATCH` (replacing `setVideoDeadline`). The deadlines table and client-detail kanban keep the same UX: only tickets with `deadline_role` ∈ `{ smm, editor }` in **active** batches. **`setVideoOwner` is not used in the UI** — exclude from B10 unless product adds manual owner override.

---

## Scope

### Screens & routes

| Route | Role | B10 |
|-------|------|-----|
| `/admin` | Admin | `AdminPipelineOverview` — summary cards + batch list |
| `/admin/deadlines` | Admin | `AdminDeadlines` — table of SMM/Editor tasks + datetime inputs |
| `/admin/clients/:id` | Admin | `AdminVideoKanban` — per-column deadline inputs on eligible tickets |

**Out of B10:** Workflow commands (B3–B9), client/SMM/editor boards, credit top-up (B1), changing `pipeline_owner` / `pipeline_stage` from admin (no UI).

### Roles & permissions

| Action | client | editor | smm | admin |
|--------|--------|--------|-----|-------|
| View pipeline overview | — | — | — | ✓ |
| View deadline task list | — | — | — | ✓ |
| Set / clear video deadline | — | — | — | ✓ |

All routes: `require_roles(admin)`.

### User-visible operations

| Action | UI | API |
|--------|-----|-----|
| See “With client / SMM / Editor” counts | `AdminWorkspace` stat cards | `GET /admin/pipeline` → `summary` |
| See active batch rows + stage | Pipeline list | `GET /admin/pipeline` → `items` |
| Set due date on task | `/admin/deadlines` or client kanban | `PATCH /admin/videos/{id}/deadline` |
| Clear due date | “Clear deadline” button | Same body `deadlineAt: null` |
| Count tasks without deadline | Banner on deadlines page | Client-side from tasks list **or** `GET /admin/deadlines` |

---

## Mock inventory

| Symbol | File | Consumers | B10 |
|--------|------|-----------|-----|
| `setVideoDeadline` | `adminWorkspaceStore.tsx` | `AdminDeadlines`, `AdminClientDetail` → kanban | `PATCH .../deadline` |
| `setVideoOwner` | `adminWorkspaceStore.tsx` | *(none)* | **Out of scope** |
| `computeAdminPipelineSummary` | `adminPipeline.ts` | `AdminWorkspace` | `GET /admin/pipeline` |
| `listAdminPipelineItems` | `adminPipeline.ts` | `AdminPipelineOverview` | `GET /admin/pipeline` |
| `listAdminDeadlineTasks` | `adminPipeline.ts` | `AdminDeadlines` | Derive client-side **or** `GET /admin/deadlines` |
| `pipelineOwnerForBatch` | `adminPipeline.ts` | Pipeline rollup | Server `admin_pipeline_service` |
| `stageLabelForBatch` | `adminPipeline.ts` | Pipeline row subtitle | Server (use `pipeline_stage` + tickets) |
| `AdminPipelineSummary` | `adminDashboard.ts` | Types | Response schema |
| `AdminPipelineItem` | `adminDashboard.ts` | Types | Response schema |
| `AdminDeadlineTask` | `adminDashboard.ts` | Deadlines table | Response schema |
| `deadlineAt` / `deadlineRole` | `adminWorkspace.ts` | Seeds, kanban | `deadline_at`, `deadline_role` columns (B0) |
| `ADMIN_KANBAN_COLUMNS` | `adminWorkspace.ts` | `AdminVideoKanban` | Unchanged; 5 owner columns |

### Relationship to B1

B1 already lists `GET /admin/pipeline` as a stub target. **B10 owns the full implementation** and ports logic from `adminPipeline.ts` using real `pipeline_stage` / `pipeline_owner` (not `demoStage` in API responses).

---

## Domain model

### What admins edit

**Only `deadline_at`** on existing tickets. The store does **not** change `deadline_role` or `pipeline_owner` when setting a deadline:

```316:321:frontend/src/pages/admin/adminWorkspaceStore.tsx
  const setVideoDeadline = useCallback(
    (videoId: string, deadlineAt: string | null) => {
      setVideos((prev) =>
        prev.map((v) => (v.id === videoId ? { ...v, deadlineAt } : v)),
      )
```

`deadline_role` is set by Path B workflow transitions ([`pathBStateMachine.deadlineRoleForOwner`](../../frontend/src/lib/pathBStateMachine.ts), epic services B3–B9). Admin cannot assign deadlines to `client`, `scheduling`, or `done` tickets via UI (no `deadline_role`).

### Eligibility — PATCH deadline

| Check | Rule |
|-------|------|
| Role | Admin |
| Ticket exists | — |
| `deadline_role` | `smm` or `editor` |
| Batch | `status = active` |
| Body | `deadlineAt` ISO string or `null` (clear) |

Matches [`listAdminDeadlineTasks`](../../frontend/src/lib/adminPipeline.ts) filter (active batch + deadline role).

### Pipeline rollup — per active batch

**Input:** All `video_tickets` for batch + `batches` row (intake, clip phase, deliverables URL).

**Dominant owner** (`pipelineOwnerForBatch`): One of `client` | `smm` | `editor` (not `scheduling` / `done`).

Priority rules (port exactly):

1. `batchNeedsClientIntake` → `client`
2. `batchNeedsSmmFindClips` → `smm`
3. Count open tickets where `owner ∈ { client, smm, editor }`; pick max count; tie-break order **client → smm → editor**
4. If no open tickets: infer from batch state (no deliverables drive → clip phase / editor; else `smm`)

**Stage label** (`stageLabelForBatch`):

- Prefer server `stage_label` / `pipeline_stage` display helper (replace `batch.demoStage.replace(/_/g, ' ')` in prod)
- Else single open ticket’s `stage_label`
- Multiple open owners → `"Mixed stages"`
- Fallbacks: intake / clip identification / `"In progress"`

**Summary counts:** For each active batch, increment `withClient` | `withSmm` | `withEditor` from dominant owner.

**Excluded from rollup:** `status !== active` batches (completed/archive).

### `setVideoOwner` (excluded)

Store mutates `owner` + `deadlineRole` together but **no component calls it**. Do not expose in B10. Manual owner override would bypass Path B invariants — defer unless product requests.

---

## Storage design

> **Superseded.** Canonical schema: [00-storage-design.md](./00-storage-design.md).

## Storage (final)

Canonical design: [00-storage-design.md](./00-storage-design.md) § [3.4](./00-storage-design.md#34-video_tickets) (`deadline_at`, `deadline_role`); § [10](./00-storage-design.md#10-query-patterns-board-loads--b2) (admin pipeline rollup).

**Epic-specific deltas (B10 only):**

| Area | Detail |
|------|--------|
| DDL | **No new tables** |
| PATCH | Admin sets `deadline_at` only — no workflow side effects |
| `setVideoOwner` | **Out of v1** — not in schema or API (conflict #9) |
| Reads | `GET /admin/pipeline`, `GET /admin/deadlines` — port `adminPipeline.ts` against canonical `pipeline_owner` / `stage_label` |

---

## API catalog

Base: `/api/v1`. Admin JWT.

### Reads — pipeline

| Method | Path | Response | Replaces |
|--------|------|----------|----------|
| GET | `/admin/pipeline` | `AdminPipelineResponse` | `computeAdminPipelineSummary` + `listAdminPipelineItems` |

**`AdminPipelineResponse`:**

```json
{
  "summary": {
    "withClient": 2,
    "withSmm": 4,
    "withEditor": 1
  },
  "items": [
    {
      "id": "batch-uuid",
      "clientId": "c-1",
      "batchTitle": "Spring set",
      "clientLabel": "TechWithTim",
      "owner": "smm",
      "stageLabel": "Mixed stages",
      "updatedAt": "2026-05-14"
    }
  ]
}
```

**Implementation:** `admin_pipeline_service.build_pipeline(db)` — query active batches + all tickets for those batches in one or two queries; port TS functions; JOIN `client_profiles.display_name` for `clientLabel`.

**Sorting:** `items` by `updated_at` desc (batch), matching prototype.

### Reads — deadlines (optional dedicated endpoint)

| Method | Path | Response | Replaces |
|--------|------|----------|----------|
| GET | `/admin/deadlines` | `{ tasks: AdminDeadlineTask[] }` | `listAdminDeadlineTasks` |

**`AdminDeadlineTask`:** mirrors [`adminDashboard.ts`](../../frontend/mockData/adminDashboard.ts) — `assigneeName` from assigned SMM/Editor on client profile.

**v1 choice:** Implement **GET /admin/deadlines** so server owns filter/sort parity with TS; `AdminDeadlines` can use this **or** derive from `GET /admin/workspace` (B2) to avoid extra fetch. Recommended: **deadlines endpoint** for a focused page; pipeline page uses **pipeline endpoint** only.

### Commands — deadline

| Method | Path | Body | Response | Replaces |
|--------|------|------|----------|----------|
| PATCH | `/admin/videos/{video_ticket_id}/deadline` | `{ "deadlineAt": "2026-05-20T18:00:00.000Z" }` or `{ "deadlineAt": null }` | `{ ticket }` | `setVideoDeadline` |

Alternative path: `PATCH /videos/{id}` with admin-only field guard — prefer **admin-prefixed** route for clarity.

**Side effects:** None on workflow state. Optional: touch `batches.updated_at` for pipeline sort — prototype does **not**; match prototype unless product wants sort bump.

### Validation & errors

| Case | Status |
|------|--------|
| Non-admin | `403` |
| Ticket not found | `404` |
| `deadline_role` null or not smm/editor | `422` |
| Batch not `active` | `422` |
| Invalid ISO datetime | `422` |
| Completed batch ticket | `422` |

### Employee visibility

SMM/Editor boards may **display** `deadlineAt` on their tickets when present (read from B2 workspace); they do **not** mutate deadlines in v1.

---

## Frontend cutover

| Current | Replacement |
|---------|-------------|
| `computeAdminPipelineSummary` + `listAdminPipelineItems` memos | `useAdminPipelineQuery()` |
| `listAdminDeadlineTasks` memo | `useAdminDeadlinesQuery()` **or** memo on `useAdminWorkspaceQuery()` |
| `setVideoDeadline` | `useSetVideoDeadlineMutation()` |

### Files to touch

- `frontend/src/pages/admin/AdminWorkspace.tsx`
- `frontend/src/pages/admin/AdminDeadlines.tsx`
- `frontend/src/pages/admin/AdminClientDetail.tsx`
- `frontend/src/components/admin/AdminVideoKanban.tsx` (props unchanged; parent passes mutation)
- `frontend/src/pages/admin/adminWorkspaceStore.tsx` (remove deadline + owner writes)
- `frontend/src/hooks/api/useAdminPipelineQuery.ts`
- `frontend/src/hooks/api/useSetVideoDeadlineMutation.ts`

Keep [`adminPipeline.ts`](../../frontend/src/lib/adminPipeline.ts) as **reference** or thin wrappers calling API types until B11 removes duplication — optional delete after server parity tests.

### Invalidation

After PATCH deadline: invalidate `admin/pipeline`, `admin/deadlines`, `admin/workspace` (if used), and client detail batch videos query.

---

## RBAC matrix (B10)

| Route | client | editor | smm | admin |
|-------|--------|--------|-----|-------|
| `GET /admin/pipeline` | — | — | — | ✓ |
| `GET /admin/deadlines` | — | — | — | ✓ |
| `PATCH /admin/videos/{id}/deadline` | — | — | — | ✓ |

---

## Server implementation notes

### Service layout

| Module | Responsibility |
|--------|----------------|
| `app/services/admin_pipeline_service.py` | Port `pipelineOwnerForBatch`, `stageLabelForBatch`, summary + items |
| `app/services/admin_deadlines_service.py` | Port `listAdminDeadlineTasks`; PATCH handler |
| `app/controllers/admin.py` | Routes (extend B1 router) |

Share intake/clip helpers with batch services (`batch_needs_client_intake`, `batch_needs_smm_find_clips`) — duplicate port from [`clientBoard.ts`](../../frontend/src/lib/clientBoard.ts) / [`smmBoard.ts`](../../frontend/src/lib/smmBoard.ts) or import shared Python module.

### `stageLabelForBatch` vs B2 mappers

B2 ticket DTOs already expose `stageLabel`. Pipeline batch row should use the **same** label function as boards to avoid admin seeing “Mixed stages” while client sees something else.

### Datetime handling

Frontend uses `datetime-local` → `toISOString()` ([`AdminDeadlines.tsx`](../../frontend/src/pages/admin/AdminDeadlines.tsx)). API accepts **ISO 8601** timestamptz; store UTC.

---

## Risks & open questions

| # | Question | Recommendation |
|---|----------|----------------|
| 1 | B1 stub vs B10 full pipeline | B10 implements `GET /admin/pipeline`; B1 doc cross-links |
| 2 | `GET /admin/deadlines` vs workspace derive | Ship dedicated GET for parity testing; page can choose either |
| 3 | Update `batch.updated_at` on deadline PATCH | v1: no (match store) |
| 4 | Deadline on gate ticket (`deliverable_index` null) | Allowed if `deadline_role` set — matches seeds (`v-identifying-gate`) |
| 5 | Scheduling/done tickets with stale `deadline_role` | Filter list by active + role; completed tickets drop off deadlines page when batch completes |
| 6 | `setVideoOwner` | Do not implement |
| 7 | Pipeline after B9 `scheduling` owner | Open-ticket filter excludes `scheduling`/`done`; dominant owner falls through to batch-level inference — verify with `b-schedule` seed |
| 8 | Duplicate logic TS/Python | pytest compares sample batches to golden JSON from TS fixtures |

---

## Suggested implementation order (B10 execution)

1. Port `pipelineOwnerForBatch` / `stageLabelForBatch` + unit tests against mock batch ids (`b-new`, `b-pipeline`, `b-schedule`).  
2. `GET /admin/pipeline` + OpenAPI types.  
3. `list_admin_deadline_tasks` + `GET /admin/deadlines`.  
4. `PATCH /admin/videos/{id}/deadline` + validation.  
5. pytest: admin cannot set deadline on `client_qa` ticket; clear deadline; pipeline counts for seeded active batches.  
6. Frontend hooks; wire `AdminWorkspace`, `AdminDeadlines`, `AdminClientDetail`.  
7. Fix mode: FLOW-1 steps 20–21 (pipeline + client detail kanban deadlines).

---

## Quality checks

- [x] `setVideoDeadline` mapped  
- [x] `setVideoOwner` explicitly out of scope  
- [x] Pipeline summary + items port documented  
- [x] `listAdminDeadlineTasks` rules (active + smm/editor role)  
- [x] No workflow side effects on deadline PATCH  
- [x] RBAC admin-only  
- [x] B2/B1 read paths referenced; no new tables  

---

## Links

| Artifact | Path |
|----------|------|
| B1 admin (pipeline stub) | [`B1-admin-clients-batches.md`](./B1-admin-clients-batches.md) |
| B2 workspace | [`B2-read-models-boards.md`](./B2-read-models-boards.md) |
| B9 scheduling owner | [`B9-scheduling-credits.md`](./B9-scheduling-credits.md) |
| UI spec §7 | [`../path-b-ui-spec.md`](../path-b-ui-spec.md) |
| Pipeline lib | [`../../frontend/src/lib/adminPipeline.ts`](../../frontend/src/lib/adminPipeline.ts) |
| Problem context (admin deadlines) | [`../problem-context.md`](../problem-context.md) |
| Fix-mode admin steps | [`../test-ui.md`](../test-ui.md) (FLOW-1 §D) |
