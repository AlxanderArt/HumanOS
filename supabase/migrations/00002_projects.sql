-- Projects: The containers for labeling work.
-- Each project has a task schema (JSONB) that defines what annotators see.

create table public.projects (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  description text,
  modality text not null check (modality in ('text', 'image', 'audio', 'video', 'agent_trace', 'multimodal')),
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'completed', 'archived')),
  task_schema jsonb not null default '{}',
  labeling_instructions text,
  ontology_version text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Project-level configuration (UI config, review settings, etc.)
create table public.project_configs (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  config_key text not null,
  config_value jsonb not null,
  created_at timestamptz not null default now(),
  unique (project_id, config_key)
);

-- Indexes
create index idx_projects_tenant on public.projects(tenant_id);
create index idx_projects_status on public.projects(status);
create index idx_project_configs_project on public.project_configs(project_id);

-- Enable RLS
alter table public.projects enable row level security;
alter table public.project_configs enable row level security;

-- RLS Policies
create policy "Members can view projects"
  on public.projects for select
  using (public.is_tenant_member(tenant_id));

create policy "Managers can create projects"
  on public.projects for insert
  with check (public.get_tenant_role(tenant_id) in ('owner', 'admin', 'manager'));

create policy "Managers can update projects"
  on public.projects for update
  using (public.get_tenant_role(tenant_id) in ('owner', 'admin', 'manager'));

create policy "Members can view project configs"
  on public.project_configs for select
  using (exists (
    select 1 from public.projects p
    where p.id = project_id and public.is_tenant_member(p.tenant_id)
  ));

create policy "Managers can manage project configs"
  on public.project_configs for all
  using (exists (
    select 1 from public.projects p
    where p.id = project_id
    and public.get_tenant_role(p.tenant_id) in ('owner', 'admin', 'manager')
  ));

-- Updated_at trigger
create trigger projects_updated_at
  before update on public.projects
  for each row execute function public.update_updated_at();
