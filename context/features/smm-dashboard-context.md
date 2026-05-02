# SMM Dashboard — Feature Context

**Product:** Scale Brands Lab Studio (`studio.scalebrandslab.com`)  
**Audience:** Internal employees in the **Social Media Manager (SMM)** role.

This document scopes what must exist on the **SMM (employee) dashboard** and related SMM-only flows. Pipeline stages, statuses, roles, and entities are defined in `context/problem-context.md`.

---

## Dashboard summary

| Area | Purpose |
|------|---------|
| Task queue / active work | Batches and tasks owned by SMM; status aligned to internal lifecycle (idea research, clip ID, text creation, QA, scheduling) |
| Clip identification | Raw-footage path: surface clips from client footage for client approval |
| Idea research | Idea-first path: compile and submit video ideas for client approval |
| Text creation | Thumbnail title + video title; submit for client review; iterate on rejection |
| Video + thumbnail QA | Review Editor deliverables; raise timestamp or general flags; approve to send to client final review |
| Video scheduling | After client final approval: date, time, platform, optional link; deduct credits |

---

## Task queue / active work

- SMM sees **work assigned to them** across batches: stages where the **next action is SMM-owned** (per `problem-context.md` lifecycle).
- Should align to statuses such as **IDEA_RESEARCH**, **CLIP_IDENTIFICATION**, **TEXT_CREATION**, **SMM_QA**, and **SCHEDULING** (and transitions between them).
- **Deadlines** on SMM tasks may be set by Admin; the dashboard should surface **due dates** where the product model attaches them to tasks.

---

## Clip identification (raw footage first)

1. When **raw footage** is received (client provides a URL — no in-platform upload in v1), SMM **identifies candidate clips** from the material.
2. SMM **raises** those clips for **client review** (approve / reject per clip with reason on reject).
3. If the client **rejects**, SMM returns to **clip finding** and resubmits until approved.

---

## Idea research (idea first)

1. When a client **requests a new batch without footage** (or **rejects** a prior ideas list), SMM **researches** and compiles a **list of video ideas**.
2. Research may be **prompt-assisted** internally (product decision on tooling).
3. SMM **submits** the list for **client approval**; on reject, iterate (optional client reason helps refinement).

---

## Thumbnail title + video title creation

- After **clips are approved** (footage path) or **footage is confirmed** on the idea-first path (client recorded and sent footage — converges at text creation per pipeline), SMM creates the **thumbnail title** and **video title** pair (**TextAsset** in the entity model).
- Creation may be **prompt-assisted** internally.
- SMM **submits** to the client for **text review**; on **reject** with written reason, SMM **revises** and resubmits.

---

## Video + thumbnail QA

- SMM reviews the **Editor’s** completed **video** and **thumbnail** after **editing** (`EDITING_IN_PROGRESS` → `SMM_QA`).
- SMM can **raise QA flags**:
  - **Timestamp-based** notes on the video, and/or
  - **General** written notes.
- **QA flagged** → work returns to **Editor** for resolution; Editor resubmits → SMM **re-reviews**.
- When satisfied, SMM **approves** (**QA_APPROVED**) and the batch moves to **client final review** (`CLIENT_FINAL_REVIEW`).
- If the **client rejects** the final deliverable, the pipeline can return to **SMM QA** / Editor per shared lifecycle — SMM **re-reviews** and may **re-raise** with the Editor as needed.

---

## Video scheduling

- After the client **approves** the final video (**CLIENT_APPROVED**), SMM **schedules** the deliverable:
  - **Date** and **time**
  - **Target platform**
  - **Published link** if available (manual entry)
- SMM (or the product flow) **deducts** the appropriate **credits** from the client’s balance.
- Terminal state: **scheduled** output (feeds **Our Work** on the client side and operational reporting).

---

## Access boundaries (SMM)

SMMs **do not** act as **Clients** (they do not approve/reject on behalf of clients or consume client-only UX). They **do not** perform **Admin** duties (creating client logins, setting credits, global pipeline admin views). They **do not** own **Editor** execution: they **do not** produce the primary edited video file or thumbnail asset — they **QA**, **coordinate text**, **identify clips / ideas**, and **schedule** after client final approval.

---

## Out of scope (platform-wide, affects SMM UX)

- In-app upload of video files (footage remains **URL-based**).
- In-app payment; credit balance is adjusted by **Admin** after offline payment (SMM triggers **deduction** at scheduling per product rules, not payment processing).
- **Automated** publishing to social platforms; scheduling is **recorded** in Studio with optional link.
