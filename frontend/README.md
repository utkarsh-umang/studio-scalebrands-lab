# Frontend

React + TypeScript + Vite frontend template. Single-app structure.

## Setup

From repo root:

```bash
task frontend:install
```

## Run

```bash
task frontend:run
```

Dev server: http://localhost:5173

## Path B prototype (mock data)

Build spec: [`context/path-b-ui-spec.md`](../context/path-b-ui-spec.md) · Epics: [`context/path-b-build-plan.md`](../context/path-b-build-plan.md)

Password for all demo accounts: `demo1234`

| Role | Email |
|------|--------|
| Client | `client@scalebrandslab.demo` |
| Editor | `editor@scalebrandslab.demo` |
| SMM | `smm@scalebrandslab.demo` |
| Admin | `admin@scalebrandslab.demo` |

Primary demo client **c-1** (TechWithTim) has staged batches on `/client/board`:

| Batch ID | Stage | What to check |
|----------|--------|----------------|
| `b-new` | intake | Intake card only |
| `b-identifying` | clip ID | In progress, no kanban cards |
| `b-clips` | clip review | One gate card → clips modal |
| `b-clips-ready` | clips-ready | One gate card |
| `b-editing` | pre-split | Clips modal + editor submit deliverables |
| `b-pipeline` | mixed | Five post-split cards (QA, fix, client, missing assets) |
| `b-schedule` | scheduling | Scheduling column |
| `b-archive` | completed | `/client/all` + credits debited |

Catalog: `mockData/pathBDemoScenarios.ts` · Seeds: `mockData/adminWorkspace.ts` · Drive manifests alias to `b-204` via `src/lib/driveMedia.ts`.

**Fix mode** (after build): [`context/test-ui.md`](../context/test-ui.md) — walk flows and log UI issues.

## Generate API Client

Requires the backend to be running on port 8000. From repo root:

```bash
task backend:up   # in one terminal
task frontend:generate-client
```

The script fetches the spec from `http://127.0.0.1:8000/openapi.json` (not localhost, to avoid hitting another backend) and generates the client. Custom URL:

```bash
OPENAPI_URL=https://api.example.com/openapi.json task frontend:generate-client
```

## Environment

- `VITE_API_BASE_URL` — API base URL (default: `http://127.0.0.1:8000`). Create `frontend/.env` and set this if your backend runs elsewhere. The backend’s root `.env` must list the frontend origin in `CORS_ORIGINS` (e.g. `http://localhost:5173`).
- `OPENAPI_URL` — OpenAPI spec URL for codegen (default: `http://127.0.0.1:8000/openapi.json`)

## Jira Ticket

See [docs/TEMPLATE_APP_JIRA_TICKET.md](../docs/TEMPLATE_APP_JIRA_TICKET.md) for implementation stories.
