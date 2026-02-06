-- Agent Evaluation: The differentiator. Score agent trajectories, tool use, safety.

create table public.agent_traces (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  agent_id text not null,
  agent_version text,
  session_id text not null,
  trajectory jsonb not null,
  metadata jsonb default '{}',
  confidence float check (confidence between 0 and 1),
  created_at timestamptz not null default now()
);

create table public.evaluation_rubrics (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  criteria jsonb not null,
  scoring_method text not null default 'weighted_average'
    check (scoring_method in ('weighted_average', 'minimum', 'custom')),
  created_at timestamptz not null default now()
);

create table public.agent_evaluations (
  id uuid primary key default uuid_generate_v4(),
  trace_id uuid not null references public.agent_traces(id) on delete cascade,
  evaluator_id uuid not null references auth.users(id),
  rubric_id uuid not null references public.evaluation_rubrics(id),
  scores jsonb not null,
  overall_score float not null check (overall_score between 0 and 1),
  safety_flags text[] not null default '{}',
  notes text,
  time_spent_ms int not null default 0 check (time_spent_ms >= 0),
  created_at timestamptz not null default now()
);

create table public.tool_use_assessments (
  id uuid primary key default uuid_generate_v4(),
  trace_id uuid not null references public.agent_traces(id) on delete cascade,
  step int not null,
  tool_name text not null,
  correctness float not null check (correctness between 0 and 1),
  necessity float not null check (necessity between 0 and 1),
  safety_flag boolean not null default false,
  notes text
);

-- Indexes
create index idx_traces_tenant on public.agent_traces(tenant_id);
create index idx_traces_agent on public.agent_traces(agent_id);
create index idx_traces_session on public.agent_traces(session_id);
create index idx_rubrics_tenant on public.evaluation_rubrics(tenant_id);
create index idx_evals_trace on public.agent_evaluations(trace_id);
create index idx_evals_evaluator on public.agent_evaluations(evaluator_id);
create index idx_tool_assessments_trace on public.tool_use_assessments(trace_id);

-- Enable RLS
alter table public.agent_traces enable row level security;
alter table public.evaluation_rubrics enable row level security;
alter table public.agent_evaluations enable row level security;
alter table public.tool_use_assessments enable row level security;

-- RLS Policies
create policy "Members can view traces"
  on public.agent_traces for select
  using (public.is_tenant_member(tenant_id));

create policy "Members can ingest traces"
  on public.agent_traces for insert
  with check (public.is_tenant_member(tenant_id));

create policy "Members can view rubrics"
  on public.evaluation_rubrics for select
  using (public.is_tenant_member(tenant_id));

create policy "Managers can manage rubrics"
  on public.evaluation_rubrics for all
  using (public.get_tenant_role(tenant_id) in ('owner', 'admin', 'manager'));

create policy "Members can view evaluations"
  on public.agent_evaluations for select
  using (exists (
    select 1 from public.agent_traces t
    where t.id = trace_id and public.is_tenant_member(t.tenant_id)
  ));

create policy "Evaluators can submit evaluations"
  on public.agent_evaluations for insert
  with check (evaluator_id = auth.uid() and exists (
    select 1 from public.agent_traces t
    where t.id = trace_id and public.is_tenant_member(t.tenant_id)
  ));

create policy "Members can view tool assessments"
  on public.tool_use_assessments for select
  using (exists (
    select 1 from public.agent_traces t
    where t.id = trace_id and public.is_tenant_member(t.tenant_id)
  ));
