# Scale Brands Lab Studio — Problem Context

**Platform URL:** studio.scalebrandslab.com  
**Purpose:** Internal + client-facing platform for managing the end-to-end video editing lifecycle — from raw footage intake to final delivery and scheduling.

---

## Problem Being Solved

Scale Brands Lab converts long-form video content into short-form clips for platforms like YouTube Shorts, Instagram Reels, TikTok, and Facebook. The core operational challenge is coordinating a multi-step content pipeline across three distinct roles — Clients, Employees (Editors + Social Media Managers), and Admins — without a shared system of record.

Without Studio, the team relies on ad-hoc communication (Slack, email, WhatsApp) to manage approvals, feedback, QA flags, and scheduling. This creates:

- Lost or misrouted feedback from clients
- No visibility into where a piece of content is stuck
- No audit trail for what was approved, rejected, or revised
- No credit/billing tracking per client
- No unified place to manage deadlines for SMM and Editor tasks

Studio is the single platform that replaces all of this.

---

## Roles

### 1. Client
An external customer who has purchased a content plan. They interact with the platform to initiate content requests, approve clips or ideas, and perform a single unified QA review of the final video, thumbnail, and video title before scheduling.

### 2. Employee — Editor
An internal team member responsible for **video creation and editing only**. The Editor dashboard also surfaces clip identification and thumbnail creation so the team can coordinate who owns each step; assignment of that work is managed offline (see CSM coordination below).

### 3. Employee — Social Media Manager (SMM)
An internal team member who handles idea research, internal video QA, client revision routing, and final scheduling. Like the Editor, the SMM dashboard surfaces clip identification and thumbnail creation. The SMM may also supply the thumbnail and/or video title, or those may be produced by the Editor — whichever the internal team agrees on offline.

### 4. Admin
An internal operator who manages platform configuration: creating client accounts, setting credits, monitoring overall pipeline health, and assigning deadlines.

### Internal coordination (offline — CSM)
A Client Success Manager (CSM) coordinates **offline** which internal team member performs clip identification and thumbnail creation for a given batch. Studio exposes both steps on **SMM and Editor** screens; the platform does not enforce a single owner for those tasks. The Editor role in the product is strictly scoped to video editing responsibility.

---

## Content Pipeline Overview

There are two parallel entry points into a content batch. Both converge at **internal production**, then **SMM internal QA**, then a **unified client QA** screen.

```
PATH A — Idea-First
START
  → SMM: Research Video Ideas
  → Client Approval of Ideas
      NO → back to Research
      YES → Client Records the Video (offline)
          → Client Sends Footage
          → converges at INTERNAL PRODUCTION
          (client clip approval skipped — ideas were already locked in)

PATH B — Raw Footage First
START
  → Client Sends Raw Footage
  → Clip Identification (SMM and/or Editor — see CSM coordination)
  → Client Approval of Clips
      NO → back to Clip Identification
      YES → converges at INTERNAL PRODUCTION

── INTERNAL PRODUCTION (SMM + Editor; ownership per batch is offline) ──

Clip Identification (shown on SMM + Editor screens; Path A may skip)
  +
VIDEO (Editor — required)
  +
THUMBNAIL (SMM and/or Editor — required)
  +
VIDEO TITLE (SMM and/or Editor — required)

  → All three deliverables present
  → SMM: Internal Video QA
      NO (flags raised) → back to production (Editor and/or SMM resolve per CSM)
      YES ↓

── CLIENT QA (single screen: video + thumbnail + title) ──

CLIENT QA
      NO → revisions routed via SMM only → internal production → SMM QA → Client QA again
      YES ↓

VIDEO SCHEDULING (SMM: date, time, platform, link; mark completed)
  → Credits Deducted from Client

TERMINUS → Repeat Process (next batch)
```

**Gate before client QA:** A batch may enter client QA only when (1) the edited **video** is submitted by the Editor, (2) a **thumbnail** is submitted (by SMM or Editor), (3) a **video title** is submitted (by SMM or Editor), and (4) the SMM has completed internal QA on the video.

---

## Feature Requirements by Role

---

### Client Dashboard

#### Credits
- Display current credits remaining on the dashboard.

