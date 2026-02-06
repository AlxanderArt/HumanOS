import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useTenant } from "./use-tenant";

export function useProjects() {
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: ["projects", tenantId],
    queryFn: async () => {
      const query = supabase.from("projects").select("*").order("created_at", { ascending: false });
      if (tenantId) query.eq("tenant_id", tenantId);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!tenantId,
  });
}

export function useProject(projectId: string | undefined) {
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: ["project", projectId, tenantId],
    queryFn: async () => {
      if (!projectId) return null;
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!projectId && !!tenantId,
  });
}

export function useTasks(projectId?: string) {
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: ["tasks", projectId, tenantId],
    queryFn: async () => {
      let query = supabase.from("tasks").select("*").order("priority", { ascending: false });
      if (projectId) query = query.eq("project_id", projectId);
      if (tenantId) query = query.eq("tenant_id", tenantId);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!tenantId,
  });
}

export function useEvents(limit = 10) {
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: ["events", tenantId, limit],
    queryFn: async () => {
      const query = supabase
        .from("event_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (tenantId) query.eq("tenant_id", tenantId);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!tenantId,
  });
}

export function useGoldSets() {
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: ["gold-sets", tenantId],
    queryFn: async () => {
      const query = supabase.from("gold_sets").select("*, gold_set_results(*)").limit(50);
      if (tenantId) query.eq("tenant_id", tenantId);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!tenantId,
  });
}

export function useDriftSnapshots() {
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: ["drift-snapshots", tenantId],
    queryFn: async () => {
      const query = supabase
        .from("drift_snapshots")
        .select("*")
        .order("detected_at", { ascending: false })
        .limit(20);
      if (tenantId) query.eq("tenant_id", tenantId);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!tenantId,
  });
}

export function useVendors() {
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: ["vendors", tenantId],
    queryFn: async () => {
      const query = supabase.from("vendors").select("*").order("name");
      if (tenantId) query.eq("tenant_id", tenantId);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!tenantId,
  });
}

export function useWorkforceCount() {
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: ["workforce-count", tenantId],
    queryFn: async () => {
      const query = supabase.from("workforce_members").select("id", { count: "exact", head: true });
      if (tenantId) query.eq("tenant_id", tenantId);
      const { count, error } = await query;
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!tenantId,
  });
}

export function useCostLedger() {
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: ["cost-ledger", tenantId],
    queryFn: async () => {
      const query = supabase.from("cost_ledger").select("amount");
      if (tenantId) query.eq("tenant_id", tenantId);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).reduce((sum, c) => sum + (c.amount || 0), 0);
    },
    enabled: !!tenantId,
  });
}

export function useQualityScores() {
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: ["quality-scores", tenantId],
    queryFn: async () => {
      const query = supabase.from("quality_scores").select("*").order("computed_at", { ascending: false }).limit(50);
      if (tenantId) query.eq("tenant_id", tenantId);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!tenantId,
  });
}

export function useNextTask() {
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: ["next-task", tenantId],
    queryFn: async () => {
      const query = supabase
        .from("tasks")
        .select("id, payload, priority, projects(name, task_schema, labeling_instructions)")
        .eq("status", "pending")
        .order("priority", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (tenantId) query.eq("tenant_id", tenantId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });
}
