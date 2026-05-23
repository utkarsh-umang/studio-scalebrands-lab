# Storage reconcile checklist

**Canonical doc:** [00-storage-design.md](./00-storage-design.md)  
**Generated:** 2026-05-23 (consolidated B0–B11)  
**Reconciled:** 2026-05-23 — all epic plans patched

## Summary

- Epics reviewed: **B0–B11** (B11 = no new tables; references canonical doc)
- Conflicts resolved: **10** (see §1 of canonical doc)
- Deferred decisions: **5** (D1–D5 in canonical doc)
- Storage choice: **Postgres only** for Path B v1; **`qa_comments`** table; **no Mongo/Redis** required

## Draft inventory (pre-consolidation)

| Entity / table (draft) | Proposed in epics | Canonical name |
|------------------------|-------------------|----------------|
| `users` | B0, B1 | `users` |
| `client_profiles` | B0, B1 | `client_profiles` |
| `batches` | B0–B5, B9 | `batches` |
| `video_tickets` | B0–B10 | `video_tickets` |
| `qa_comments` | B4 (optional), B7, B8 | `qa_comments` |
| `credit_adjustments` | B1, B9 | `credit_adjustments` (recommended) |
| `qa_comment_history` JSONB | B4 draft | **Dropped** → `qa_comments` |
| `drive_manifest_snapshots` | B4 defer | **Deferred** |
| Mongo QA / manifest | B6 optional | **Rejected for v1** |

---

## Per-epic tasks

### B0 — Auth & core schema

- [x] Replace § Storage design with pointer: [00-storage-design.md](./00-storage-design.md) §§ 3.1–3.4, 4, 5, 9 Wave 1
- [x] Add **Storage (final)** subsection listing B0-only: auth tables, enum definitions, dev seed
- [x] API catalog: use `pipeline_stage` not `demoStage` in response DTOs
- [x] Resolve open questions #3–4 per canonical §12
- [x] README tracker → `Storage reconciled`

### B1 — Admin clients & batches

- [x] Replace § Storage design → canonical §§ 3.2, 3.3, 3.6
- [x] Align `credit_adjustments` with canonical §3.6 (`kind`: `top_up`, `debit_batch`)
- [x] Remove duplicate `clients` table wording if any
- [x] API: `footageUrl` request → `source_media_url` column
- [x] README → `Storage reconciled`

### B2 — Read models (boards)

- [x] Replace § Storage design → “No new tables”; §§ 3, 10
- [x] DTO field map: `demoStage` → `pipelineStage` in OpenAPI
- [x] Document eager-load `qa_comments` → `qaCommentHistory[]`
- [x] README → `Storage reconciled`

### B3 — Client intake

- [x] Replace § Storage design → canonical §5.1 intake rows; no new tables
- [x] Defer `batch_events` per canonical D2
- [x] README → `Storage reconciled`

### B4 — SMM clips & client clip review

- [x] Replace JSONB `qa_comment_history` draft → `qa_comments` with `kind=clip_note`
- [x] Remove Mongo §; align writes table with canonical §5.1
- [x] README → `Storage reconciled`

### B5 — Editor deliverables split

- [x] Confirm no new tables; reference §3.3, §5.1, §6 #6
- [x] `409` on re-submit per canonical D1
- [x] README → `Storage reconciled`

### B6 — Production & SMM QA queue

- [x] Align `deliverable_drive_slots`, `drive_slots_synced_at` with canonical §3.4
- [x] Remove Mongo optional manifest §
- [x] README → `Storage reconciled`

### B7 — SMM internal QA

- [x] Set **`qa_comments` table** as final (remove “JSONB alternative” as equal choice)
- [x] Legacy `qa_flags` / `qa_general_note` on ticket per canonical §3.4
- [x] Sold comments = `deprecated=true` + `asset_version`
- [x] README → `Storage reconciled`

### B8 — Client QA & revision via SMM

- [x] Replace § Storage → canonical §§ 3.4, 3.5, 5.2 (client reject invariant)
- [x] README → `Storage reconciled`

### B9 — Scheduling & credits

- [x] JSONB shapes: `video_schedule`, `batch_schedule` per canonical §3.3–3.4
- [x] Transaction boundary matches canonical §6 #4
- [x] README → `Storage reconciled`

### B10 — Deadlines & pipeline

- [x] No new tables; `deadline_at` / `deadline_role` per canonical §3.4
- [x] Confirm `setVideoOwner` out of scope
- [x] README → `Storage reconciled`

### B11 — Mock removal & integration

- [x] Add **Storage (final):** “No new tables. See [00-storage-design.md](./00-storage-design.md).”
- [x] OpenAPI audit against canonical entity list
- [x] README → `Storage reconciled` (planning only; implementation status separate)

---

## README tracker update

Epic plan **Status** set to `Storage reconciled` in each `B*.md` and [README.md](./README.md) tracker below.

| — | `00-storage-design.md` | **Approved** | All B0–B11 plans reconciled |

**Next:** Implement B0 (Alembic wave 1) per canonical §9.

---

## Optional: auto-patch epic plans

Completed — each `B*.md` now has:

```markdown
## Storage (final)

Canonical design: [00-storage-design.md](./00-storage-design.md) …

**Epic-specific deltas:** …
```

Full table definitions live only in `00-storage-design.md`.
