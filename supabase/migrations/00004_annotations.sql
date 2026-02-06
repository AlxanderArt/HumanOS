-- Annotations: What annotators produce. Revisions track corrections.

create table public.annotations (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  annotator_id uuid not null references auth.users(id),
  labels jsonb not null,
  confidence float check (confidence between 0 and 1),
  time_spent_ms int not null default 0 check (time_spent_ms >= 0),
  revision int not null default 1,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.annotation_revisions (
  id uuid primary key default uuid_generate_v4(),
  annotation_id uuid not null references public.annotations(id) on delete cascade,
  revision_number int not null,
  labels jsonb not null,
  changed_by uuid references auth.users(id),
  reason text,
  created_at timestamptz not null default now()
);

create table public.annotation_reviews (
  id uuid primary key default uuid_generate_v4(),
  annotation_id uuid not null references public.annotations(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id),
  decision text not null check (decision in ('approve', 'reject', 'revise', 'escalate')),
  corrected_labels jsonb,
  notes text,
  time_spent_ms int not null default 0 check (time_spent_ms >= 0),
  created_at timestamptz not null default now()
);

-- Constraint: one annotation per (task, annotator, revision)
create unique index idx_annotations_unique
  on public.annotations(task_id, annotator_id, revision);

-- Indexes
create index idx_annotations_task on public.annotations(task_id);
create index idx_annotations_annotator on public.annotations(annotator_id);
create index idx_revisions_annotation on public.annotation_revisions(annotation_id);
create index idx_reviews_annotation on public.annotation_reviews(annotation_id);
create index idx_reviews_reviewer on public.annotation_reviews(reviewer_id);

-- Enable RLS
alter table public.annotations enable row level security;
alter table public.annotation_revisions enable row level security;
alter table public.annotation_reviews enable row level security;

-- RLS Policies: Annotations
create policy "Members can view annotations"
  on public.annotations for select
  using (exists (
    select 1 from public.tasks t
    where t.id = task_id and public.is_tenant_member(t.tenant_id)
  ));

create policy "Annotators can submit annotations"
  on public.annotations for insert
  with check (annotator_id = auth.uid() and exists (
    select 1 from public.tasks t
    where t.id = task_id and public.is_tenant_member(t.tenant_id)
  ));

-- RLS Policies: Revisions
create policy "Members can view revisions"
  on public.annotation_revisions for select
  using (exists (
    select 1 from public.annotations a
    join public.tasks t on t.id = a.task_id
    where a.id = annotation_id and public.is_tenant_member(t.tenant_id)
  ));

-- RLS Policies: Reviews
create policy "Members can view reviews"
  on public.annotation_reviews for select
  using (exists (
    select 1 from public.annotations a
    join public.tasks t on t.id = a.task_id
    where a.id = annotation_id and public.is_tenant_member(t.tenant_id)
  ));

create policy "Reviewers can submit reviews"
  on public.annotation_reviews for insert
  with check (reviewer_id = auth.uid() and exists (
    select 1 from public.annotations a
    join public.tasks t on t.id = a.task_id
    where a.id = annotation_id
    and public.get_tenant_role(t.tenant_id) in ('owner', 'admin', 'manager')
  ));

-- Enable realtime
alter publication supabase_realtime add table public.annotations;
