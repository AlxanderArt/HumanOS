import { z } from "zod";
import { WorkflowStageType, WorkflowInstanceStatus } from "../enums.js";

export const WorkflowTemplate = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  stages: z.array(z.object({
    order: z.number().int(),
    type: WorkflowStageType,
    name: z.string(),
    config: z.record(z.unknown()).optional(),
  })),
  routing_rules: z.record(z.unknown()).optional(),
  created_at: z.string().datetime(),
});
export type WorkflowTemplate = z.infer<typeof WorkflowTemplate>;

export const WorkflowInstance = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  template_id: z.string().uuid(),
  task_id: z.string().uuid(),
  current_stage: z.number().int(),
  status: WorkflowInstanceStatus,
  context: z.record(z.unknown()).optional(),
  started_at: z.string().datetime(),
  completed_at: z.string().datetime().nullable(),
});
export type WorkflowInstance = z.infer<typeof WorkflowInstance>;

export const StageTransition = z.object({
  id: z.string().uuid(),
  instance_id: z.string().uuid(),
  from_stage: z.number().int(),
  to_stage: z.number().int(),
  reason: z.string().nullable(),
  triggered_by: z.string().uuid(),
  transitioned_at: z.string().datetime(),
});
export type StageTransition = z.infer<typeof StageTransition>;
