# Client Dashboard — Feature Context

**Product:** Scale Brands Lab Studio (`studio.scalebrandslab.com`)  
**Audience:** External clients on a purchased content plan.

This document scopes what must exist on the **client dashboard** and related client flows. Pipeline stages and roles are defined in `context/problem-context.md`.

---

## Dashboard summary

| Area | Purpose |
|------|---------|
| Credits | Show remaining balance |
| Active batches / tasks | Own work in flight; status aligned to client-facing lifecycle |
| Create new video batch | Raw-footage URL path → clip approval |
| Request new batch idea | Idea-first path → idea list approval |
| Text review | Approve or reject thumbnail + video titles |
| Final video review | Approve or reject completed video + thumbnail |
| Our Work | Read-only scheduled / published output |

---

## Credits

- Surface **current credits remaining** prominently (e.g. header or summary card on the dashboard).

---

## Create a new video batch (raw footage first)

1. Client submits a **link to raw footage** (no in-platform file upload in v1).
2. After Social Media Manager (SMM) identifies clips, those clips are raised for **client review**.
3. Client **approves** or **rejects** each clip; **rejection requires a reason**.

---

## Request a new batch idea (idea first)

1. Client starts a request **without footage** (new batch / ideas only).
2. SMM researches and returns a list of video ideas.
3. Client **approves** the list → client proceeds to offline recording per ops flow.
4. Client **rejects** → can request more ideas; **optional reason** helps SMM iterate.

---

## Thumbnail title + video title review

- Client reviews **text assets** from SMM (thumbnail title + video title).
- **Approve** → batch advances to editing (Editor).
- **Reject** with **written reason** → SMM revises and resubmits.

---

## Final video review (video + thumbnail)

Client reviews the **finished video** and **thumbnail** before scheduling.

### Screen layout and behavior

- **Video region (top):** Embedded player for the deliverable; standard playback controls including **pause** (and scrub / seek as needed for positioning).
- **Feedback:**
  - **Timestamped feedback:** Client pauses (or seeks) at a moment in the video and **adds a comment tied to that playback time** — supports precise QA-style notes.
  - **General feedback:** Client can also submit **overall / non–time-coded feedback** (written note not tied to a single timestamp).

Outcome:

- **Approve** → item moves to SMM **scheduling** (then credits deduction per product rules).
- **Reject** → at least one of: timestamped comment(s), general note — aligns with pipeline handoff back to SMM QA / Editor resolution.

---

## Our Work

- **Read-only** view of videos **scheduled** with Scale Brands Lab.
- Show **upcoming go-live dates** and **platform links** when available.

---

## Access boundaries (client)

Clients **do not** use SMM-only or Editor-only tools (clip research from footage, internal QA tools on behalf of others, scheduling + credit deduction, admin account/credit management). They interact through **approvals, rejections with reasons where required, and read-only scheduled output**.

---

## Out of scope (platform-wide, affects client UX)

- In-app upload of video files (URLs only).
- In-app payment; credits adjusted by Admin after offline payment.
- Automated publishing to social platforms; scheduling is recorded manually with optional link.
