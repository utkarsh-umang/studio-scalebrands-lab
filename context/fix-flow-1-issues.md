# FLOW-1 fix plan — issues from first-pass testing

**Status:** Ready to implement  
**Scope:** [`test-ui.md`](./test-ui.md) **FLOW-1 only** (steps 1–22). Do **not** start FLOW-2 until every story in this doc is done and FLOW-1 is re-run green.  
**Out of scope here:** FLOW-3–7 (mutating flows), new backend APIs, in-app uploads.

**Related:** [`path-b-ui-spec.md`](./path-b-ui-spec.md) · [`problem-context.md`](./problem-context.md) · [`test-ui.md`](./test-ui.md)

---

## How to use this doc

Work **one epic at a time**, stories in order. After each epic, re-run only the **Verification** steps listed for that epic, then continue.

When all epics are complete:

1. Update `path-b-ui-spec.md` per **Epic 7**.
2. Update `test-ui.md` steps 6, 8, 10, 14, 17, 18 expectations.
3. Full **FLOW-1** read-only pass (no approve/submit).
4. Begin **FLOW-2** testing and log new issues in a separate doc (`fix-flow-2-issues.md` if needed).

---

## Issue index (maps to epics)

| ID | Summary | Epic |
|----|---------|------|
| F1-01 | Client `b-identifying` — empty kanban; need in-progress status card | 1 |
| F1-02 | Client `b-clips-ready` — browse clips + “team working” banner (not opaque gate only) | 1 |
| F1-03 | Numbered clips sidebar scrolls **clip list**, not whole modal/container | 2 |
| F1-04 | Deliverable rows look like flat toggles, not real accordions | 3 |
| F1-05 | QA: video + comments side-by-side; thumb/title below with secondary QA copy | 4 |
| F1-06 | Editor missing-asset / status blocks need same accordion pattern | 3 |
| F1-07 | SMM schedule: per-video, no published link field | 5 |
| F1-08 | Editor should see Find clips (parity with SMM) | 6 |
| F1-09 | SMM should edit video title on production cards | 6 |

**Admin (FLOW-1 steps 20–22):** no issues logged.

---

## Epic 1 — Client early-stage visibility (`b-identifying`, `b-clips-ready`)

**Goal:** Client always sees meaningful **In progress** kanban state after intake — not an empty board during team clip ID or pre-deliverables production.

**FLOW-1 steps:** 6 (`b-identifying`), 8 (`b-clips-ready`)

### Story 1.1 — `b-identifying` in-progress kanban card

**As a** client on `b-identifying` (May Podcast — identifying)  
**I want** a card in **In progress** that explains the team is identifying clips  
**So that** I know work is happening after I submitted raw footage.

**Current behavior:** `clipReviewPhase: smm_identifying`, no video tickets → **zero kanban cards** (confusing empty board).

**Acceptance criteria**

- [x] With `b-identifying` selected, **In progress** shows **one** card (e.g. title: “Clip identification in progress” or “Team is identifying your clips”).
- [x] Card subtitle/copy: team is reviewing your source and preparing numbered clips; you’ll be asked to approve clips when ready.
- [x] Optional link: **Open source footage** when `sourceMediaUrl` is set.
- [x] Card does **not** offer Approve/Reject (client action comes at `b-clips`).
- [x] Opening the card opens a modal or inline panel with the same messaging (no dead-end empty modal).
- [x] If `clipsFolderUrl` is added later (sync), modal may show **read-only** numbered clips preview (Epic 2 layout) with banner: “Preview only — approval opens when your team finishes identification.”

**Implementation notes**

- Add mock ticket e.g. `v-identifying-gate` on `b-identifying`, `owner: smm` or `editor`, `stageLabel` e.g. `Clip identification`, column → **in_progress** via `deriveClientColumn`.
- Extend `filterVideosForClientKanban` / `clientBatchKanbanPhase` if `clips_identifying` currently filters to zero cards.
- New or reused component: `ClientClipIdentificationStatusModal` (read-only, no footer CTAs).

**Verification:** FLOW-1 step 6 — expect **one in-progress card**, not empty kanban.

---

### Story 1.2 — `b-clips-ready` browse clips + team-working banner

**As a** client on `b-clips-ready` (August Clips Pack)  
**I want** to open the same **numbered clips sidebar + player** view with a clear banner that the team is producing from my clips  
**So that** I can see what I submitted while waiting for finished videos.

**Current behavior:** Single gate card (`v-clips-ready-gate`) with generic “awaiting deliverables” feel; no clips browser for client.

**Acceptance criteria**

