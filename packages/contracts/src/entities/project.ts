import { z } from "zod";
import { ProjectStatus, TaskModality } from "../enums.js";

export const Project = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  modality: TaskModality,
  status: ProjectStatus,
  task_schema: z.record(z.unknown()),
  labeling_instructions: z.string().optional(),
  ontology_version: z.string().optional(),
  created_by: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type Project = z.infer<typeof Project>;

export const CreateProjectInput = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  modality: TaskModality,
  task_schema: z.record(z.unknown()),
  labeling_instructions: z.string().optional(),
});
export type CreateProjectInput = z.infer<typeof CreateProjectInput>;
