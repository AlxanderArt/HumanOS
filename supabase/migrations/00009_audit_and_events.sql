-- Audit + Events: The nervous system. Every action logged, every event tracked.

create table public.event_log (
  id uuid primary key default uuid_generate_v4(),
  event_type text not null,
  entity_type text,
  entity_id uuid,
  payload jsonb not null default '{}',
  actor_id uuid references auth.users(id),
  tenant_id uuid references public.tenants(id) on delete cascade,
  processed boolean not null default false,
  processed_at timestamptz,
  attempts int not null default 0,
  last_error text,
  created_at timestamptz not null default now()
);

create table public.audit_trail (
  id uuid primary key default uuid_generate_v4(),
  action text not null,
  table_name text not null,
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  performed_by uuid references auth.users(id),
  tenant_id uuid references public.tenants(id),
  created_at timestamptz not null default now()
);

-- Indexes
create index idx_event_log_type on public.event_log(event_type);
create index idx_event_log_tenant on public.event_log(tenant_id);
create index idx_event_log_unprocessed on public.event_log(event_type, created_at)
  where processed = false;
create index idx_event_log_entity on public.event_log(entity_type, entity_id);
create index idx_audit_table on public.audit_trail(table_name);
create index idx_audit_record on public.audit_trail(record_id);
create index idx_audit_tenant on public.audit_trail(tenant_id);
create index idx_audit_actor on public.audit_trail(performed_by);

-- Enable RLS
alter table public.event_log enable row level security;
alter table public.audit_trail enable row level security;

-- RLS Policies
create policy "Members can view events"
  on public.event_log for select
  using (tenant_id is null or public.is_tenant_member(tenant_id));

create policy "System can create events"
  on public.event_log for insert
  with check (true);

create policy "System can update events"
  on public.event_log for update
  using (true);

create policy "Admins can view audit trail"
  on public.audit_trail for select
  using (tenant_id is null or public.get_tenant_role(tenant_id) in ('owner', 'admin'));

-- Helper: increment event attempts on failure
create or replace function public.increment_event_attempts(
  event_id uuid,
  error_message text
)
returns void
language plpgsql
security definer
as $$
begin
  update public.event_log
  set attempts = attempts + 1,
      last_error = error_message
  where id = event_id;
end;
$$;

-- Audit trigger function (attach to critical tables)
create or replace function public.audit_trigger()
returns trigger
language plpgsql
security definer
as $$
declare
  t_id uuid;
begin
  -- Try to get tenant_id from the record
  if TG_OP = 'DELETE' then
    t_id := old.tenant_id;
  else
    t_id := new.tenant_id;
  end if;

  insert into public.audit_trail (action, table_name, record_id, old_values, new_values, performed_by, tenant_id)
  values (
    TG_OP,
    TG_TABLE_NAME,
    case when TG_OP = 'DELETE' then old.id else new.id end,
    case when TG_OP in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when TG_OP in ('INSERT', 'UPDATE') then to_jsonb(new) else null end,
    auth.uid(),
    t_id
  );

  if TG_OP = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

-- Attach audit triggers to critical tables
create trigger audit_tasks
  after insert or update or delete on public.tasks
  for each row execute function public.audit_trigger();

create trigger audit_annotations
  after insert or update or delete on public.annotations
  for each row execute function public.audit_trigger();

create trigger audit_vendors
  after insert or update or delete on public.vendors
  for each row execute function public.audit_trigger();

-- Enable realtime for events (workers subscribe to this)
alter publication supabase_realtime add table public.event_log;
