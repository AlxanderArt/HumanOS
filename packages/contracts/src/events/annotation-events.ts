import { z } from "zod";

const BaseEvent = z.object({
  event_id: z.string().uuid(),
  event_type: z.string(),
  schema_version: z.number().int().default(1),
  tenant_id: z.string().uuid(),
  occurred_at: z.string().datetime(),
});

export const AnnotationSubmittedEvent = BaseEvent.extend({
  event_type: z.literal("annotation.submitted"),
  payload: z.object({
    annotation_id: z.string().uuid(),
    task_id: z.string().uuid(),
    annotator_id: z.string().uuid(),
    confidence: z.number().min(0).max(1).nullable(),
  }),
});
export type AnnotationSubmittedEvent = z.infer<typeof AnnotationSubmittedEvent>;

export const AnnotationReviewedEvent = BaseEvent.extend({
  event_type: z.literal("annotation.reviewed"),
  payload: z.object({
    annotation_id: z.string().uuid(),
    reviewer_id: z.string().uuid(),
    decision: z.string(),
  }),
});
export type AnnotationReviewedEvent = z.infer<typeof AnnotationReviewedEvent>;
