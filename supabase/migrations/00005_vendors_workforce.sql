-- Vendors + Workforce: The human layer. Who does the work, what it costs.

create table public.vendors (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  region text,
  status text not null default 'active' check (status in ('active', 'suspended', 'offboarded')),
  sla_target float check (sla_target between 0 and 1),
  cost_per_task float check (cost_per_task >= 0),
  billing_config jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workforce_members (
  id uuid primary key default uuid_generate_v4(),
  vendor_id uuid references public.vendors(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  skills text[] not null default '{}',
  hourly_rate float check (hourly_rate >= 0),
  status text not null default 'available'
    check (status in ('available', 'busy', 'offline', 'suspended')),
  certifications text[] not null default '{}',
  performance_score float check (performance_score between 0 and 1),
  tasks_completed int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vendor_contracts (
  id uuid primary key default uuid_generate_v4(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  sla_terms jsonb not null default '{}',
  cost_cap float check (cost_cap >= 0),
  start_date timestamptz not null default now(),
  end_date timestamptz,
  created_at timestamptz not null default now()
);

create table public.cost_ledger (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  vendor_id uuid references public.vendors(id),
  annotator_id uuid not null references auth.users(id),
  amount float not null check (amount >= 0),
  currency text not null default 'USD',
  recorded_at timestamptz not null default now()
);

-- Indexes
create index idx_vendors_tenant on public.vendors(tenant_id);
create index idx_vendors_status on public.vendors(status);
create index idx_workforce_vendor on public.workforce_members(vendor_id);
create index idx_workforce_tenant on public.workforce_members(tenant_id);
create index idx_workforce_user on public.workforce_members(user_id);
create index idx_workforce_skills on public.workforce_members using gin(skills);
create index idx_contracts_vendor on public.vendor_contracts(vendor_id);
create index idx_cost_ledger_tenant on public.cost_ledger(tenant_id);
create index idx_cost_ledger_vendor on public.cost_ledger(vendor_id);
create index idx_cost_ledger_task on public.cost_ledger(task_id);

-- Enable RLS
alter table public.vendors enable row level security;
alter table public.workforce_members enable row level security;
alter table public.vendor_contracts enable row level security;
alter table public.cost_ledger enable row level security;

-- RLS Policies
create policy "Members can view vendors"
  on public.vendors for select
  using (public.is_tenant_member(tenant_id));

create policy "Admins can manage vendors"
  on public.vendors for all
  using (public.get_tenant_role(tenant_id) in ('owner', 'admin'));

create policy "Members can view workforce"
  on public.workforce_members for select
  using (public.is_tenant_member(tenant_id));

create policy "Managers can manage workforce"
  on public.workforce_members for all
  using (public.get_tenant_role(tenant_id) in ('owner', 'admin', 'manager'));

create policy "Members can view contracts"
  on public.vendor_contracts for select
  using (public.is_tenant_member(tenant_id));

create policy "Admins can manage contracts"
  on public.vendor_contracts for all
  using (public.get_tenant_role(tenant_id) in ('owner', 'admin'));

create policy "Members can view cost ledger"
  on public.cost_ledger for select
  using (public.is_tenant_member(tenant_id));

create policy "System can record costs"
  on public.cost_ledger for insert
  with check (public.is_tenant_member(tenant_id));

-- Triggers
create trigger vendors_updated_at
  before update on public.vendors
  for each row execute function public.update_updated_at();

create trigger workforce_updated_at
  before update on public.workforce_members
  for each row execute function public.update_updated_at();
