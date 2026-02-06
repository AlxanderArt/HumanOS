import { z } from "zod";

export const AgentTrace = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  agent_id: z.string(),
  agent_version: z.string().nullable(),
  session_id: z.string(),
  trajectory: z.array(z.object({
    step: z.number().int(),
    action: z.string(),
    input: z.record(z.unknown()).optional(),
    output: z.record(z.unknown()).optional(),
    tool_calls: z.array(z.object({
      tool: z.string(),
      args: z.record(z.unknown()),
      result: z.record(z.unknown()).optional(),
    })).optional(),
    reasoning: z.string().optional(),
    timestamp: z.string().datetime(),
  })),
  metadata: z.record(z.unknown()).optional(),
  confidence: z.number().min(0).max(1).nullable(),
  created_at: z.string().datetime(),
});
export type AgentTrace = z.infer<typeof AgentTrace>;

export const EvaluationRubric = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  name: z.string(),
  criteria: z.array(z.object({
    name: z.string(),
    description: z.string(),
    weight: z.number().min(0).max(1),
    scale_min: z.number(),
    scale_max: z.number(),
  })),
  scoring_method: z.enum(["weighted_average", "minimum", "custom"]),
  created_at: z.string().datetime(),
});
export type EvaluationRubric = z.infer<typeof EvaluationRubric>;

export const AgentEvaluation = z.object({
  id: z.string().uuid(),
  trace_id: z.string().uuid(),
  evaluator_id: z.string().uuid(),
  rubric_id: z.string().uuid(),
  scores: z.record(z.number()),
  overall_score: z.number().min(0).max(1),
  safety_flags: z.array(z.string()),
  notes: z.string().nullable(),
  time_spent_ms: z.number().int().nonnegative(),
  created_at: z.string().datetime(),
});
export type AgentEvaluation = z.infer<typeof AgentEvaluation>;

export const ToolUseAssessment = z.object({
  id: z.string().uuid(),
  trace_id: z.string().uuid(),
  step: z.number().int(),
  tool_name: z.string(),
  correctness: z.number().min(0).max(1),
  necessity: z.number().min(0).max(1),
  safety_flag: z.boolean(),
  notes: z.string().nullable(),
});
export type ToolUseAssessment = z.infer<typeof ToolUseAssessment>;

export const IngestAgentTraceInput = z.object({
  agent_id: z.string(),
  agent_version: z.string().nullable().optional(),
  session_id: z.string(),
  trajectory: AgentTrace.shape.trajectory,
  metadata: z.record(z.unknown()).optional(),
  confidence: z.number().min(0).max(1).nullable().optional(),
});
export type IngestAgentTraceInput = z.infer<typeof IngestAgentTraceInput>;
