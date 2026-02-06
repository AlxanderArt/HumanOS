-- Tasks: The atomic unit of work. Assignments track who's working on what.

create table public.tasks (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  payload jsonb not null,
  status text not null default 'pending'
    check (status in ('pending', 'assigned', 'in_progress', 'submitted', 'in_review', 'accepted', 'rejected', 'escalated')),
  priority int not null default 5 check (priority between 1 and 10),
  confidence float check (confidence between 0 and 1),
  metadata jsonb default '{}',
  batch_id uuid,
  is_gold boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.task_assignments (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  assignee_id uuid not null references auth.users(id),
  status text not null default 'assigned'
    check (status in ('assigned', 'in_progress', 'submitted', 'expired', 'cancelled')),
  assigned_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  expires_at timestamptz
);

create table public.task_batches (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  task_count int not null default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- Indexes
create index idx_tasks_project on public.tasks(project_id);
create index idx_tasks_tenant on public.tasks(tenant_id);
create index idx_tasks_status on public.tasks(status);
create index idx_tasks_priority on public.tasks(priority desc);
create index idx_tasks_batch on public.tasks(batch_id) where batch_id is not null;
create index idx_tasks_pending on public.tasks(project_id, priority desc) where status = 'pending';
create index idx_assignments_task on public.task_assignments(task_id);
create index idx_assignments_assignee on public.task_assignments(assignee_id);
create index idx_assignments_status on public.task_assignments(status);
create index idx_batches_project on public.task_batches(project_id);

-- Enable RLS
alter table public.tasks enable row level security;
alter table public.task_assignments enable row level security;
alter table public.task_batches enable row level security;

-- RLS Policies: Tasks
create policy "Members can view tasks"
  on public.tasks for select
  using (public.is_tenant_member(tenant_id));

create policy "Managers can create tasks"
  on public.tasks for insert
  with check (public.get_tenant_role(tenant_id) in ('owner', 'admin', 'manager'));

create policy "Authorized users can update tasks"
  on public.tasks for update
  using (public.is_tenant_member(tenant_id));

-- RLS Policies: Assignments
create policy "Members can view assignments"
  on public.task_assignments for select
  using (exists (
    select 1 from public.tasks t
    where t.id = task_id and public.is_tenant_member(t.tenant_id)
  ));

create policy "System can create assignments"
  on public.task_assignments for insert
  with check (exists (
    select 1 from public.tasks t
    where t.id = task_id and public.is_tenant_member(t.tenant_id)
  ));

create policy "Assignees can update their assignments"
  on public.task_assignments for update
  using (assignee_id = auth.uid() or exists (
    select 1 from public.tasks t
    where t.id = task_id
    and public.get_tenant_role(t.tenant_id) in ('owner', 'admin', 'manager')
  ));

-- RLS Policies: Batches
create policy "Members can view batches"
  on public.task_batches for select
  using (public.is_tenant_member(tenant_id));

create policy "Managers can create batches"
  on public.task_batches for insert
  with check (public.get_tenant_role(tenant_id) in ('owner', 'admin', 'manager'));

-- Triggers
create trigger tasks_updated_at
  before update on public.tasks
  for each row execute function public.update_updated_at();

-- Enable realtime for task status changes
alter publication supabase_realtime add table public.tasks;
