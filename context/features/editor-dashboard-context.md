# Editor Dashboard — Feature Context

**Product:** Scale Brands Lab Studio (`studio.scalebrandslab.com`)  
**Audience:** Internal employees in the **Editor** role (video editing and thumbnail creation).

This document scopes what must exist on the **editor dashboard** and related editor flows. Pipeline stages, roles, and shared entities are defined in `context/problem-context.md`.

---

## Dashboard summary

| Area | Purpose |
|------|---------|
| Task queue | Work assigned to the editor; status aligned to `EDITING_IN_PROGRESS` and return loops from SMM QA |
| Active editing | Produce edited video + thumbnail per task; submit to SMM for QA |
| QA resolution | Receive SMM flags (timestamped and/or general); fix and resubmit for re-review |

---

## Task queue

- Editors **receive assigned tasks** from the operational pipeline:
  - **Raw footage** (for **clip creation**), or
  - **Approved clips** (for **full editing** after upstream approvals, including post–text-review work in the shared pipeline).
- For each task, the dashboard should surface what the editor needs to act: batch/task identity, **deadline** if set by Admin, and **status** (e.g. aligned to `EDITING_IN_PROGRESS` and QA return loops).
- Editors **do not** own SMM responsibilities (client-facing clip surfacing from footage, idea research, text assets, QA on behalf of workflow stages they do not own, scheduling + credits), **client** approvals, or **admin** configuration — see Access boundaries below.

---

## Video editing + thumbnail creation

- For each task in **editing**, the editor produces:
  - The **edited short-form video** deliverable, and
  - The **thumbnail** (per product and assignment rules).
- Work is **submitted to the Social Media Manager** for **video + thumbnail QA** (`SMM_QA`), not directly to the client.

---

## QA resolution

When SMM completes QA:

- If issues are found, SMM raises **QA flags** — either **timestamp-based** (specific moments in the video) or **general notes**.
- The editor **receives those flags**, addresses them in the edit/thumbnail, and **resubmits** for SMM **re-review**.
- Pipeline alignment: `QA_FLAGGED` → back to **`EDITING_IN_PROGRESS`** (editor) until SMM approves QA again (`QA_APPROVED` → `CLIENT_FINAL_REVIEW` for the client).

---

## Access boundaries (editor)

Editors **do not** use client approval surfaces, SMM-only flows (clip identification from raw footage, idea research, text asset authoring for client review, final scheduling, credit deduction), or **admin** tools (client account creation, credit top-ups, global pipeline overview, assigning deadlines to arbitrary tasks — unless product later assigns a narrower “own task” rule; default scope follows `problem-context.md`).

Editors **do** perform **editing + thumbnail work**, **submit to SMM QA**, and **resolve QA flags** until SMM passes QA toward client final review.

---

## Out of scope (platform-wide, affects editor UX)

- In-app upload of client video files (footage continues to be referenced via URLs / external links where applicable).
- In-app payment or credit adjustment (Admin).
- Automated publishing; scheduling and links are recorded by SMM after client final approval.