- [x] **In progress** shows one card (e.g. “Production in progress” / “Team is editing your clips”).
- [x] Open → **Numbered clips modal** in `view` / read-only mode: left (or spec-aligned) **scrollable clip list**, right **player**, `clipsFolderUrl` manifest.
- [x] **Banner** at top of modal (above list/player): e.g. “Our team is working on these clips now. You’ll review finished videos here when they’re ready.”
- [x] No Approve/Reject, no “Submit deliverables” (client).
- [x] Drive sync + open clips folder links still available in header where applicable.

**Implementation notes**

- Reuse `NumberedClipsModal` with `mode="view"` + new `statusBanner` prop or wrapper `ClientClipsInProductionModal`.
- Ensure `v-clips-ready-gate` maps to **in_progress** and opens this modal from client board card click.

**Verification:** FLOW-1 step 8 — one card → clips sidebar + player + banner → close.

---

### Story 1.3 — Demo data + scenario catalog

**Acceptance criteria**

- [x] `MOCK_ADMIN_VIDEO_TICKETS` includes tickets for `b-identifying` (and confirms `b-clips-ready` gate behavior).
- [x] `pathBDemoScenarios.ts` `clientBoardExpectation` strings updated for both batches.
- [x] `frontend/README.md` seeded batch table matches new UX.

**Verification:** Client login → both batch tabs match expectations above.

---

## Epic 2 — Numbered clips sidebar scroll (implementation fix)

**Goal:** Fix **broken scroll UX** in numbered clips UI — the **clip index list** scrolls inside a fixed sidebar; the player area stays stable; the **outer modal body does not** become the scroll container for the list.

**FLOW-1 steps:** 7 (`b-clips`), 13 (`b-editing` editor modal)

**Problem (current):** `ClipsReviewPanel` gives the aside `md:max-h-none` and scroll on `<main>`; with many clips (~20), the wrong region scrolls or the list grows the whole modal.

### Story 2.1 — `ClipsReviewPanel` layout contract

**Acceptance criteria**

- [x] Modal shell: `flex` column, `min-h-0`, fixed max height (e.g. `max-h-[85vh]`); **only** designated regions scroll.
- [x] **Sidebar (`aside`):** fixed width, `flex flex-col`, `min-h-0`, `max-h-full`.
- [x] **Clip list (`ul`):** `flex-1 min-h-0 overflow-y-auto` — **this element scrolls**, not the aside’s parent and not the full modal.
- [x] **Player (`main`):** `min-h-0`; player preview may scroll internally if needed, but list scroll is independent.
- [x] Footer (approve/reject / editor submit) stays `shrink-0` below the split pane.
- [x] Works at ~20 clips on desktop and mobile (sidebar may use shorter max-height on small screens, but list still scrolls inside sidebar).

**Files (likely):** `ClipsReviewPanel.tsx`, `NumberedClipsModal.tsx`, `StudioModalShell` if needed.

**Verification:** FLOW-1 step 7 and editor step 13 — long clip list: scroll **only** the clip names column.

---

### Story 2.2 — Apply to all numbered-clips entry points

**Acceptance criteria**

- [x] Client clip approval (`b-clips`).
- [x] Editor pre-split (`b-editing`).
- [x] Client read-only modals from Epic 1 (`b-identifying` preview if clips exist, `b-clips-ready`) — same `NumberedClipsModal` / panel when added.
- [x] SMM view paths using `NumberedClipsModal` (`SmmBoard`).

**Verification:** Same scroll behavior on each surface above.

---

## Epic 3 — Deliverable summary & production status accordions

**Goal:** Replace flat expand toggles with **recognizable accordion UI** (chevron, bordered sections, one-or-many open, clear headers for Clip / Completed video / Thumbnail / Video title / Raw).

**FLOW-1 steps:** 10 (client `b-pipeline` modals), 14 (editor missing thumb/title cards)

**Problem (current):** `DeliverableSummaryPanel` uses `togglePreview` on rows that read as generic rows, not accordions.

### Story 3.1 — Shared `DeliverableAccordion` (or design-system pattern)

**Acceptance criteria**

- [x] Each deliverable row: **header button** with label, optional status chip (✓ / missing), **chevron** (closed = right/down per design system, open = rotated).
- [x] **Panel body** animates or toggles open below header; only panel content expands (not whole modal scroll hijack).
- [x] Sections: Raw footage (link), Clip #n, Completed video (+ Sync), Thumbnail (+ Sync), Video title (input when editable).
- [x] Default: video section open for production contexts; others collapsed unless missing (optional: auto-expand missing thumb/title for editor).

**Files (likely):** new `DeliverableAccordion.tsx`, refactor `DeliverableSummaryPanel.tsx`.

**Verification:** FLOW-1 step 10 — open each of five cards; accordions look and behave consistently.

