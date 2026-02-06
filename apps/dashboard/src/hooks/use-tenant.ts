import { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./use-auth";

interface TenantContext {
  tenantId: string | null;
  tenantName: string | null;
  role: string | null;
  loading: boolean;
}

export const TenantCtx = createContext<TenantContext>({
  tenantId: null,
  tenantName: null,
  role: null,
  loading: true,
});

export function useTenant() {
  const ctx = useContext(TenantCtx);
  return ctx;
}

export function useTenantQuery() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["tenant", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("tenant_members")
        .select("tenant_id, role, tenants(name)")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      if (error || !data) return null;

      const tenant = Array.isArray(data.tenants) ? data.tenants[0] : data.tenants;
      return {
        tenantId: data.tenant_id as string,
        tenantName: (tenant as Record<string, unknown>)?.name as string ?? "Unknown",
        role: data.role as string,
      };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}
