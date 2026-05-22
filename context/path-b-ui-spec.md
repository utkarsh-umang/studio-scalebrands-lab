# Path B — UI Specification

**Status:** Source of truth for frontend build (prototype → production)  
**Scope:** Raw-footage / clips-ready intake only (no idea-first path in v1)  
**Related:** [`problem-context.md`](./problem-context.md) · [`path-b-build-plan.md`](./path-b-build-plan.md) (build epics only) · [`test-ui.md`](./test-ui.md) (fix mode — after all epics done)

---

## 1. What we are building

**Studio** (`studio.scalebrandslab.com`) is the system of record for Scale Brands Lab’s short-form video pipeline. **Path B** is the only intake model in this spec:

| Intake type | Client submits | Team work before numbered clips exist |
|-------------|----------------|--------------------------------------|
| **Podcast / raw footage** | Link to long-form source | SMM and/or Editor identify clips; upload a Drive folder with files numbered `1…n` |
| **Clips ready** | Drive link with clips already numbered `1…n` | Skip identification; go straight to production |

**Numbering rule:** Every Drive folder in the workflow uses **1-based indices** (`1.mov`, `2.mov`, … or `1`, `2`, … in `videos/` and `thumbnails/`).

**Card model:**

- **Before** the editor submits the **deliverables Drive** (root with `videos/` + `thumbnails/`): the batch shows **one kanban card**; all clips live inside that card’s modal.
- **After** deliverables Drive is linked: Studio **splits** into **n cards** (one per clip index). Each card tracks its own video, thumbnail, title, and QA.

**QA model (per video, not per batch):**

1. Internal **SMM QA** — comment on video (plain text; users may type `@1:03` but the app does not provide timestamp UI).
2. **Client QA** — one screen: raw source link + clip + completed video + thumbnail + title; approve or comment.
3. Revisions always return through **SMM QA** before the client sees the video again (never editor → client directly).
4. On Drive **re-upload**, sync bumps video version; prior SMM comments marked **sold** (visible, struck/read-only); new version re-enters SMM QA.

**Credits:** Admin sets `creditCost` on batch creation. When **every** video in the batch is `completed`, deduct `creditCost` from the client once (`creditsDebited`).

**Out of scope (v1):** Login changes, idea-first path, in-app uploads, payments API, timestamp comment UI, in-app CSM assignment of clip/thumbnail owner.

---

## 2. Routes (pages)

Login is done. Each role uses a **board hub** + **modals** (no per-step routes).

| Route | Role | Purpose |
|-------|------|---------|
| `/client/board` | Client | Credits, attention, batch folders, kanban |
| `/client/all` | Client | Scheduled / completed (“Our work”) |
| `/editor/board` | Editor | Active batches + kanban |
| `/editor/completed` | Editor | Archive |
| `/smm/board` | SMM | Active pipeline |
| `/smm/completed` | SMM | Scheduled / done |
| `/admin` | Admin | Clients + pipeline |
| `/admin/clients/:id` | Admin | Client detail, credits, batches |

---

## 3. Global UI patterns

### 3.1 Numbered clips modal (batch phase — single card)

Used when the batch has a **clips folder** but no **deliverables folder** yet (and for client clip approval).

```
┌──────────────────────────────────────────────────────────────────┐
│  [Batch title] · Clips                                    [×]    │
├────────────────┬─────────────────────────────────────────────────┤
│ ① Clip title    │                                                 │
│ ② …            │         Video player (selected index)           │
│ ③ …  (scroll)  │                                                 │
│                │  [Open clips folder on Drive]  [Sync]            │
├────────────────┴─────────────────────────────────────────────────┤
│  Editor only: [Submit videos for this batch] → paste Drive URL   │
│  Client only: [Approve all] [Reject — note required]             │
└──────────────────────────────────────────────────────────────────┘
```

- **Left:** scrollable list `1…n` from Drive manifest (`clips` slot).
- **Right:** stream selected clip.
- **Sync:** refresh manifest from Drive (prototype: reload `driveManifests` / mock).

### 3.2 Deliverable summary (per-video card — post-split)

Opened from a kanban card after split.

| Row | Source | Actions |
|-----|--------|---------|
| Raw footage | Batch `sourceMediaUrl` or external link | Open link |
| Clip | `clips/{n}` manifest | Preview in modal |
| Completed video | `videos/{n}` | Preview + **Sync** |
| Thumbnail | `thumbnails/{n}` | Preview + **Sync** |
| Video title | Database field | Input (SMM or Editor) + Save |

