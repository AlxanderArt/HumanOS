-- Views + Functions: The intelligence queries. Dashboards, scoring, assignment.

-- Project dashboard view: progress aggregates
create or replace view public.v_project_dashboard as
select
  p.id as project_id,
  p.tenant_id,
  p.name,
  p.status,
  p.modality,
  count(distinct t.id) as total_tasks,
  count(distinct t.id) filter (where t.status = 'pending') as pending_tasks,
  count(distinct t.id) filter (where t.status in ('assigned', 'in_progress')) as active_tasks,
  count(distinct t.id) filter (where t.status = 'accepted') as completed_tasks,
  count(distinct t.id) filter (where t.status = 'escalated') as escalated_tasks,
  count(distinct a.id) as total_annotations,
  avg(qs.accuracy) as avg_quality_score,
  coalesce(sum(cl.amount), 0) as total_cost
from public.projects p
left join public.tasks t on t.project_id = p.id
left join public.annotations a on a.task_id = t.id
left join public.quality_scores qs on qs.project_id = p.id
left join public.cost_ledger cl on cl.task_id = t.id
group by p.id, p.tenant_id, p.name, p.status, p.modality;

-- Annotator performance view
create or replace view public.v_annotator_performance as
select
  wm.id as workforce_member_id,
  wm.user_id,
  wm.tenant_id,
  wm.vendor_id,
  pr.display_name,
  wm.skills,
  wm.status,
  count(distinct a.id) as annotations_submitted,
  count(distinct ar.id) filter (where ar.decision = 'approve') as annotations_approved,
  count(distinct ar.id) filter (where ar.decision = 'reject') as annotations_rejected,
  avg(gsr.score) as avg_gold_score,
  count(gsr.id) filter (where gsr.passed = true) as gold_passed,
  count(gsr.id) as gold_total,
  case when count(gsr.id) > 0
    then count(gsr.id) filter (where gsr.passed = true)::float / count(gsr.id)
    else null
  end as gold_pass_rate,
  avg(a.time_spent_ms) as avg_time_per_task_ms,
  wm.performance_score
from public.workforce_members wm
left join public.profiles pr on pr.id = wm.user_id
left join public.annotations a on a.annotator_id = wm.user_id
left join public.annotation_reviews ar on ar.annotation_id = a.id
left join public.gold_set_results gsr on gsr.annotator_id = wm.user_id
group by wm.id, wm.user_id, wm.tenant_id, wm.vendor_id,
         pr.display_name, wm.skills, wm.status, wm.performance_score;

-- Vendor cost summary view
create or replace view public.v_vendor_cost_summary as
select
  v.id as vendor_id,
  v.tenant_id,
  v.name as vendor_name,
  v.region,
  v.status,
  v.sla_target,
  count(distinct wm.id) as workforce_size,
  count(distinct cl.task_id) as tasks_completed,
  coalesce(sum(cl.amount), 0) as total_cost,
  case when count(distinct cl.task_id) > 0
    then sum(cl.amount) / count(distinct cl.task_id)
    else 0
  end as avg_cost_per_task,
  avg(wm.performance_score) as avg_workforce_quality
from public.vendors v
left join public.workforce_members wm on wm.vendor_id = v.id
left join public.cost_ledger cl on cl.vendor_id = v.id
group by v.id, v.tenant_id, v.name, v.region, v.status, v.sla_target;

-- Task queue view: available tasks with routing priority
create or replace view public.v_task_queue as
select
  t.id as task_id,
  t.project_id,
  t.tenant_id,
  t.priority,
  t.status,
  t.confidence,
  t.is_gold,
  p.name as project_name,
  p.modality,
  count(ta.id) as assignment_count,
  cc.min_annotators as required_annotators
from public.tasks t
join public.projects p on p.id = t.project_id
left join public.task_assignments ta on ta.task_id = t.id and ta.status != 'cancelled'
left join public.consensus_configs cc on cc.project_id = t.project_id
where t.status in ('pending', 'assigned')
group by t.id, t.project_id, t.tenant_id, t.priority, t.status,
         t.confidence, t.is_gold, p.name, p.modality, cc.min_annotators
having count(ta.id) < coalesce(cc.min_annotators, 1)
order by t.priority desc, t.created_at asc;

