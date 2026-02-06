import { z } from "zod";
import { VendorStatus, WorkforceStatus } from "../enums.js";

export const Vendor = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  name: z.string().min(1).max(255),
  region: z.string().nullable(),
  status: VendorStatus,
  sla_target: z.number().min(0).max(1).nullable(),
  cost_per_task: z.number().nonnegative().nullable(),
  billing_config: z.record(z.unknown()).optional(),
  created_at: z.string().datetime(),
});
export type Vendor = z.infer<typeof Vendor>;

export const WorkforceMember = z.object({
  id: z.string().uuid(),
  vendor_id: z.string().uuid().nullable(),
  user_id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  skills: z.array(z.string()),
  hourly_rate: z.number().nonnegative().nullable(),
  status: WorkforceStatus,
  certifications: z.array(z.string()).default([]),
  performance_score: z.number().min(0).max(1).nullable(),
  created_at: z.string().datetime(),
});
export type WorkforceMember = z.infer<typeof WorkforceMember>;

export const VendorContract = z.object({
  id: z.string().uuid(),
  vendor_id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  sla_terms: z.record(z.unknown()),
  cost_cap: z.number().nonnegative().nullable(),
  start_date: z.string().datetime(),
  end_date: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
});
export type VendorContract = z.infer<typeof VendorContract>;

export const CostLedgerEntry = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  task_id: z.string().uuid(),
  vendor_id: z.string().uuid().nullable(),
  annotator_id: z.string().uuid(),
  amount: z.number().nonnegative(),
  currency: z.string().default("USD"),
  recorded_at: z.string().datetime(),
});
export type CostLedgerEntry = z.infer<typeof CostLedgerEntry>;