**Readiness strip (per video):** Video ✓ · Thumbnail ✓ · Title ✓ → enables “Send to SMM QA” when all three set.

### 3.3 QA workspace (separate modal — per video)

Linked from summary card and attention strip.

```
┌──────────────────────────────────────────────────────────────────┐
│  QA — [Video title] · #[n]                                 [×]   │
├──────────────────────────────────────────────────────────────────┤
│  Video player (full width)                                       │
├──────────────────────────────────────────────────────────────────┤
│  Comment thread (newest first)                                   │
│    · Active comments                                             │
│    · Sold comments (editor re-uploaded v2) — muted + label       │
├──────────────────────────────────────────────────────────────────┤
│  [Add comment]  [Approve & release to client]  (SMM)             │
│  [Add comment]  [Approve]  [Request changes]     (Client)        │
└──────────────────────────────────────────────────────────────────┘
```

- **SMM:** Approve → sets `releasedToClient` / moves to client queue (only if readiness was already met).
- **Client:** Request changes → owner `smm`, `lastRevisionRequestedBy: 'client'`; SMM triages offline; fixes route to editor or SMM; **always** back to SMM QA before client.

### 3.4 Drive layout (deliverables folder)

After **Submit videos for this batch**, the linked root must contain:

```
Deliverables root/
  videos/     → 1, 2, … n (video files)
  thumbnails/ → 1, 2, … n (image files)
```

Titles are **not** in Drive; stored in Studio DB per `deliverableIndex`.

---

## 4. Client UI (`/client/board`)

### 4.1 Board chrome (always)

1. **Credits bar** — `client.credits` (+ optional “reserved” per active batch).
2. **Attention strip** — items that deep-link open the correct modal (`?openVideo=`).
3. **Batch folder row** — horizontal tabs for active batches.
4. **Video kanban** — 4 columns: Yet to start · In progress · In review · Completed.

### 4.2 Intake (inline card on board)

When `batchNeedsClientIntake(batch)`:

- Toggle: **Podcast / raw footage** vs **Clips-ready Drive**.
- Single URL field + submit.
- Copy: share Drive access with `STUDIO_DRIVE_READER_EMAIL`.

**Do not show** “Request ideas” in Path B v1.

### 4.3 Kanban card rules

| Batch state | Cards shown |
|-------------|-------------|
| Intake not done | 0 cards (intake card only) |
| Clips folder exists, no deliverables Drive | **1 card** — “Clip approval” or batch production gate |
| Deliverables Drive set | **n cards** — one per `deliverableIndex` |

### 4.4 Client modals

| Modal | When | Actions |
|-------|------|---------|
| Numbered clips | `stageLabel` clip review | Approve / reject clips |
| Deliverable summary + QA | Client queue | View package; open QA; approve / request changes |

**Remove in v1:** separate thumbnail review, text review, idea review modals.

---

## 5. Editor UI (`/editor/board`)

### 5.1 Board chrome

Same pattern as client: attention strip, batch folders, kanban (editor column model may differ but same batches).

### 5.2 Pre-split (one card)

- Open **numbered clips modal**.
- Primary CTA: **Submit videos for this batch** → `editorDeliverablesDriveUrl` → store creates tickets `1…n` → kanban splits.

### 5.3 Post-split (per card)

- **Video:** primary editor responsibility; upload to `videos/n`; Sync.
- **Thumbnail / title:** same UI as SMM (shared sections); optional submit.
- **QA fix modal:** when `stageLabel` QA flagged; resubmit via Drive re-upload.

Editor does **not** receive client comments directly.

---

## 6. SMM UI (`/smm/board`)

### 6.1 Pre-split

- **Clip identification:** upload/paste clips folder URL → `clipReviewPhase: awaiting_client` + clip review ticket for client.
- Same numbered clips modal as Editor (view + sync).

### 6.2 Post-split

- Per-card: thumbnail + title inputs, readiness strip.
- **Internal QA workspace** per video (separate modal).
- **Client revision triage:** view client comments on package; coordinate (UI note: “route to editor vs update thumb/title”).
- **Schedule modal:** platform, go-live, publish link, mark video completed.

When all videos completed → batch `status: completed`, `creditsDebited: true`, client credits -= `creditCost`.

---

## 7. Admin UI

| Route | Purpose |
|-------|---------|
| `/admin` | Workspace — live pipeline counts, batch list, clients table |
| `/admin/deadlines` | SMM/Editor due dates (workspace store) |
| `/admin/clients/:id` | Client detail — batches, kanban, credits, create batch |

