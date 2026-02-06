-- Seed data for local development
-- Note: auth.users must be created via Supabase Auth API, not SQL inserts.
-- This seeds the application tables assuming users already exist.

-- Tenants
insert into public.tenants (id, name, plan) values
  ('a0000000-0000-0000-0000-000000000001', 'Acme AI Labs', 'enterprise'),
  ('a0000000-0000-0000-0000-000000000002', 'Signal Research Inc', 'starter');

-- Projects
insert into public.projects (id, tenant_id, name, description, modality, status, task_schema, labeling_instructions) values
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
   'Sentiment Analysis v2', 'Classify customer feedback sentiment', 'text', 'active',
   '{"fields": [{"name": "sentiment", "type": "select", "options": ["positive", "negative", "neutral"]}, {"name": "confidence", "type": "slider", "min": 0, "max": 1}]}',
   'Read the text carefully. Select the primary sentiment. Rate your confidence.'),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001',
   'Image Object Detection', 'Identify objects in warehouse images', 'image', 'active',
   '{"fields": [{"name": "objects", "type": "multi_select", "options": ["box", "pallet", "forklift", "person", "shelf"]}, {"name": "count", "type": "number"}]}',
   'Draw bounding boxes around all visible objects. Count total items.'),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001',
   'Agent Tool Use Eval', 'Evaluate agent tool selection quality', 'agent_trace', 'draft',
   '{"fields": [{"name": "correctness", "type": "slider", "min": 0, "max": 1}, {"name": "safety_issues", "type": "multi_select", "options": ["none", "data_leak", "harmful_action", "wrong_tool", "excessive_calls"]}]}',
   'Review the agent trajectory. Score tool selection correctness. Flag any safety issues.');

-- Vendors
insert into public.vendors (id, tenant_id, name, region, status, sla_target, cost_per_task) values
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'DataForce Global', 'US', 'active', 0.95, 0.50),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'LabelTech EU', 'EU', 'active', 0.90, 0.35),
  ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'AI Annotators APAC', 'APAC', 'active', 0.88, 0.25);

-- Consensus configs
insert into public.consensus_configs (project_id, min_annotators, agreement_threshold, method) values
  ('b0000000-0000-0000-0000-000000000001', 3, 0.8, 'majority_vote'),
  ('b0000000-0000-0000-0000-000000000002', 2, 0.9, 'majority_vote');

-- Gold sets
insert into public.gold_sets (project_id, task_payload, expected_labels, difficulty) values
  ('b0000000-0000-0000-0000-000000000001',
   '{"text": "I absolutely love this product! Best purchase ever."}',
   '{"sentiment": "positive", "confidence": 0.95}',
   'easy'),
  ('b0000000-0000-0000-0000-000000000001',
   '{"text": "The delivery was late but the product quality is decent."}',
   '{"sentiment": "neutral", "confidence": 0.7}',
   'medium'),
  ('b0000000-0000-0000-0000-000000000001',
   '{"text": "Terrible experience. Returning immediately."}',
   '{"sentiment": "negative", "confidence": 0.9}',
   'easy');

-- Workflow templates
insert into public.workflow_templates (tenant_id, name, description, stages) values
  ('a0000000-0000-0000-0000-000000000001', 'Standard Label + Review',
   'Single pass labeling followed by manager review',
   '[{"order": 0, "type": "label", "name": "Initial Labeling", "config": {}}, {"order": 1, "type": "review", "name": "Manager Review", "config": {"auto_approve_threshold": 0.9}}]'),
  ('a0000000-0000-0000-0000-000000000001', 'Triple Annotate + Adjudicate',
   'Three independent annotations followed by adjudication if no consensus',
   '[{"order": 0, "type": "label", "name": "Annotator 1", "config": {}}, {"order": 1, "type": "label", "name": "Annotator 2", "config": {}}, {"order": 2, "type": "label", "name": "Annotator 3", "config": {}}, {"order": 3, "type": "adjudicate", "name": "Expert Adjudication", "config": {"trigger": "no_consensus"}}]');

-- Sample tasks for Sentiment Analysis project
insert into public.tasks (project_id, tenant_id, payload, status, priority) values
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '{"text": "Great service, will come back!"}', 'pending', 5),
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '{"text": "Meh, nothing special about this place."}', 'pending', 5),
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '{"text": "Worst experience of my life. Never again."}', 'pending', 5),
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '{"text": "The new update is fantastic!"}', 'pending', 7),
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '{"text": "I have mixed feelings about the redesign."}', 'pending', 5),
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '{"text": "Support team was unhelpful and rude."}', 'pending', 8),
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '{"text": "Exactly what I needed. Five stars."}', 'pending', 5),
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '{"text": "Product broke after two days of use."}', 'pending', 9),
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '{"text": "Decent quality for the price point."}', 'pending', 5),
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '{"text": "Shipping was fast but packaging was damaged."}', 'pending', 6);
