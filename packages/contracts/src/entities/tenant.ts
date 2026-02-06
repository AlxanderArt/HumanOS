import { z } from "zod";
import { TenantRole } from "../enums.js";

export const Tenant = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  plan: z.string().default("starter"),
  settings: z.record(z.unknown()).optional(),
  created_at: z.string().datetime(),
});
export type Tenant = z.infer<typeof Tenant>;

export const TenantMember = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  user_id: z.string().uuid(),
  role: TenantRole,
  created_at: z.string().datetime(),
});
export type TenantMember = z.infer<typeof TenantMember>;

export const CreateTenantInput = Tenant.pick({ name: true, plan: true });
export type CreateTenantInput = z.infer<typeof CreateTenantInput>;
