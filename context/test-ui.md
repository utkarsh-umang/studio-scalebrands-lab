# Path B — Fix Mode Test Flows

**Use this document only in fix mode** — after **all epics (0–7)** are Done in [`path-b-build-plan.md`](./path-b-build-plan.md).

| Phase | Document | What you do |
|-------|----------|-------------|
| **Build** | `path-b-build-plan.md` | Implement epics; `npm run build` only — **do not use this file** |
| **Fix** | `test-ui.md` (this file) | Walk flows, log bugs, fix, re-run targeted flows |

---

## Fix mode workflow

```
1. First pass   → Run FLOW-1, then FLOW-2 (read-only; find what's broken)
2. Log issues   → Issue log table at bottom of this doc
3. Fix code     → One issue or one area at a time
4. Re-check     → Re-run ONLY the flow that covers that screen (not the full doc)
5. Full pass    → When issue log is empty, run FLOW-3 … FLOW-7 once
```

**Rules (avoid loops)**

1. **FLOW-1 and FLOW-2** never approve, reject, or submit — open UI, close modals. Safe to repeat anytime.  
2. **FLOW-3 … FLOW-7** change mock state — run **once per fresh batch**; record batch id; do not re-run the same mutating flow on the same batch.  
3. After a fix, re-run **only** the flow tied to that screen (see “Covers” column in issue log).  
4. Stuck in bad data? Use a different seeded batch or Admin → create new batch.

---

## Setup

```bash
cd frontend && npm run dev
```

Password for all: `demo1234`

| Role | Email |
|------|--------|
| Client | `client@scalebrandslab.demo` |
| Editor | `editor@scalebrandslab.demo` |
| SMM | `smm@scalebrandslab.demo` |
| Admin | `admin@scalebrandslab.demo` |

**Spec reference:** [`path-b-ui-spec.md`](./path-b-ui-spec.md)

---

## Seeded batches (where to open each screen)

| Batch | Title | Use in flows |
|-------|-------|----------------|
| `b-new` | July Deep Dive | Intake, empty kanban |
| `b-identifying` | May Podcast — identifying | SMM find clips |
| `b-clips` | June Podcast | Client clip approval (`v-clips-gate`) |
| `b-clips-ready` | August Clips Pack | Clips-ready gate (`v-clips-ready-gate`) |
| `b-editing` | April B-Roll Pack | Pre-split gate (`v-editing-gate`) |
| `b-pipeline` | Q2 Tech Breakdown | Post-split matrix (5 videos) |
| `b-schedule` | Product Launch Series | Scheduling (`v-sc-1` … `v-sc-3`) |
| `b-archive` | March Compilation | Completed / credits debited |

**`b-pipeline` videos**

| Video | Stage to verify |
|-------|-----------------|
| `v-p-1` | SMM QA |
| `v-p-2` | Editor fix + sold comments |
| `v-p-3` | Client unified QA |
| `v-p-4` | Production — missing thumbnail |
| `v-p-5` | Production — missing title |

---

# First pass — find issues (read-only)

Run these once when you enter fix mode. Do not click Approve / Reject / Submit.

---

## FLOW-1 — Full snapshot tour

**Covers:** All roles, all seeded batch stages, main routes.

### A — Client (`/client/board`)

| Step | Batch / route | Open / check | OK? | Issue # |
|------|---------------|--------------|-----|---------|
| 1 | — | Credits bar | ⬜ | |
| 2 | — | Attention strip (click → modal opens) | ⬜ | |
| 3 | — | Batch folder tabs switch | ⬜ | |
| 4 | `b-new` | Intake card (podcast vs clips-ready; no ideas) | ⬜ | |
| 5 | `b-new` | Zero kanban cards | ⬜ | |
| 6 | `b-identifying` | No kanban cards | ⬜ | |
| 7 | `b-clips` | One card → clip modal → sidebar 1…n + player → close | ⬜ | |
| 8 | `b-clips-ready` | One gate card | ⬜ | |
| 9 | `b-editing` | One gate card (not multiple videos) | ⬜ | |
| 10 | `b-pipeline` | Five cards; open each modal → close | ⬜ | |
| 11 | `b-schedule` | Scheduling cards visible | ⬜ | |
| 12 | `/client/all` | Completed / scheduled list (`b-archive`) | ⬜ | |

