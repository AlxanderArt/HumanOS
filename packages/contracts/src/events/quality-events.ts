import { z } from "zod";
import { DriftSeverity } from "../enums.js";

const BaseEvent = z.object({
  event_id: z.string().uuid(),
  event_type: z.string(),
  schema_version: z.number().int().default(1),
  tenant_id: z.string().uuid(),
  occurred_at: z.string().datetime(),
});

export const QualityComputedEvent = BaseEvent.extend({
  event_type: z.literal("quality.computed"),
  payload: z.object({
    annotation_id: z.string().uuid(),
    gold_score: z.number().min(0).max(1).nullable(),
    consensus_score: z.number().min(0).max(1).nullable(),
  }),
});
export type QualityComputedEvent = z.infer<typeof QualityComputedEvent>;

export const ConsensusReachedEvent = BaseEvent.extend({
  event_type: z.literal("consensus.reached"),
  payload: z.object({
    task_id: z.string().uuid(),
    agreement_score: z.number().min(0).max(1),
    consensus_labels: z.record(z.unknown()),
    annotator_count: z.number().int(),
  }),
});
export type ConsensusReachedEvent = z.infer<typeof ConsensusReachedEvent>;

export const DriftDetectedEvent = BaseEvent.extend({
  event_type: z.literal("drift.detected"),
  payload: z.object({
    project_id: z.string().uuid(),
    drift_score: z.number().min(0).max(1),
    severity: DriftSeverity,
  }),
});
export type DriftDetectedEvent = z.infer<typeof DriftDetectedEvent>;
