# Architecture Decision Records

## ADR-001: Supabase as Platform Backbone

**Decision:** Use Supabase (Postgres + Auth + RLS + Edge Functions + Realtime) as the primary backend.

**Rationale:** Eliminates the need for a separate API server, auth system, and database host. Edge functions handle business logic. Realtime provides event delivery. RLS enforces multi-tenant isolation at the database layer.

**Trade-offs:** Edge functions have execution time limits. Heavy compute (quality scoring, workflow advancement) is delegated to external workers.

## ADR-002: npm Workspaces for Monorepo

**Decision:** Use npm workspaces instead of Turborepo, Nx, or pnpm.

**Rationale:** Zero additional tooling required. npm 10.x has workspaces built in. The repo is small enough that build orchestration overhead is not justified. Can migrate to Turborepo later if needed.

## ADR-003: Zod for Runtime Validation

**Decision:** Use Zod schemas as the single source of truth for types and validation.

**Rationale:** Zod provides both TypeScript types (via `z.infer`) and runtime validation. This ensures type safety at every boundary: edge function inputs, worker event payloads, dashboard form submissions. One schema definition serves both compilation and runtime.

## ADR-004: pg_notify + Supabase Realtime for Events

**Decision:** Use Postgres-native event delivery instead of Redis/Kafka for MVP.

**Rationale:** No additional infrastructure. Supabase Realtime wraps pg_notify with WebSocket delivery. The `queue-client` package abstracts this, so swapping to Redis or Kafka later requires no changes to consuming code. Sufficient for MVP volumes.

## ADR-005: Edge Functions + Workers Split

**Decision:** Edge functions handle synchronous API requests. Workers handle async batch processing.

**Rationale:** Edge functions are request-scoped with time limits. Quality computation (IAA, consensus) and workflow state management require longer execution. Workers poll the event_log table and process in batches.

## ADR-006: Multi-tenant via tenant_id + RLS

**Decision:** Single database with tenant_id column and Row Level Security policies.

**Rationale:** Simpler than schema-per-tenant. Scales well to hundreds of tenants. RLS enforces isolation at the database layer, preventing cross-tenant data access even if application code has bugs. Helper functions `is_tenant_member()` and `get_tenant_role()` make policies readable.

## ADR-007: Quality Algorithm Choices

**Decision:** MVP uses simple majority vote for consensus and JSON equality for IAA.

**Rationale:** Sufficient for demonstrating the architecture. Production would use Cohen's Kappa (2 annotators), Fleiss' Kappa (3+), and category-specific agreement metrics. The schema and function signatures support this evolution without breaking changes.