#### Create a New Video Batch
1. Client provides a link to raw footage.
2. SMM and/or Editor identify clips (offline CSM decides who leads); clips are raised for client approval.
3. Client can **Approve** or **Reject** each clip (rejection requires a reason).

#### Request a New Batch Idea
1. Client requests a new batch (no footage yet).
2. SMM researches and surfaces a list of video ideas.
3. Client can:
   - **Approve** the ideas list → proceeds to shooting phase
   - **Reject** and request more ideas, optionally providing a reason

#### Unified Client QA (video + thumbnail + title)
- Single review screen for the final **video**, **thumbnail**, and **video title** together.
- Can **Approve** → SMM may schedule and mark the batch completed
- Can **Reject** with feedback (e.g. timestamp-based flags on the video and/or general notes covering any of the three assets)
- Revisions are **not** sent directly to the Editor by the client; all revision requests flow **via SMM**, who coordinates internal rework before the package returns to client QA

#### Our Work
- A read-only view of all videos that have been scheduled with Scale Brands Lab.
- Shows upcoming go-live dates and scheduled platform links where available.

---

### Admin Dashboard

#### Client Management
- Create login credentials (ID + password) for new clients.
- Set or top-up credits for a client upon payment.

#### Pipeline Overview
- A bird's-eye view of all active processes, broken down by stage:
  - How many processes are currently with a Client (awaiting client action)
  - How many are currently with the SMM
  - How many are currently with the Editor
- Ability to add or edit a deadline on any task assigned to an SMM or Editor.

---

### Employee Dashboard — Editor

#### Clip Identification (shared with SMM)
- Clip identification appears on the Editor screen as well as the SMM screen.
- Who performs identification for a given batch is decided offline by the CSM; the platform does not assign a single owner.

#### Video Editing
- Primary Editor responsibility: create and edit the final **video** only.
- Submit the video when ready for internal SMM QA (thumbnail and video title may still be in progress by either role).

#### Thumbnail Creation (shared with SMM)
- Thumbnail creation appears on the Editor screen as well as the SMM screen.
- Editor may supply the thumbnail when agreed offline; otherwise the SMM supplies it.

#### Video Title (shared with SMM)
- Video title entry appears on the Editor screen as well as the SMM screen.
- Editor may supply the title when agreed offline; otherwise the SMM supplies it.

#### Internal QA follow-up
- When SMM raises internal QA flags on the video, Editor resolves video issues and resubmits.
- Thumbnail/title changes from internal or client revision cycles are coordinated through SMM, not directly from the client to the Editor.

---

### Employee Dashboard — Social Media Manager

#### Clip Identification (shared with Editor)
- When raw footage is received, identify clips (or support Editor-led identification per CSM).
- Raise identified clips for client approval on the raw-footage path.

#### Idea Research (New Batch Path)
- When a client requests new batch ideas (or rejects a previous list), research and compile a list of video ideas.
- Can be prompt-assisted internally.
- Submit the ideas list for client approval.

#### Thumbnail Creation (shared with Editor)
- Thumbnail creation appears on the SMM screen as well as the Editor screen.
- SMM may supply the thumbnail when agreed offline; otherwise the Editor supplies it.

#### Video Title (shared with Editor)
- Video title entry appears on the SMM screen as well as the Editor screen.
- SMM may supply the title when agreed offline; otherwise the Editor supplies it.

#### Internal Video QA
- QA the Editor’s **video** before the batch is eligible for client QA.
- Can raise flags with timestamps or general notes on the video.
- Client QA is unlocked only when video, thumbnail, and video title are all present **and** internal video QA is approved.

#### Client revision routing
- All client revision requests are received and triaged by SMM.
- SMM coordinates rework with Editor and/or internal thumbnail/title owners, then re-runs internal QA as needed before sending back to unified client QA.

#### Video Scheduling
- Once a client approves the unified QA package:
  - Schedule the video with date, time, and target platform.
  - Add the published link if available.
  - Mark the batch **completed**.
  - Deduct the appropriate number of credits from the client's account.

---

## Task Status Lifecycle

Each piece of content moves through a defined set of statuses. A task is always owned by exactly one role at a time for workflow routing; clip identification and thumbnail ownership may be shared in the UI while CSM assigns work offline.