- Create batch with **credit allotment** (`creditCost`) via `CreateBatchFolderModal`.
- Pipeline: `adminPipeline.ts` derives counts and batch rows from active workspace data.
- Deadlines: `listAdminDeadlineTasks` → `setVideoDeadline` on tickets.
- Credits: available balance, reserved on active batches, debited flag on completed batches.

---

## 8. Data model (prototype / API)

### 8.1 Batch (`AdminBatchFolder`)

| Field | Purpose |
|-------|---------|
| `intakePath` | `source_media` \| `clips_ready` |
| `sourceMediaUrl` | Podcast / raw link |
| `clipsFolderUrl` | Numbered clips folder |
| `clipReviewPhase` | `smm_identifying` \| `awaiting_client` \| `with_smm` \| `approved` |
| `editorDeliverablesDriveUrl` | Split trigger |
| `creditCost` / `creditsDebited` | Billing |
| `videoCount` | n after split |
| `demoStage` | Optional — ties row to demo catalog (`pathBDemoScenarios.ts`) |

### 8.2 Video ticket (`AdminVideoTicket`) — after split

| Field | Purpose |
|-------|---------|
| `deliverableIndex` | 1…n |
| `owner` | `client` \| `smm` \| `editor` \| `scheduling` \| `done` |
| `stageLabel` | Human step (see §9) |
| `editorPublishTitle` | Video title in DB (rename later if needed) |
| `assetVersions.video` | Bumps on Drive sync / re-upload |
| `qaCommentHistory[]` | `{ body, authorRole, assetVersion, deprecated }` — `deprecated === sold` |
| `releasedToClientFinalVideoReview` | Client can see QA queue |
| `lastRevisionRequestedBy` | `smm` \| `client` — routing hints |

**Batch gate ticket (pre-split):** single ticket, no `deliverableIndex`, title e.g. `Clip approval` or `Batch — {batch title}`.

### 8.3 Drive manifest (`BatchDriveManifest`)

Per `batchId`: `clips[]`, `videos[]`, `thumbnails[]`, `syncedAt`, `unmapped[]`.

Prototype aliases: see `getManifestForBatch` in `frontend/src/lib/driveMedia.ts` (demo batches map → `b-204` manifest).

---

## 9. Stage labels & owners (canonical)

Use these in mock data and UI copy for consistency.

| `demoStage` | `stageLabel` (typical) | `owner` | Kanban cards |
|-------------|------------------------|---------|--------------|
| `intake_pending` | Awaiting client intake | — | 0 |
| `clips_identifying` | Clip identification | smm | 0 |
| `clip_client_review` | Clip review | client | 1 gate |
| `clips_ready_intake` | Clips ready — production | editor | 1 gate |
| `pre_split_production` | Awaiting deliverables folder | editor | 1 gate |
| `production` | Production | editor | n |
| `smm_qa` | SMM QA | smm | n |
| `editor_fix` | QA flagged | editor | n |
| `client_qa` | Client QA | client | n |
| `revision_via_smm` | Client revisions | smm | n |
| `scheduling` | Scheduling | scheduling | n |
| `completed` | Scheduled | done | n |

---

## 10. Demo data catalog

**Login (client):** `client@scalebrandslab.demo` / `demo1234` → client **c-1** (TechWithTim).

**File:** `frontend/mockData/pathBDemoScenarios.ts` — machine-readable index.  
**Seed:** `frontend/mockData/adminWorkspace.ts` — one active batch per stage (+ `b-archive` completed).

| Batch ID | `demoStage` | What to verify on `/client/board` |
|----------|-------------|-----------------------------------|
| `b-new` | `intake_pending` | Intake card only |
| `b-identifying` | `clips_identifying` | In progress, no kanban cards |
| `b-clips` | `clip_client_review` | 1 card → clip modal |
| `b-clips-ready` | `clips_ready_intake` | Clips-ready intake done, 1 gate card |
| `b-editing` | `pre_split_production` | 1 card → clips modal + submit deliverables CTA (editor) |
| `b-pipeline` | *(mixed)* | 5 cards: SMM QA, editor fix (sold comment), client QA, missing thumb, missing title |
| `b-schedule` | `scheduling` | Scheduling column |
| `b-archive` | `completed` | Completed + credits debited |

**Editor login:** use staff user mapped to `u-editor-1` (Arnav).  
**SMM login:** `u-smm-1` (Priya).

When implementing UI, filter by `batch.demoStage` or batch id in Storybook/dev panel optional.

