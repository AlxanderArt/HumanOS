import { z } from "zod";

const BaseEvent = z.object({
  event_id: z.string().uuid(),
  event_type: z.string(),
  schema_version: z.number().int().default(1),
  tenant_id: z.string().uuid(),
  occurred_at: z.string().datetime(),
});

export const TaskCreatedEvent = BaseEvent.extend({
  event_type: z.literal("task.created"),
  payload: z.object({
    task_id: z.string().uuid(),
    project_id: z.string().uuid(),
    priority: z.number().int(),
  }),
});
export type TaskCreatedEvent = z.infer<typeof TaskCreatedEvent>;

export const TaskAssignedEvent = BaseEvent.extend({
  event_type: z.literal("task.assigned"),
  payload: z.object({
    task_id: z.string().uuid(),
    assignee_id: z.string().uuid(),
    vendor_id: z.string().uuid().nullable(),
  }),
});
export type TaskAssignedEvent = z.infer<typeof TaskAssignedEvent>;

export const TaskCompletedEvent = BaseEvent.extend({
  event_type: z.literal("task.completed"),
  payload: z.object({
    task_id: z.string().uuid(),
    final_labels: z.record(z.unknown()),
    quality_score: z.number().min(0).max(1).nullable(),
  }),
});
export type TaskCompletedEvent = z.infer<typeof TaskCompletedEvent>;

export const TaskEscalatedEvent = BaseEvent.extend({
  event_type: z.literal("task.escalated"),
  payload: z.object({
    task_id: z.string().uuid(),
    reason: z.string(),
    escalated_by: z.string().uuid(),
  }),
});
export type TaskEscalatedEvent = z.infer<typeof TaskEscalatedEvent>;
