import { z } from "zod";

export const TenantRole = z.enum([
  "owner",
  "admin",
  "manager",
  "annotator",
  "viewer",
]);
export type TenantRole = z.infer<typeof TenantRole>;

export const ProjectStatus = z.enum([
  "draft",
  "active",
  "paused",
  "completed",
  "archived",
]);
export type ProjectStatus = z.infer<typeof ProjectStatus>;

export const TaskModality = z.enum([
  "text",
  "image",
  "audio",
  "video",
  "agent_trace",
  "multimodal",
]);
export type TaskModality = z.infer<typeof TaskModality>;

export const TaskStatus = z.enum([
  "pending",
  "assigned",
  "in_progress",
  "submitted",
  "in_review",
  "accepted",
  "rejected",
  "escalated",
]);
export type TaskStatus = z.infer<typeof TaskStatus>;

export const AssignmentStatus = z.enum([
  "assigned",
  "in_progress",
  "submitted",
  "expired",
  "cancelled",
]);
export type AssignmentStatus = z.infer<typeof AssignmentStatus>;

export const VendorStatus = z.enum(["active", "suspended", "offboarded"]);
export type VendorStatus = z.infer<typeof VendorStatus>;

export const WorkforceStatus = z.enum([
  "available",
  "busy",
  "offline",
  "suspended",
]);
export type WorkforceStatus = z.infer<typeof WorkforceStatus>;

export const ReviewDecision = z.enum([
  "approve",
  "reject",
  "revise",
  "escalate",
]);
export type ReviewDecision = z.infer<typeof ReviewDecision>;

export const WorkflowStageType = z.enum([
  "label",
  "review",
  "adjudicate",
  "auto_check",
  "escalate",
]);
export type WorkflowStageType = z.infer<typeof WorkflowStageType>;

export const WorkflowInstanceStatus = z.enum([
  "active",
  "completed",
  "failed",
  "cancelled",
]);
export type WorkflowInstanceStatus = z.infer<typeof WorkflowInstanceStatus>;

export const DriftSeverity = z.enum(["low", "medium", "high", "critical"]);
export type DriftSeverity = z.infer<typeof DriftSeverity>;

export const EventType = z.enum([
  "task.created",
  "task.assigned",
  "task.completed",
  "task.escalated",
  "annotation.submitted",
  "annotation.reviewed",
  "quality.computed",
  "consensus.reached",
  "drift.detected",
  "workflow.stage.advanced",
  "workflow.completed",
  "agent.trace.ingested",
  "agent.eval.completed",
  "vendor.task.dispatched",
  "vendor.cost.recorded",
]);
export type EventType = z.infer<typeof EventType>;
