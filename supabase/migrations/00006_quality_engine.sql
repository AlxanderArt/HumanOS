-- Quality Engine: Gold sets, consensus, IAA, drift detection.
-- This is the intelligence layer that separates signal from noise.

create table public.gold_sets (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  task_payload jsonb not null,
  expected_labels jsonb not null,
  difficulty text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.gold_set_results (
  id uuid primary key default uuid_generate_v4(),
  gold_set_id uuid not null references public.gold_sets(id) on delete cascade,
  annotator_id uuid not null references auth.users(id),
  submitted_labels jsonb not null,
  score float not null check (score between 0 and 1),
  passed boolean not null,
  evaluated_at timestamptz not null default now()
);

create table public.consensus_configs (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  min_annotators int not null default 3 check (min_annotators >= 2),
  agreement_threshold float not null default 0.8 check (agreement_threshold between 0 and 1),
  method text not null default 'majority_vote'
    check (method in ('majority_vote', 'weighted_vote', 'specialist')),
  created_at timestamptz not null default now(),
  unique (project_id)
);

create table public.consensus_results (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  consensus_labels jsonb not null,
  agreement_score float not null check (agreement_score between 0 and 1),
  method text not null,
  annotator_count int not null,
  computed_at timestamptz not null default now()
);

create table public.quality_scores (
  id uuid primary key default uuid_generate_v4(),
  annotator_id uuid not null references auth.users(id),
  project_id uuid not null references public.projects(id) on delete cascade,
  accuracy float not null check (accuracy between 0 and 1),
  precision_score float check (precision_score between 0 and 1),
  recall_score float check (recall_score between 0 and 1),
  f1_score float check (f1_score between 0 and 1),
  gold_pass_rate float check (gold_pass_rate between 0 and 1),
  tasks_completed int not null default 0,
  period_start timestamptz not null,
  period_end timestamptz not null,
  computed_at timestamptz not null default now()
);

create table public.drift_snapshots (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  distribution jsonb not null,
  baseline_distribution jsonb not null,
  drift_score float not null check (drift_score between 0 and 1),
  severity text not null default 'low' check (severity in ('low', 'medium', 'high', 'critical')),
  detected_at timestamptz not null default now()
);

-- Indexes
create index idx_gold_sets_project on public.gold_sets(project_id);
create index idx_gold_sets_active on public.gold_sets(project_id) where active = true;
create index idx_gold_results_annotator on public.gold_set_results(annotator_id);
create index idx_gold_results_gold on public.gold_set_results(gold_set_id);
create index idx_consensus_results_task on public.consensus_results(task_id);
create index idx_quality_scores_annotator on public.quality_scores(annotator_id);
create index idx_quality_scores_project on public.quality_scores(project_id);
create index idx_drift_project on public.drift_snapshots(project_id);

-- Enable RLS
alter table public.gold_sets enable row level security;
alter table public.gold_set_results enable row level security;
alter table public.consensus_configs enable row level security;
alter table public.consensus_results enable row level security;
alter table public.quality_scores enable row level security;
alter table public.drift_snapshots enable row level security;

-- RLS Policies (using project -> tenant chain)
create policy "Managers can manage gold sets"
  on public.gold_sets for all
  using (exists (
    select 1 from public.projects p
    where p.id = project_id
    and public.get_tenant_role(p.tenant_id) in ('owner', 'admin', 'manager')
  ));

create policy "Members can view gold set results"
  on public.gold_set_results for select
  using (exists (
    select 1 from public.gold_sets g
    join public.projects p on p.id = g.project_id
    where g.id = gold_set_id and public.is_tenant_member(p.tenant_id)
  ));

create policy "System can record gold set results"
  on public.gold_set_results for insert
  with check (true);

create policy "Members can view consensus configs"
  on public.consensus_configs for select
  using (exists (
    select 1 from public.projects p
    where p.id = project_id and public.is_tenant_member(p.tenant_id)
  ));

create policy "Managers can manage consensus configs"
  on public.consensus_configs for all
  using (exists (
    select 1 from public.projects p
    where p.id = project_id
    and public.get_tenant_role(p.tenant_id) in ('owner', 'admin', 'manager')
  ));

create policy "Members can view consensus results"
  on public.consensus_results for select
  using (exists (
    select 1 from public.tasks t
    where t.id = task_id and public.is_tenant_member(t.tenant_id)
  ));

create policy "Members can view quality scores"
  on public.quality_scores for select
  using (exists (
    select 1 from public.projects p
    where p.id = project_id and public.is_tenant_member(p.tenant_id)
  ));

create policy "Members can view drift"
  on public.drift_snapshots for select
  using (exists (
    select 1 from public.projects p
    where p.id = project_id and public.is_tenant_member(p.tenant_id)
  ));
