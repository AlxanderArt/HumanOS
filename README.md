# HSOP — Human Signal Orchestration Platform

Unified HITL orchestration platform for data labeling, vendor workforce management, agent evaluation, and quality intelligence.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Dashboard (React)                 │
│  Projects │ Labeling │ Quality │ Vendors │ AgentEval │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│              Supabase Edge Functions                  │
│  assign-task │ submit-annotation │ compute-quality    │
│  route-task  │ ingest-agent-trace                     │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│              Supabase (Postgres + Auth + RLS)         │
│  10 migration files │ Views │ PL/pgSQL functions      │
│  Realtime │ event_log (queue)                         │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│                 Worker Services                       │
│       quality-scorer │ workflow-engine                 │
└─────────────────────────────────────────────────────┘
```

## Quick Start

```bash
# Install dependencies
npm install

# Start Supabase local
supabase start

# Apply migrations
supabase db push

# Seed development data
supabase db seed

# Start the dashboard
npm run dev
```

## Project Structure

```
human-signal-platform/
├── apps/dashboard/          # React + Vite + Tailwind frontend
├── packages/
│   ├── contracts/           # Zod schemas + TypeScript types
│   ├── logger/              # Structured JSON logger
│   └── queue-client/        # Event queue abstraction
├── supabase/
│   ├── migrations/          # 10 database migration files
│   ├── functions/           # 5 edge functions
│   └── seed.sql             # Development data
├── workers/
│   ├── quality-scorer/      # Annotation quality computation
│   └── workflow-engine/     # Workflow state management
├── specs/                   # AsyncAPI, ADRs, event catalog
├── .github/workflows/       # CI/CD pipelines
└── docker-compose.yml       # Worker containers
```

## Database Schema

10 migration files covering 5 pillars:

1. **Foundation** — Multi-tenant core (tenants, members, profiles, RLS)
2. **Projects** — Project containers with task schemas
3. **Tasks** — Task lifecycle, assignments, batches
4. **Annotations** — Labels, revisions, reviews
5. **Vendors** — Vendor management, workforce, cost tracking
6. **Quality** — Gold sets, consensus, IAA, drift detection
7. **Workflows** — Multi-stage pipeline templates and instances
8. **Agent Eval** — Traces, rubrics, evaluations, tool-use assessments
9. **Audit** — Event log, audit trail, trigger functions
10. **Views** — Dashboard aggregates, PL/pgSQL scoring functions

## Edge Functions

| Function | Purpose |
|----------|---------|
| `assign-task` | Find and assign next eligible task to annotator |
| `submit-annotation` | Validate + store annotation, check gold sets, record cost |
| `compute-quality` | Calculate IAA and consensus scores |
| `route-task` | Confidence-based routing (auto-accept / review / escalate) |
| `ingest-agent-trace` | Accept and store agent trajectory data |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Database | Supabase Postgres + RLS |
| Auth | Supabase Auth |
| API | Supabase Edge Functions (Deno) |
| Workers | Node.js + TypeScript |
| Frontend | React + Vite + TypeScript |
| UI | Tailwind CSS + custom components |
| State | TanStack React Query |
| Validation | Zod |
| Monorepo | npm workspaces |
| CI/CD | GitHub Actions |

## Development

```bash
# Run dashboard in dev mode
npm run dev

# Serve edge functions locally
supabase functions serve

# Run workers (requires Docker)
docker compose up

# Type check everything
npm run typecheck
```

## Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase credentials.
