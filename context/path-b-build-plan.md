# Path B — Build Plan (Mock Data)

**UI spec:** [`path-b-ui-spec.md`](./path-b-ui-spec.md)

This document is **build only**. Testing and bug fixing happen later — see [`test-ui.md`](./test-ui.md) **only after Epics 0–7 are Done**.

---

## Build phase (no testing)

1. Complete **one epic** at a time, in order (0 → 7).  
2. Finish every story in that epic before starting the next.  
3. **Do not** open `test-ui.md` during build.  
4. **Do not** manually QA screens or log UI bugs while building — note blockers in code comments or a scratch pad if needed; formal fix pass comes later.  
5. Per story, only verify: **`npm run build`** passes and the story’s “Done when” line is met.  
6. Mark each epic **Done** in the tracker when all its stories are implemented.

When **all epics are Done**, stop building and switch to **fix mode** using `test-ui.md`.

---

## Epic tracker

| Epic | Name | Status |
|------|------|--------|
| 0 | Foundation | Done |
| 1 | Shared UI kit | Done |
| 2 | Client portal | Done |
| 3 | Editor portal | Done |
| 4 | SMM portal | Done |
| 5 | Admin | Done |
| 6 | Store & state machine | Done |
| 7 | Cleanup | Done |

**Build phase complete when:** every row above is **Done** — **all epics Done; switch to fix mode.**

---

## Demo logins (implementation reference)

Password for all: `demo1234`

| Role | Email |
|------|--------|
| Client | `client@scalebrandslab.demo` |
| Editor | `editor@scalebrandslab.demo` |
| SMM | `smm@scalebrandslab.demo` |
| Admin | `admin@scalebrandslab.demo` |

Primary client: **c-1** (TechWithTim). Mock seeds: `pathBDemoScenarios.ts`, `adminWorkspace.ts`.

---

## EPIC 0 — Foundation

**Outcome:** Spec, staged mock batches, Drive manifest aliases.

| Story | What to build |
|-------|----------------|
| PATHB-0.1 | `path-b-ui-spec.md` + link from `problem-context.md` |
| PATHB-0.2 | `pathBDemoScenarios.ts` + `demoStage` on batches/videos in `adminWorkspace.ts` |
| PATHB-0.3 | `MANIFEST_ALIASES` in `driveMedia.ts` for demo batch ids |
| PATHB-0.4 | `test-ui.md` (fix-mode flows — for use after full build) |
| PATHB-0.5 | *(Optional)* Dev readme: `npm run dev` + demo logins |

**Done when:** `npm run build` passes; demo batches exist for `c-1`.

---

## EPIC 1 — Shared UI kit

**Outcome:** Reusable components: clips modal, deliverable summary, readiness, QA workspace, Drive sync.

| Story | What to build |
|-------|----------------|
| PATHB-1.1 | `NumberedClipsModal` — sidebar `1…n`, player, Drive link, Sync |
| PATHB-1.2 | `DriveSyncButton` — reload manifest, show `syncedAt` / unmapped |
| PATHB-1.3 | `DeliverableSummaryPanel` — raw, clip, video, thumb, title rows |
| PATHB-1.4 | `DeliverableReadinessStrip` — three checks + gated CTA |
| PATHB-1.5 | `QaCommentWorkspace` — player, thread, sold (`deprecated`) styling |
| PATHB-1.6 | Align new modals on `StudioModalShell` |

**Done when:** Components exported; `npm run build` passes.

---

## EPIC 2 — Client portal

**Outcome:** Path B client board only (no ideas / text / split thumbnail flows).

| Story | What to build |
|-------|----------------|
| PATHB-2.1 | Board chrome — credits, attention, folders, kanban per spec §4.3 |
| PATHB-2.2 | Intake: podcast vs clips-ready only; hide ideas |
| PATHB-2.3 | Kanban filters: 0 cards / 1 gate card / n cards |
| PATHB-2.4 | Clip review via `NumberedClipsModal` + approve/reject |
| PATHB-2.5 | Unified client QA (replace thumbnail + final modals) |
| PATHB-2.6 | Store: client reject → `owner: smm` |
| PATHB-2.7 | `/client/all` scheduled list |
| PATHB-2.8 | Remove or gate deprecated review kinds |

**Done when:** Client UI wired per spec §4; `npm run build` passes.

---

## EPIC 3 — Editor portal