---

### Story 3.2 — Editor production / readiness “what’s missing” accordion

**Acceptance criteria**

- [x] `EditorProductionModal` / readiness strip: missing thumbnail / missing title / QA fix entry uses **same accordion component** for package sections (not a separate flat list style).
- [x] `v-p-4`, `v-p-5` on `b-pipeline` clearly show missing asset in header + expanded section.

**Verification:** FLOW-1 step 14 — `v-p-4`, `v-p-5` missing states readable at a glance.

---

### Story 3.3 — Client unified QA package section

**Acceptance criteria**

- [x] `ClientUnifiedQaModal` deliverable package uses accordions for clip/thumb/title (video primary in QA workspace per Epic 4).

**Verification:** FLOW-1 step 10 — `v-p-3` client QA package matches accordion pattern.

---

## Epic 4 — QA workspace: side-by-side video + comments

**Goal:** SMM, client, and editor QA fix flows let users **watch video and comment at the same time**; thumbnail and title move **below** as secondary QA surfaces.

**FLOW-1 steps:** 10 (`v-p-3` client), 14 (`v-p-2` editor fix), 17 (`v-p-1` SMM)

**Problem (current):** `QaCommentWorkspace` stacks player, then thread; comments in a short `max-h` box; not side-by-side.

### Story 4.1 — Two-column QA layout component

**Acceptance criteria**

- [x] Desktop (`md+`): **Left ~55–60%** video player (fixed min height); **right** comment thread + add comment + actions.
- [x] Thread scrolls inside right column (`overflow-y-auto`), not the whole modal.
- [x] Mobile: stack video above comments (acceptable collapse).
- [x] Footer actions (Approve / Request changes / Approve & release) span full width below columns or sit in right column bottom — consistent across roles.

**Files (likely):** `QaCommentWorkspace.tsx`, modals: `SmmVideoQaModal`, `ClientUnifiedQaModal`, `EditorQaFixModal`.

**Verification:** FLOW-1 steps 10, 14, 17 — comment while video visible without scrolling past player.

---

### Story 4.2 — Thumbnail + title below QA columns

**Acceptance criteria**

- [x] Below the two-column block: **Thumbnail** and **Video title** rows (preview + title text/input per role).
- [x] Helper copy (client + SMM): e.g. “Questions about the thumbnail or title? Leave a comment here — main video feedback is above.”
- [x] Client unified QA: `showPackagePreview` refactored — video in left column; thumb/title block below, not replacing side-by-side layout.
- [x] SMM internal QA: same layout as client for consistency.

**Verification:** FLOW-1 step 10 `v-p-3` — video QA primary; thumb/title accessible below.

---

### Story 4.3 — Editor QA fix modal parity

**Acceptance criteria**

- [x] `EditorQaFixModal` / panel uses Epic 4 layout; sold comments still visible in right thread.

**Verification:** FLOW-1 step 14 — `v-p-2` editor fix matches SMM/client QA layout pattern.

---

## Epic 5 — SMM scheduling: per-video, no publish link

**Goal:** Scheduling is **per video** as it becomes ready — not a batch-completion gate; remove **published media URL** field.

**FLOW-1 step:** 18 (`b-schedule`)

**Problem (current):** `SmmScheduleBatchModal` schedules multiple videos in one batch modal with `publishLink` per row; kanban has “Schedule batch” gate.

### Story 5.1 — Per-video schedule entry on card

**Acceptance criteria**

- [x] Each video in scheduling column has **Schedule** (or “Set go-live”) on the card or production modal — opens **single-video** schedule UI.
- [x] Fields: platform (or channel), scheduled date/time — **no** publish URL / post link.
- [x] Marking scheduled moves that video toward `completed` / done column without requiring all siblings scheduled.
- [x] Copy explains credits still debit when **all** videos in batch complete (unchanged business rule).

**Verification:** FLOW-1 step 18 — schedule from a single video card; no publish link input.

---

### Story 5.2 — Remove batch schedule gate UI

**Acceptance criteria**

- [x] Remove or repurpose `SmmScheduleBatchModal`, `SmmScheduleBatchCard`, “Schedule batch” kanban gate when it implies batch-only scheduling.
- [x] `SmmPathBVideoKanban` schedule column shows per-video cards only.
- [x] Attention strip label updated (e.g. “Schedule video” not “Schedule batch”).

**Verification:** `b-schedule` board has no misleading batch-only CTA.

---

### Story 5.3 — Mock + state for partial schedule

**Acceptance criteria**

- [x] `b-schedule` demo videos can show mixed states (one scheduled, others ready) if helpful for QA.
- [x] `test-ui.md` step 18 wording updated in Epic 7.