---

## 11. Component checklist

**State:** Epics 0–7 complete. Path B boards + modals only; legacy Path A UI removed.

### Shared

| Component | Status | Path |
|-----------|--------|------|
| `NumberedClipsModal` | Shipped | `frontend/src/components/path-b/NumberedClipsModal.tsx` |
| `DeliverableSummaryPanel` | Shipped | `frontend/src/components/path-b/DeliverableSummaryPanel.tsx` |
| `DeliverableReadinessStrip` | Shipped | `frontend/src/components/path-b/DeliverableReadinessStrip.tsx` |
| `QaCommentWorkspace` | Shipped | `frontend/src/components/path-b/QaCommentWorkspace.tsx` |
| `DriveSyncButton` | Shipped | `frontend/src/components/path-b/DriveSyncButton.tsx` (+ `DriveSyncMeta`, `useDriveManifestSync`) |
| `pathBStateMachine` | Shipped | `frontend/src/lib/pathBStateMachine.ts` — canonical transitions in `adminWorkspaceStore` |

### Client (`/client/board`, `/client/all`)

| Component | Status |
|-----------|--------|
| `ClientBoard` | Shipped |
| `ClientBatchIntakeCard` | Shipped — podcast / clips-ready only |
| `ClientCardDetailModal` | Shipped — routes clip → `NumberedClipsModal`, deliverable → `ClientUnifiedQaModal` |
| `ClientUnifiedQaModal` | Shipped |
| `ClientVideoKanban` | Shipped |

**Removed (Path A):** `ClientThumbnailReviewModal`, `ClientFinalVideoReviewModal`, `ClientFinalReviewPanel`, idea/text/thumbnail routes redirect to board.

### Editor (`/editor/board`, `/editor/completed`)

| Component | Status |
|-----------|--------|
| `EditorPathBVideoKanban` | Shipped |
| `NumberedClipsModal` | Shipped — pre-split + submit deliverables on board |
| `EditorProductionModal` | Shipped |
| `EditorQaFixModal` | Shipped |

**Removed:** `EditorBatchWorkspaceModal`, `EditorVideosDriveModal`, `EditorThumbnailsModal`, `EditorVideoTitleModal`, `EditorVideoKanban` (3-column), `EditorOverview`.

### SMM (`/smm/board`, `/smm/completed`)

| Component | Status |
|-----------|--------|
| `SmmPathBVideoKanban` | Shipped |
| `SmmFindClipsModal` / `SmmFindClipsPanel` | Shipped |
| `SmmVideoQaModal` | Shipped |
| `SmmProductionModal` | Shipped |
| `SmmClientRevisionModal` | Shipped |
| `SmmScheduleBatchModal` | Shipped — schedule + batch complete + credits |

**Removed:** `SmmBatchDetailModal`, `SmmVideoQaWorkspace`, `SmmBatchBoard`, `SmmPublishAttestModal`, `SmmTitlesHandoffPanel`, `SmmOverview`.

### Admin (`/admin`, `/admin/clients/:id`, `/admin/deadlines`)

| Component | Status |
|-----------|--------|
| `AdminWorkspace` | Shipped — pipeline + clients table |
| `AdminClientDetail` | Shipped |
| `AdminPipelineOverview` | Shipped |
| `CreateBatchFolderModal` | Shipped |

**Removed:** `AdminOverview`, `AdminBatchBoard`, `AdminClients` (standalone), static pipeline mocks.

---

## 12. Implementation order

Build epics 0–7 are complete. Next step: **fix mode** in [`test-ui.md`](./test-ui.md).

---

## 13. Acceptance criteria (Path B v1)

Prototype build targets — verify in fix mode:

- [ ] Client can submit podcast or clips-ready Drive link only.
- [ ] Pre-split batch shows exactly **one** kanban card; clips modal lists `1…n` with playback.
- [ ] Editor submit deliverables Drive creates **n** cards and links manifest `videos/` + `thumbnails/`.
- [ ] Each card shows four deliverable rows; title saves to DB; sync pulls Drive files.
- [ ] SMM QA is a dedicated comment screen; re-upload marks old comments sold.
- [ ] Client QA is one screen for video + thumbnail + title; reject returns to SMM only.
- [ ] Post-fix path: editor/SMM → **SMM QA** → client (never skip SMM).
- [ ] All videos completed → batch completes → credits debited once.
- [ ] Demo login can walk every `demoStage` in §10; live actions update state via `adminWorkspaceStore` (Epic 6).
