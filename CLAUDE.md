# HSOP — Human Signal Orchestration Platform

## Git Rules
- Never include Co-Authored-By lines in commit messages
- Only AlxanderArt should appear in git history

## Architecture
- Monorepo with npm workspaces: `apps/*`, `packages/*`, `workers/*`
- Supabase is the backbone: Postgres + Auth + RLS + Edge Functions + Realtime
- `packages/contracts` is the single source of truth for all types and schemas
- Edge functions handle synchronous API requests; workers handle async batch processing
- All tables use `tenant_id` for multi-tenant isolation with RLS

## Conventions
- TypeScript strict mode everywhere
- Zod for runtime validation at every boundary
- Edge functions follow Deno runtime patterns (CORS headers, auth token extraction, service role client)
- Dashboard uses React + Vite + Tailwind + shadcn/ui
- Database migrations are numbered sequentially: `00001_`, `00002_`, etc.
- Event types follow dot notation: `task.created`, `annotation.submitted`, etc.