### B — Editor (`/editor/board`)

| Step | Batch | Open / check | OK? | Issue # |
|------|-------|--------------|-----|---------|
| 13 | `b-editing` | Gate → clips modal → submit deliverables control visible → close | ⬜ | |
| 14 | `b-pipeline` | `v-p-2` QA fix; `v-p-4` missing thumb; `v-p-5` missing title | ⬜ | |
| 15 | `/editor/completed` | Archive loads | ⬜ | |

### C — SMM (`/smm/board`)

| Step | Batch | Open / check | OK? | Issue # |
|------|-------|--------------|-----|---------|
| 16 | `b-identifying` | Find clips / upload UI | ⬜ | |
| 17 | `b-pipeline` | `v-p-1` SMM QA workspace | ⬜ | |
| 18 | `b-schedule` | Schedule modal | ⬜ | |
| 19 | `/smm/completed` | Archive loads | ⬜ | |

### D — Admin

| Step | Route | Open / check | OK? | Issue # |
|------|-------|--------------|-----|---------|
| 20 | `/admin` | Pipeline / clients | ⬜ | |
| 21 | `/admin/clients/c-1` | Detail, credits, batches | ⬜ | |
| 22 | — | Create batch → `creditCost` field | ⬜ | |

**End FLOW-1.** Log every ❌ in the issue table.

---

## FLOW-2 — `b-pipeline` matrix (read-only)

**Covers:** Post-split deliverables, readiness, QA, sold comments.

| Step | Video | Check | OK? | Issue # |
|------|-------|-------|-----|---------|
| 1 | `v-p-1` | Deliverable summary: raw, clip, video, thumb, title | ⬜ | |
| 2 | `v-p-1` | SMM QA: player + comments | ⬜ | |
| 3 | `v-p-2` | Sold comment visually distinct from active | ⬜ | |
| 4 | `v-p-2` | Editor QA fix modal | ⬜ | |
| 5 | `v-p-3` | **Unified** client QA (not separate thumb/final modals) | ⬜ | |
| 6 | `v-p-4` | Readiness: thumbnail missing | ⬜ | |
| 7 | `v-p-5` | Readiness: title missing | ⬜ | |
| 8 | any | Drive Sync runs without error | ⬜ | |

**End FLOW-2.**

---

# Fix loop

For each issue in the log:

1. Fix in code.  
2. Re-run the **Covers** flow from the table below (not FLOW-1 entirely unless the bug was global).  
3. Mark issue fixed when that step passes.

| If you fixed… | Re-run |
|---------------|--------|
| Login / routing | FLOW-0 |
| Client board / intake / clips | FLOW-1 steps 4–7, or FLOW-2 if `b-pipeline` client |
| Client unified QA | FLOW-2 step 5 |
| Editor split / production | FLOW-1 steps 13–14, or FLOW-3 step 4 |
| SMM QA / schedule | FLOW-1 steps 16–18, or FLOW-2 step 2 |
| Store / transitions | FLOW-3, FLOW-4, or FLOW-5 (mutating) |
| Credits | FLOW-6 |
| Legacy UI still visible | FLOW-7 |

---

# Final pass — behavior (mutating)

Run **only after** FLOW-1/2 issues are fixed (or log remaining as known). Use **new batches** for each flow.

Record batch ids so you do not re-run on the same data.

---

## FLOW-0 — Auth smoke

| Step | Action | OK? |
|------|--------|-----|
| 1 | Client login → `/client/board` | ⬜ |
| 2 | Editor login → `/editor/board` | ⬜ |
| 3 | SMM login → `/smm/board` | ⬜ |
| 4 | Admin login → `/admin` | ⬜ |

---

## FLOW-3 — Podcast path (happy path)

