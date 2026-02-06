import { z } from "zod";
import { DriftSeverity } from "../enums.js";

export const GoldSet = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  task_payload: z.record(z.unknown()),
  expected_labels: z.record(z.unknown()),
  difficulty: z.enum(["easy", "medium", "hard"]),
  active: z.boolean().default(true),
  created_at: z.string().datetime(),
});
export type GoldSet = z.infer<typeof GoldSet>;

export const GoldSetResult = z.object({
  id: z.string().uuid(),
  gold_set_id: z.string().uuid(),
  annotator_id: z.string().uuid(),
  submitted_labels: z.record(z.unknown()),
  score: z.number().min(0).max(1),
  passed: z.boolean(),
  evaluated_at: z.string().datetime(),
});
export type GoldSetResult = z.infer<typeof GoldSetResult>;

export const ConsensusConfig = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  min_annotators: z.number().int().min(2).default(3),
  agreement_threshold: z.number().min(0).max(1).default(0.8),
  method: z.enum(["majority_vote", "weighted_vote", "specialist"]).default("majority_vote"),
});
export type ConsensusConfig = z.infer<typeof ConsensusConfig>;

export const ConsensusResult = z.object({
  id: z.string().uuid(),
  task_id: z.string().uuid(),
  consensus_labels: z.record(z.unknown()),
  agreement_score: z.number().min(0).max(1),
  method: z.string(),
  annotator_count: z.number().int(),
  computed_at: z.string().datetime(),
});
export type ConsensusResult = z.infer<typeof ConsensusResult>;

export const QualityScore = z.object({
  id: z.string().uuid(),
  annotator_id: z.string().uuid(),
  project_id: z.string().uuid(),
  accuracy: z.number().min(0).max(1),
  precision: z.number().min(0).max(1).nullable(),
  recall: z.number().min(0).max(1).nullable(),
  f1: z.number().min(0).max(1).nullable(),
  gold_pass_rate: z.number().min(0).max(1).nullable(),
  tasks_completed: z.number().int(),
  period_start: z.string().datetime(),
  period_end: z.string().datetime(),
  computed_at: z.string().datetime(),
});
export type QualityScore = z.infer<typeof QualityScore>;

export const DriftSnapshot = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  distribution: z.record(z.unknown()),
  baseline_distribution: z.record(z.unknown()),
  drift_score: z.number().min(0).max(1),
  severity: DriftSeverity,
  detected_at: z.string().datetime(),
});
export type DriftSnapshot = z.infer<typeof DriftSnapshot>;