---

## Epic 6 — Role parity (offline ownership, platform option)

**Goal:** Align UI with [`problem-context.md`](./problem-context.md): Editor and SMM both **see** clip identification; SMM can **edit title** like Editor.

**FLOW-1 steps:** 16 (`b-identifying` SMM — extend to editor), production cards on SMM board

### Story 6.1 — Editor Find clips on `b-identifying`

**Acceptance criteria**

- [x] Editor board shows **Find clips** card/modal for batches in `clips_identifying` (same capability as SMM: paste clips folder URL, sync, view numbered list).
- [x] Copy notes assignment is coordinated offline (CSM); UI does not enforce single owner.
- [x] Editor kanban `awaiting_clips` phase shows this entry for podcast path batches.

**Files (likely):** `EditorBoard.tsx`, reuse `SmmFindClipsModal` or extract `FindClipsModal`, `editorBoard.ts`.

**Verification:** Editor login → `b-identifying` → Find clips UI works (FLOW-1 step 16 parity).

---

### Story 6.2 — SMM video title edit on production modal

**Acceptance criteria**

- [x] `SmmProductionModal` → `DeliverableSummaryPanel` with `titleEditable` + save handler (mirror editor).
- [x] Thumbnail remains Drive-based (any role can upload to folder); no change required for thumb parity.

**Verification:** SMM → `b-pipeline` production card → edit title → persists in mock store.

---

## Epic 7 — Spec & test doc updates + FLOW-1 sign-off

### Story 7.1 — Update `path-b-ui-spec.md`

- [ ] §3.1 — explicit sidebar list `overflow-y-auto` (clip list scrolls, not modal).
- [ ] §4.3 — `clips_identifying` and `clips_ready_intake` client kanban cards (in progress).
- [ ] §3.2 — accordion deliverable summary.
- [ ] §3.3 — side-by-side QA + thumb/title below.
- [ ] §6.2 — per-video schedule, no publish link.
- [ ] §5 — editor Find clips.

### Story 7.2 — Update `test-ui.md` FLOW-1 table

| Step | Old check | New check |
|------|-----------|-----------|
| 6 | No kanban cards | One **In progress** card → status modal (identifying clips) |
| 8 | One gate card | One **In progress** card → read-only clips modal + team-working banner |
| 18 | Schedule modal | Per-video schedule; no publish link |

### Story 7.3 — FLOW-1 full re-pass

- [ ] Run FLOW-1 steps 1–22 read-only; mark OK in `test-ui.md` or clear issue log.
- [ ] `npm run build` passes.
- [ ] Proceed to **FLOW-2** matrix testing.

---

## Suggested implementation order

```
Epic 2 (scroll)     → quick UX win, unblocks Epic 1 modals
Epic 1 (client)     → b-identifying + b-clips-ready visibility
Epic 3 (accordions) → deliverable summary + editor production
Epic 4 (QA layout)  → cross-role modals
Epic 6 (parity)     → editor find clips + SMM title
Epic 5 (schedule)   → larger product change; last in FLOW-1
Epic 7 (docs)       → after code complete
```

---

## FLOW-1 verification checklist (post-fix)

| Step | Batch / route | Pass when |
|------|---------------|-----------|
| 6 | `b-identifying` | In progress card + identifying copy |
| 7 | `b-clips` | Clip list scrolls inside sidebar |
| 8 | `b-clips-ready` | Clips modal + team-working banner |
| 10 | `b-pipeline` | Accordions + client QA layout on `v-p-3` |
| 13 | `b-editing` | Sidebar scroll + submit deliverables visible |
| 14 | `b-pipeline` | Editor QA side-by-side; accordions on `v-p-4`, `v-p-5` |
| 16 | `b-identifying` | SMM Find clips |
| — | `b-identifying` | **Editor** Find clips (Story 6.1) |
| 17 | `v-p-1` | SMM QA side-by-side |
| 18 | `b-schedule` | Per-video schedule, no publish URL |

---

## Issue log (runtime — optional)

Copy rows into [`test-ui.md`](./test-ui.md) issue table as you fix, or track here:

| # | Story | Fixed? |
|---|-------|--------|
| 1 | 1.1 | ✅ |
| 2 | 1.2 | ✅ |
| 3 | 2.1 | ✅ |
| 4 | 3.1–3.3 | ✅ |
| 5 | 4.1–4.3 | ✅ |
| 6 | 5.1–5.3 | ✅ |
| 7 | 6.1–6.2 | ✅ |
| 8 | 6.2 | ⬜ |

**FLOW-1 fix complete when:** all stories checked + FLOW-1 re-pass green → start FLOW-2.