| Step | Role | Action | Expected | OK? |
|------|------|--------|----------|-----|
| 1 | Client | **Fresh batch** → submit podcast URL | Identifying | ⬜ |
| 2 | SMM | Upload clips Drive URL | Client clip review card | ⬜ |
| 3 | Client | Approve clips | Pre-split / gate | ⬜ |
| 4 | Editor | Submit deliverables Drive | n kanban cards | ⬜ |
| 5 | Editor/SMM | Index **1**: video + thumb + title | Readiness complete | ⬜ |
| 6 | SMM | SMM QA → approve | Client queue | ⬜ |
| 7 | Client | Client QA → approve | Scheduling | ⬜ |
| 8 | SMM | Schedule → complete index 1 | Done | ⬜ |

**Batch id:** _______________

---

## FLOW-4 — Clips-ready path

| Step | Role | Action | Expected | OK? |
|------|------|--------|----------|-----|
| 1 | Client | **Fresh batch** → clips-ready Drive only | Gate, no clip review | ⬜ |
| 2 | Editor | Submit deliverables | n cards | ⬜ |
| 3 | — | FLOW-3 steps 5–8 for one index | Same tail | ⬜ |

**Batch id:** _______________

---

## FLOW-5 — QA routing (no skip SMM)

| Step | Role | Action | Expected | OK? |
|------|------|--------|----------|-----|
| 1 | SMM | Comment → send to editor | QA flagged | ⬜ |
| 2 | Editor | Re-upload / sync | Prior comments sold | ⬜ |
| 3 | SMM | Re-QA → approve | Client queue | ⬜ |
| 4 | Client | Request changes | Owner **SMM** | ⬜ |
| 5 | SMM | Triage + fix path | Internal | ⬜ |
| 6 | SMM | Re-approve | Client sees video again | ⬜ |
| 7 | — | Editor never sends straight to client | — | ⬜ |

---

## FLOW-6 — Credits (batch complete)

| Step | Action | Expected | OK? |
|------|--------|----------|-----|
| 1 | Note client credits before | e.g. 42 | ⬜ |
| 2 | Complete **all** videos in small batch (n=2) | All done | ⬜ |
| 3 | Credits − `creditCost` once; `creditsDebited` | Once only | ⬜ |

---

## FLOW-7 — Regression (must not exist)

| Step | Check | OK? |
|------|-------|-----|
| 1 | No “Request ideas” on intake | ⬜ |
| 2 | No client idea / text / thumbnail-only flows | ⬜ |
| 3 | Client reject → SMM, not editor | ⬜ |
| 4 | No in-app timestamp picker on QA | ⬜ |

---

# Issue log

| # | Flow / step | Screen | What's wrong | Covers (re-run) | Fixed? |
|---|-------------|--------|--------------|-----------------|--------|
| 1 | | | | | ⬜ |
| 2 | | | | | ⬜ |
| 3 | | | | | ⬜ |
| 4 | | | | | ⬜ |
| 5 | | | | | ⬜ |

**Fix mode complete when:** issue log empty (or known issues documented) and FLOW-3 through FLOW-7 pass once.

---

# Screen index (quick lookup while fixing)

| Screen | How to open | Role |
|--------|-------------|------|
| Login | `/login` | — |
| Client board | `/client/board` | Client |
| Intake card | `b-new` | Client |
| Clip review modal | `b-clips` → `v-clips-gate` | Client |
| Unified client QA | `b-pipeline` → `v-p-3` | Client |
| All work | `/client/all` | Client |
| Editor board | `/editor/board` | Editor |
| Clips + submit deliverables | `b-editing` → gate | Editor |
| Production / per-card | `b-pipeline` cards | Editor / SMM |
| Editor QA fix | `v-p-2` | Editor |
| Editor completed | `/editor/completed` | Editor |
| SMM board | `/smm/board` | SMM |
| Find clips | `b-identifying` | SMM |
| SMM QA | `v-p-1` | SMM |
| Client revision triage | After client reject | SMM |
| Schedule | `b-schedule` | SMM |
| SMM completed | `/smm/completed` | SMM |
| Admin workspace | `/admin` | Admin |
| Client detail | `/admin/clients/c-1` | Admin |
