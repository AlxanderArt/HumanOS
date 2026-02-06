-- Workflow Engine: Multi-stage pipelines. Label → Review → Adjudicate → Accept.

create table public.workflow_templates (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  description text,
  stages jsonb not null default '[]',
  routing_rules jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workflow_instances (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  template_id uuid not null references public.workflow_templates(id),
  task_id uuid not null references public.tasks(id) on delete cascade,
  current_stage int not null default 0,
  status text not null default 'active'
    check (status in ('active', 'completed', 'failed', 'cancelled')),
  context jsonb default '{}',
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.stage_transitions (
  id uuid primary key default uuid_generate_v4(),
  instance_id uuid not null references public.workflow_instances(id) on delete cascade,
  from_stage int not null,
  to_stage int not null,
  reason text,
  triggered_by uuid references auth.users(id),
  transitioned_at timestamptz not null default now()
);

-- Indexes
create index idx_templates_tenant on public.workflow_templates(tenant_id);
create index idx_instances_project on public.workflow_instances(project_id);
create index idx_instances_task on public.workflow_instances(task_id);
create index idx_instances_status on public.workflow_instances(status);
create index idx_transitions_instance on public.stage_transitions(instance_id);

-- Enable RLS
alter table public.workflow_templates enable row level security;
alter table public.workflow_instances enable row level security;
alter table public.stage_transitions enable row level security;

-- RLS Policies
create policy "Members can view templates"
  on public.workflow_templates for select
  using (public.is_tenant_member(tenant_id));

create policy "Managers can manage templates"
  on public.workflow_templates for all
  using (public.get_tenant_role(tenant_id) in ('owner', 'admin', 'manager'));

create policy "Members can view workflow instances"
  on public.workflow_instances for select
  using (exists (
    select 1 from public.projects p
    where p.id = project_id and public.is_tenant_member(p.tenant_id)
  ));

create policy "Members can view transitions"
  on public.stage_transitions for select
  using (exists (
    select 1 from public.workflow_instances wi
    join public.projects p on p.id = wi.project_id
    where wi.id = instance_id and public.is_tenant_member(p.tenant_id)
  ));

-- Triggers
create trigger templates_updated_at
  before update on public.workflow_templates
  for each row execute function public.update_updated_at();