```
── PATH A (Idea-First) ──
IDEA_RESEARCH (SMM)
  → IDEA_REVIEW (client)
      REJECTED → back to IDEA_RESEARCH
      APPROVED → CLIENT_RECORDING (offline — client shoots video)
          → CLIENT_SENDS_FOOTAGE → joins shared pipeline at INTERNAL_PRODUCTION
          (client clip review skipped — ideas were already approved)

── PATH B (Raw Footage First) ──
RAW_FOOTAGE_RECEIVED
  → CLIP_IDENTIFICATION (SMM and/or Editor — both screens; CSM offline)
  → CLIP_REVIEW (client)
      REJECTED → back to CLIP_IDENTIFICATION
      APPROVED → joins shared pipeline at INTERNAL_PRODUCTION

── INTERNAL PRODUCTION ──
INTERNAL_PRODUCTION
  → Video submitted (Editor)
  → Thumbnail submitted (SMM and/or Editor)
  → Video title submitted (SMM and/or Editor)
  → SMM_INTERNAL_QA (SMM — video only)
      QA_FLAGGED → back to INTERNAL_PRODUCTION (SMM coordinates fixes)
      QA_APPROVED → eligible for client QA when all three deliverables exist

── CLIENT QA ──
CLIENT_QA (client — video + thumbnail + title, one screen)
      CLIENT_REJECTED → REVISION_VIA_SMM (SMM) → INTERNAL_PRODUCTION → SMM_INTERNAL_QA → CLIENT_QA
      CLIENT_APPROVED ↓

SCHEDULING (SMM — date, time, platform, link)
  → COMPLETED + credits deducted
```

---

## Key Data Entities

| Entity | Description |
|---|---|
| Client | External account with credits, linked to multiple batches |
| Batch | A unit of work — one content cycle from idea/footage to final delivery |
| Task | A step within a Batch, assigned to a role, with a status and optional deadline |
| Clip | A candidate short-form clip surfaced from raw footage (SMM and/or Editor) |
| VideoAsset | Final edited video, submitted by Editor |
| ThumbnailAsset | Thumbnail image, submitted by SMM and/or Editor |
| VideoTitle | Title copy for the short, submitted by SMM and/or Editor |
| QAFlag | A timestamp-based or general note raised by SMM during internal video QA or surfaced from client revision |
| ClientQAPackage | Unified client review bundle: VideoAsset + ThumbnailAsset + VideoTitle |
| ScheduledVideo | A client-approved, completed video with platform, date/time, and link |
| Credit | A balance unit assigned to a client by Admin upon payment |

---

## Access Control

| Feature | Client | Editor | SMM | Admin |
|---|---|---|---|---|
| View own batch status | ✓ | | | ✓ |
| Approve / Reject clips | ✓ | | | |
| Approve / Reject ideas | ✓ | | | |
| Unified QA (video + thumbnail + title) | ✓ | | | |
| View scheduled work | ✓ | | | ✓ |
| Clip identification (UI) | | ✓ | ✓ | |
| Research + submit ideas | | | ✓ | |
| Submit / edit video | | ✓ | | |
| Submit thumbnail (UI) | | ✓ | ✓ | |
| Submit video title (UI) | | ✓ | ✓ | |
| Internal video QA | | | ✓ | |
| Triage client revisions | | | ✓ | |
| Schedule videos + mark completed + deduct credits | | | ✓ | |
| Resolve internal video QA flags (video) | | ✓ | | |
| Create client accounts | | | | ✓ |
| Set client credits | | | | ✓ |
| View pipeline overview | | | | ✓ |
| Assign deadlines to tasks | | | | ✓ |

---

## Authentication

- Single login page with role-based routing post-authentication.
- Three login types: Client, Employee (sub-type: Editor or SMM), Admin.
- Credentials for Clients are created and managed by Admin.

---

## Out of Scope (Current Version)

- Direct file uploads within the platform (footage links are external URLs)
- Payment processing (credits are set manually by Admin after offline payment)
- Automated platform publishing (scheduling is manual entry with optional link)
- Multi-language support
- In-platform assignment of clip identification or thumbnail ownership (handled offline by CSM)
