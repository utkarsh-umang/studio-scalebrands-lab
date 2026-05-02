# Admin Dashboard — Feature Context

**Product:** Scale Brands Lab Studio (`studio.scalebrandslab.com`)  
**Audience:** Internal operators who configure the platform and monitor pipeline health.

This document scopes what must exist on the **admin dashboard** and related admin-only flows. Pipeline stages, roles, and entities are defined in `context/problem-context.md`.

---

## Dashboard summary

| Area | Purpose |
|------|---------|
| Client management | Create client logins; set or top-up credits after payment |
| Pipeline overview | Cross-tenant view of active work by stage (client / SMM / Editor) |
| Deadlines | Add or edit deadlines on tasks assigned to SMM or Editor |

---

## Client management

- **Create client accounts:** Issue login credentials (**ID + password**) for new clients. Clients do not self-register; Admin provisions access.
- **Credits:** **Set** initial balance or **top up** credits when the client pays (offline payment — no in-app payment in v1).

---

## Pipeline overview

- **Bird’s-eye view** of all **active** batches/processes, grouped by **who owns the next action**:
  - Count (or list, per product decision) of items **with the Client** (awaiting client approval or input).
  - Count (or list) **with the SMM** (SMM-owned steps).
  - Count (or list) **with the Editor** (editing / QA resolution owned by Editor).
- Purpose: surface **where work is stuck** and overall **pipeline health** without drilling into every batch by default.

---

## Deadlines

- **Assign or edit a deadline** on any **task** that is assigned to an **SMM** or **Editor** (per product rules for which task types support deadlines).
- Supports operational planning and SLA-style visibility alongside the pipeline overview.

---

## Access boundaries (admin)

Admins **do not** replace Clients, SMMs, or Editors in the creative workflow: they **do not** approve clips, ideas, text, or final video on behalf of clients; they **do not** perform clip research, editing, QA, or scheduling. They **provision accounts and credits**, **observe pipeline state**, and **set deadlines** on internal tasks.

---

## Out of scope (platform-wide, affects admin UX)

- In-app payment processing; credits reflect **manual** Admin adjustment after offline payment.
- Automated publishing; scheduling and links are entered by SMM, not Admin.
- Direct file uploads in v1 (same as other roles — footage remains URL-based in the product model).