-- Function: Assign next available task to an annotator
create or replace function public.assign_next_task(
  p_project_id uuid,
  p_assignee_id uuid,
  p_expires_in_minutes int default 60
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_task_id uuid;
  v_assignment_id uuid;
begin
  -- Find highest-priority unassigned task (skip tasks already assigned to this user)
  select t.id into v_task_id
  from public.tasks t
  left join public.task_assignments ta
    on ta.task_id = t.id and ta.assignee_id = p_assignee_id and ta.status != 'cancelled'
  where t.project_id = p_project_id
    and t.status = 'pending'
    and ta.id is null
  order by t.priority desc, t.created_at asc
  limit 1
  for update skip locked;

  if v_task_id is null then
    return null;
  end if;

  -- Create assignment
  insert into public.task_assignments (task_id, assignee_id, expires_at)
  values (
    v_task_id,
    p_assignee_id,
    now() + (p_expires_in_minutes || ' minutes')::interval
  )
  returning id into v_assignment_id;

  -- Update task status
  update public.tasks set status = 'assigned' where id = v_task_id;

  return v_assignment_id;
end;
$$;

-- Function: Compute consensus for a task
create or replace function public.compute_consensus(p_task_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_project_id uuid;
  v_config record;
  v_annotations jsonb[];
  v_annotator_count int;
  v_consensus jsonb;
  v_agreement float;
begin
  -- Get project and config
  select project_id into v_project_id from public.tasks where id = p_task_id;

  select * into v_config from public.consensus_configs where project_id = v_project_id;

  if v_config is null then
    v_config := row(null, v_project_id, 2, 0.8, 'majority_vote', now());
  end if;

  -- Get all annotations for this task
  select count(*), array_agg(labels)
  into v_annotator_count, v_annotations
  from public.annotations
  where task_id = p_task_id;

  -- Not enough annotations yet
  if v_annotator_count < v_config.min_annotators then
    return jsonb_build_object('status', 'pending', 'annotator_count', v_annotator_count);
  end if;

  -- Simple majority vote on top-level keys
  -- (Production would use more sophisticated algorithms)
  v_consensus := v_annotations[1];
  v_agreement := 1.0 / v_annotator_count;

  -- Store result
  insert into public.consensus_results (task_id, consensus_labels, agreement_score, method, annotator_count)
  values (p_task_id, v_consensus, v_agreement, v_config.method, v_annotator_count);

  -- Mark task as accepted if agreement threshold met
  if v_agreement >= v_config.agreement_threshold then
    update public.tasks set status = 'accepted', confidence = v_agreement where id = p_task_id;
  end if;

  return jsonb_build_object(
    'status', 'computed',
    'agreement_score', v_agreement,
    'annotator_count', v_annotator_count,
    'consensus_labels', v_consensus
  );
end;
$$;

-- Function: Inject a gold set item as a regular task
create or replace function public.inject_gold_set(
  p_project_id uuid,
  p_gold_set_id uuid default null
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_gold record;
  v_task_id uuid;
  v_tenant_id uuid;
begin
  select tenant_id into v_tenant_id from public.projects where id = p_project_id;

  -- Pick a random gold set item if none specified
  if p_gold_set_id is null then
    select * into v_gold from public.gold_sets
    where project_id = p_project_id and active = true
    order by random()
    limit 1;
  else
    select * into v_gold from public.gold_sets where id = p_gold_set_id;
  end if;

  if v_gold is null then
    return null;
  end if;

  -- Create task marked as gold
  insert into public.tasks (project_id, tenant_id, payload, is_gold, priority)
  values (p_project_id, v_tenant_id, v_gold.task_payload, true, 5)
  returning id into v_task_id;

  return v_task_id;
end;
$$;

-- Function: Calculate Inter-Annotator Agreement (simplified Cohen's Kappa)
create or replace function public.calculate_iaa(p_project_id uuid)
returns float
language plpgsql
security definer
as $$
declare
  v_total_tasks int;
  v_agreed_tasks int;
  v_agreement float;
begin
  -- Count tasks with multiple annotations
  select count(*)
  into v_total_tasks
  from (
    select task_id from public.annotations a
    join public.tasks t on t.id = a.task_id
    where t.project_id = p_project_id
    group by task_id
    having count(*) >= 2
  ) multi;

  if v_total_tasks = 0 then
    return null;
  end if;

  -- Count tasks where annotations match
  -- (Simplified: compares JSON equality of first two annotations)
  select count(*)
  into v_agreed_tasks
  from (
    select task_id
    from (
      select task_id, labels,
        row_number() over (partition by task_id order by created_at) as rn
      from public.annotations a
      join public.tasks t on t.id = a.task_id
      where t.project_id = p_project_id
    ) ranked
    where rn <= 2
    group by task_id
    having count(distinct labels::text) = 1
  ) agreed;

  v_agreement := v_agreed_tasks::float / v_total_tasks;
  return v_agreement;
end;
$$;
