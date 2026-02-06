-- Foundation: Multi-tenant core, profiles, app settings
-- This is the bedrock — every table references tenant_id for isolation.

create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- Tenants (organizations)
create table public.tenants (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  plan text not null default 'starter',
  settings jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Profiles (linked to Supabase Auth)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Tenant membership with roles
create table public.tenant_members (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'manager', 'annotator', 'viewer')),
  created_at timestamptz not null default now(),
  unique (tenant_id, user_id)
);

-- App-level settings per tenant
create table public.app_settings (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  key text not null,
  value jsonb not null,
  created_at timestamptz not null default now(),
  unique (tenant_id, key)
);

-- Indexes
create index idx_tenant_members_user on public.tenant_members(user_id);
create index idx_tenant_members_tenant on public.tenant_members(tenant_id);
create index idx_tenant_members_user_tenant on public.tenant_members(user_id, tenant_id);
create index idx_app_settings_tenant on public.app_settings(tenant_id);

-- Enable RLS
alter table public.tenants enable row level security;
alter table public.profiles enable row level security;
alter table public.tenant_members enable row level security;
alter table public.app_settings enable row level security;

-- Helper: check if current user is a member of a tenant
create or replace function public.is_tenant_member(t_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.tenant_members
    where tenant_id = t_id and user_id = auth.uid()
  );
$$;

-- Helper: get current user's role in a tenant
create or replace function public.get_tenant_role(t_id uuid)
returns text
language sql
security definer
stable
as $$
  select role from public.tenant_members
  where tenant_id = t_id and user_id = auth.uid()
  limit 1;
$$;

-- RLS Policies: Tenants
create policy "Members can view their tenants"
  on public.tenants for select
  using (public.is_tenant_member(id));

create policy "Owners can update their tenant"
  on public.tenants for update
  using (public.get_tenant_role(id) in ('owner', 'admin'));

-- RLS Policies: Profiles
create policy "Users can view all profiles"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (id = auth.uid());

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (id = auth.uid());

-- RLS Policies: Tenant Members
create policy "Members can view tenant members"
  on public.tenant_members for select
  using (public.is_tenant_member(tenant_id));

create policy "Admins can manage tenant members"
  on public.tenant_members for insert
  with check (public.get_tenant_role(tenant_id) in ('owner', 'admin'));

create policy "Admins can remove tenant members"
  on public.tenant_members for delete
  using (public.get_tenant_role(tenant_id) in ('owner', 'admin'));

-- RLS Policies: App Settings
create policy "Members can view settings"
  on public.app_settings for select
  using (public.is_tenant_member(tenant_id));

create policy "Admins can manage settings"
  on public.app_settings for all
  using (public.get_tenant_role(tenant_id) in ('owner', 'admin'));

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'display_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Updated_at trigger
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tenants_updated_at
  before update on public.tenants
  for each row execute function public.update_updated_at();
