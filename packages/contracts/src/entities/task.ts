import { z } from "zod";
import { TaskStatus, AssignmentStatus } from "../enums.js";

export const Task = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  payload: z.record(z.unknown()),
  status: TaskStatus,
  priority: z.number().int().min(1).max(10).default(5),
  confidence: z.number().min(0).max(1).nullable(),
  metadata: z.record(z.unknown()).optional(),
  batch_id: z.string().uuid().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type Task = z.infer<typeof Task>;

export const TaskAssignment = z.object({
  id: z.string().uuid(),
  task_id: z.string().uuid(),
  assignee_id: z.string().uuid(),
  status: AssignmentStatus,
  assigned_at: z.string().datetime(),
  started_at: z.string().datetime().nullable(),
  completed_at: z.string().datetime().nullable(),
  expires_at: z.string().datetime().nullable(),
});
export type TaskAssignment = z.infer<typeof TaskAssignment>;

export const TaskBatch = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  name: z.string(),
  task_count: z.number().int(),
  created_by: z.string().uuid(),
  created_at: z.string().datetime(),
});
export type TaskBatch = z.infer<typeof TaskBatch>;

export const CreateTaskInput = z.object({
  project_id: z.string().uuid(),
  payload: z.record(z.unknown()),
  priority: z.number().int().min(1).max(10).default(5),
  metadata: z.record(z.unknown()).optional(),
});
export type CreateTaskInput = z.infer<typeof CreateTaskInput>;

export const AssignTaskInput = z.object({
  task_id: z.string().uuid(),
  assignee_id: z.string().uuid(),
  expires_in_minutes: z.number().int().positive().optional(),
});
export type AssignTaskInput = z.infer<typeof AssignTaskInput>;
