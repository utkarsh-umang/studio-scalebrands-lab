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
An external customer who has purchased a content plan. They interact with the platform to initiate content requests, review intermediate outputs, and give final approvals.

### 2. Employee — Editor
An internal team member responsible for video editing and thumbnail creation. They receive approved clips or raw footage and produce the final edited video and thumbnail, then submit for SMM QA.

### 3. Employee — Social Media Manager (SMM)
An internal team member who handles clip identification, idea research, text creation (thumbnail title + video title), QA of the Editor's work, and final scheduling once the client approves.

### 4. Admin
An internal operator who manages platform configuration: creating client accounts, setting credits, monitoring overall pipeline health, and assigning deadlines.

---

## Content Pipeline Overview

There are two parallel entry points into a content batch. Both converge at the Text Creation step.

```
PATH A — Idea-First
START
  → SMM: Research Video Ideas
  → Client Approval of Ideas
      NO → back to Research
      YES → Client Records the Video (offline)
          → Client Sends Footage → converges at TEXT CREATION directly
          (clip identification skipped — ideas were already locked in)

PATH B — Raw Footage First
START
  → Client Sends Raw Footage
  → SMM: Find Clips from Existing Material
  → Client Approval of Clips
      NO → back to Clip Finding
      YES → converges at TEXT CREATION

── SHARED PIPELINE (after convergence) ──

TEXT CREATION (SMM: thumbnail title + video title)
  → Client Approval
      NO → back to Text Creation (SMM redoes)
      YES ↓

VIDEO EDITING + THUMBNAIL CREATION (Editor)
  → SMM Video Audit / QA
      NO (flags raised) → back to Video Editing (Editor resolves)
      YES ↓

CLIENT FINAL APPROVAL
      NO → back to SMM Video Audit (SMM re-reviews / re-raises)
      YES ↓

VIDEO SCHEDULING (SMM marks date, time, platform, link)
  → Credits Deducted from Client

TERMINUS → Repeat Process (next batch)
```

---

## Feature Requirements by Role

---

### Client Dashboard

#### Credits
- Display current credits remaining on the dashboard.

#### Create a New Video Batch
1. Client provides a link to raw footage.
2. SMM identifies clips and raises them for client approval.
3. Client can **Approve** or **Reject** each clip (rejection requires a reason).

#### Request a New Batch Idea
1. Client requests a new batch (no footage yet).
2. SMM researches and surfaces a list of video ideas.
3. Client can:
   - **Approve** the ideas list → proceeds to shooting phase
   - **Reject** and request more ideas, optionally providing a reason

#### Thumbnail Title + Video Title Review
- Client reviews the text assets produced by SMM.
- Can **Approve** → moves to editing step
- Can **Reject** with a written reason → SMM redoes the text

#### Final Thumbnail + Video Review
- Client reviews the completed video and thumbnail.
- Can **Approve** → video moves to upload/scheduling
- Can **Reject** with either:
  - A timestamp-based flag on the video (QA comment at a specific point in the video)
  - A general written note

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

#### Task Queue
- Receive assigned tasks: either raw footage (for clip creation) or approved clips (for full editing).
- For each task: create the edited video and thumbnail.
- Submit completed work to SMM for QA.

#### QA Resolution
- If SMM raises QA flags (with timestamps or general notes), Editor receives them and resolves the issues.
- Resubmit to SMM for re-review after resolution.

---

### Employee Dashboard — Social Media Manager

#### Clip Identification (Raw Footage Path)
- When raw footage is received from a client, identify the best clips.
- Raise the identified clips for client approval.

#### Idea Research (New Batch Path)
- When a client requests new batch ideas (or rejects a previous list), research and compile a list of video ideas.
- Can be prompt-assisted internally.
- Submit the ideas list for client approval.

#### Thumbnail Title + Video Title Creation
- Once clips are approved or raw footage is confirmed, create the thumbnail title and video title.
- Prompt-assisted internally.
- Submit to client for approval.
- If rejected, redo the text based on the client's feedback and resubmit.

#### Video + Thumbnail QA
- Review the Editor's completed video and thumbnail.
- Can raise flags with timestamps or general notes.
- Once satisfied, approve and send to the client for final review.

#### Video Scheduling
- Once a client approves the final video:
  - Mark the video as scheduled with the date, time, and target platform.
  - Add the published link if available.
  - Deduct the appropriate number of credits from the client's account.

---

## Task Status Lifecycle

Each piece of content moves through a defined set of statuses. A task is always owned by exactly one role at a time.

```
── PATH A (Idea-First) ──
IDEA_RESEARCH (SMM)
  → IDEA_REVIEW (client)
      REJECTED → back to IDEA_RESEARCH
      APPROVED → CLIENT_RECORDING (offline — client shoots video)
          → CLIENT_SENDS_FOOTAGE → joins shared pipeline at TEXT_CREATION directly
          (no clip identification needed — ideas were already approved)

── PATH B (Raw Footage First) ──
RAW_FOOTAGE_RECEIVED
  → CLIP_IDENTIFICATION (SMM)
  → CLIP_REVIEW (client)
      REJECTED → back to CLIP_IDENTIFICATION
      APPROVED → joins shared pipeline

── SHARED PIPELINE ──
TEXT_CREATION (SMM)
  → TEXT_REVIEW (client)
      REJECTED → back to TEXT_CREATION
      APPROVED ↓

EDITING_IN_PROGRESS (Editor)
  → SMM_QA (SMM)
      QA_FLAGGED → back to EDITING_IN_PROGRESS (Editor resolves flags)
      QA_APPROVED ↓

CLIENT_FINAL_REVIEW (client)
      CLIENT_REJECTED → back to SMM_QA (SMM re-reviews / re-raises with Editor)
      CLIENT_APPROVED ↓

SCHEDULING (SMM — date, time, platform, link)
  → SCHEDULED + credits deducted
```

---

## Key Data Entities

| Entity | Description |
|---|---|
| Client | External account with credits, linked to multiple batches |
| Batch | A unit of work — one content cycle from idea/footage to final delivery |
| Task | A step within a Batch, assigned to a role, with a status and optional deadline |
| Clip | A candidate short-form clip surfaced by SMM from raw footage |
| TextAsset | Thumbnail title + video title pair, linked to a Batch |
| QAFlag | A timestamp-based or general note raised by SMM during QA |
| ScheduledVideo | A finalized, approved video with platform, date/time, and link |
| Credit | A balance unit assigned to a client by Admin upon payment |

---

## Access Control

| Feature | Client | Editor | SMM | Admin |
|---|---|---|---|---|
| View own batch status | ✓ | | | ✓ |
| Approve / Reject clips | ✓ | | | |
| Approve / Reject ideas | ✓ | | | |
| Approve / Reject text assets | ✓ | | | |
| Approve / Reject final video | ✓ | | | |
| View scheduled work | ✓ | | | ✓ |
| Identify clips from footage | | | ✓ | |
| Research + submit ideas | | | ✓ | |
| Create text assets | | | ✓ | |
| Perform video + thumbnail QA | | | ✓ | |
| Schedule videos + deduct credits | | | ✓ | |
| Edit + create thumbnails | | ✓ | | |
| Resolve QA flags | | ✓ | | |
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