**Outcome:** Pre-split gate + submit deliverables splits batch; post-split production + QA fix.

| Story | What to build |
|-------|----------------|
| PATHB-3.1 | Editor board chrome |
| PATHB-3.2 | Pre-split: one gate card + `NumberedClipsModal` |
| PATHB-3.3 | Submit deliverables Drive → create tickets `1…n`, set `videoCount` |
| PATHB-3.4 | Post-split production UI (video, thumb, title, sync) |
| PATHB-3.5 | QA fix modal + sold comments on re-sync |
| PATHB-3.6 | `/editor/completed` |
| PATHB-3.7 | Clips-ready path: gate without client clip review |

**Done when:** Split + production UI implemented; `npm run build` passes.

---

## EPIC 4 — SMM portal

**Outcome:** Clips upload, SMM QA, client revision triage, schedule; no editor→client skip.

| Story | What to build |
|-------|----------------|
| PATHB-4.1 | SMM board chrome |
| PATHB-4.2 | Find clips / submit clips folder URL |
| PATHB-4.3 | Numbered clips view (reuse modal) |
| PATHB-4.4 | SMM QA via `QaCommentWorkspace` |
| PATHB-4.5 | Send back to editor (`QA flagged`) |
| PATHB-4.6 | `SmmClientRevisionPanel` |
| PATHB-4.7 | Schedule modal + per-video complete |
| PATHB-4.8 | Batch complete → `creditsDebited` + deduct `creditCost` |
| PATHB-4.9 | `/smm/completed` |

**Done when:** SMM UI wired per spec §6; `npm run build` passes.

---

## EPIC 5 — Admin

**Outcome:** Clients, credits, batches, pipeline, deadlines.

| Story | What to build |
|-------|----------------|
| PATHB-5.1 | Admin workspace + pipeline counts |
| PATHB-5.2 | Client detail page |
| PATHB-5.3 | Create batch with `creditCost` |
| PATHB-5.4 | Deadlines on SMM/Editor tickets |
| PATHB-5.5 | Client credits reflect debits in UI |

**Done when:** Admin flows implemented; `npm run build` passes.

---

## EPIC 6 — Store & state machine

**Outcome:** UI actions advance mock state (not only static seeds).

| Story | What to build |
|-------|----------------|
| PATHB-6.1 | `submitBatchIntake` → identifying / clips-ready |
| PATHB-6.2 | `submitSmmClipsFolder` → clip review ticket |
| PATHB-6.3 | `approveBatchClips` / reject |
| PATHB-6.4 | `submitEditorDeliverables` → split tickets |
| PATHB-6.5 | Production fields + readiness → SMM QA |
| PATHB-6.6 | SMM approve / flag → editor / client queue |
| PATHB-6.7 | Client approve / reject → SMM (never direct to editor) |
| PATHB-6.8 | Schedule all → batch complete → credits once |
| PATHB-6.9 | Canonical `stageLabel` / `demoStage` on every transition |

**Done when:** All store actions implemented; `npm run build` passes.

---

## EPIC 7 — Cleanup

**Outcome:** No legacy Path A UI; docs updated.

| Story | What to build |
|-------|----------------|
| PATHB-7.1 | Delete unused modals + dead routes |
| PATHB-7.2 | Update `path-b-ui-spec.md` §11 component status |
| PATHB-7.3 | *(Optional)* Playwright smoke |

**Done when:** Dead code removed; `npm run build` passes.

---

## Build order (strict)

```
EPIC 0 → EPIC 1 → EPIC 2 → EPIC 3 → EPIC 4 → EPIC 5 → EPIC 6 → EPIC 7
```

Epics 2–4 depend on Epic 1. Start Epic 6 after Epics 2–5 are Done.

---

## Definition of Done (per story)

- [ ] Matches `path-b-ui-spec.md` for that slice  
- [ ] Uses `adminWorkspace` store / types  
- [ ] `npm run build` passes  

---

## After build → fix mode

1. Confirm all epics are **Done** in the tracker above.  
2. Open [`test-ui.md`](./test-ui.md).  
3. Run fix flows there (not during build).

---

## Links

| Artifact | Path |
|----------|------|
| UI spec | `context/path-b-ui-spec.md` |
| Fix-mode test flows | `context/test-ui.md` |
| Mock catalog | `frontend/mockData/pathBDemoScenarios.ts` |
