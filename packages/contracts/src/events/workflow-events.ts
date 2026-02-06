import { z } from "zod";

const BaseEvent = z.object({
  event_id: z.string().uuid(),
  event_type: z.string(),
  schema_version: z.number().int().default(1),
  tenant_id: z.string().uuid(),
  occurred_at: z.string().datetime(),
});

export const WorkflowStageAdvancedEvent = BaseEvent.extend({
  event_type: z.literal("workflow.stage.advanced"),
  payload: z.object({
    instance_id: z.string().uuid(),
    task_id: z.string().uuid(),
    from_stage: z.number().int(),
    to_stage: z.number().int(),
    reason: z.string().nullable(),
  }),
});
export type WorkflowStageAdvancedEvent = z.infer<typeof WorkflowStageAdvancedEvent>;

export const WorkflowCompletedEvent = BaseEvent.extend({
  event_type: z.literal("workflow.completed"),
  payload: z.object({
    instance_id: z.string().uuid(),
    task_id: z.string().uuid(),
    final_stage: z.number().int(),
  }),
});
export type WorkflowCompletedEvent = z.infer<typeof WorkflowCompletedEvent>;

export const AgentTraceIngestedEvent = BaseEvent.extend({
  event_type: z.literal("agent.trace.ingested"),
  payload: z.object({
    trace_id: z.string().uuid(),
    agent_id: z.string(),
    session_id: z.string(),
    step_count: z.number().int(),
  }),
});
export type AgentTraceIngestedEvent = z.infer<typeof AgentTraceIngestedEvent>;

export const AgentEvalCompletedEvent = BaseEvent.extend({
  event_type: z.literal("agent.eval.completed"),
  payload: z.object({
    evaluation_id: z.string().uuid(),
    trace_id: z.string().uuid(),
    overall_score: z.number().min(0).max(1),
    safety_flags: z.array(z.string()),
  }),
});
export type AgentEvalCompletedEvent = z.infer<typeof AgentEvalCompletedEvent>;
