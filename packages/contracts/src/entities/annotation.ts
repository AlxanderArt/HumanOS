import { z } from "zod";
import { ReviewDecision } from "../enums.js";

export const Annotation = z.object({
  id: z.string().uuid(),
  task_id: z.string().uuid(),
  annotator_id: z.string().uuid(),
  labels: z.record(z.unknown()),
  confidence: z.number().min(0).max(1).nullable(),
  time_spent_ms: z.number().int().nonnegative(),
  revision: z.number().int().default(1),
  submitted_at: z.string().datetime(),
  created_at: z.string().datetime(),
});
export type Annotation = z.infer<typeof Annotation>;

export const AnnotationReview = z.object({
  id: z.string().uuid(),
  annotation_id: z.string().uuid(),
  reviewer_id: z.string().uuid(),
  decision: ReviewDecision,
  corrected_labels: z.record(z.unknown()).nullable(),
  notes: z.string().nullable(),
  time_spent_ms: z.number().int().nonnegative(),
  created_at: z.string().datetime(),
});
export type AnnotationReview = z.infer<typeof AnnotationReview>;

export const SubmitAnnotationInput = z.object({
  task_id: z.string().uuid(),
  labels: z.record(z.unknown()),
  confidence: z.number().min(0).max(1).nullable().optional(),
  time_spent_ms: z.number().int().nonnegative(),
});
export type SubmitAnnotationInput = z.infer<typeof SubmitAnnotationInput>;

export const SubmitReviewInput = z.object({
  annotation_id: z.string().uuid(),
  decision: ReviewDecision,
  corrected_labels: z.record(z.unknown()).nullable().optional(),
  notes: z.string().nullable().optional(),
  time_spent_ms: z.number().int().nonnegative(),
});
export type SubmitReviewInput = z.infer<typeof SubmitReviewInput>;
