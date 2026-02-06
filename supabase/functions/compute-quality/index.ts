import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { handleCors, jsonResponse, errorResponse, parseJson } from "../_shared/cors.ts";
import { createServiceClient, getAuthToken } from "../_shared/supabase.ts";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const authHeader = getAuthToken(req);
    if (!authHeader) return errorResponse(req, "Missing authorization", 401);

    let body: Record<string, unknown>;
    try {
      body = await parseJson(req);
    } catch {
      return errorResponse(req, "Invalid JSON in request body");
    }

    const { task_id, project_id } = body;

    if (!task_id && !project_id) {
      return errorResponse(req, "Either task_id or project_id is required");
    }
    if (task_id && (typeof task_id !== "string" || !UUID_RE.test(task_id as string))) {
      return errorResponse(req, "task_id must be a valid UUID");
    }
    if (project_id && (typeof project_id !== "string" || !UUID_RE.test(project_id as string))) {
      return errorResponse(req, "project_id must be a valid UUID");
    }

    const serviceClient = createServiceClient();

    if (task_id) {
      const { data, error } = await serviceClient.rpc("compute_consensus", { p_task_id: task_id });
      if (error) {
        console.error("compute_consensus RPC error:", error);
        return errorResponse(req, "Failed to compute consensus", 500);
      }

      if (data?.status === "computed") {
        const { data: task } = await serviceClient
          .from("tasks")
          .select("tenant_id")
          .eq("id", task_id)
          .single();

        await serviceClient.from("event_log").insert({
          event_type: "consensus.reached",
          entity_type: "task",
          entity_id: task_id,
          payload: data,
          tenant_id: task?.tenant_id,
        });
      }

      return jsonResponse(req, data);
    }

    if (project_id) {
      const { data: iaa, error } = await serviceClient.rpc("calculate_iaa", { p_project_id: project_id });
      if (error) {
        console.error("calculate_iaa RPC error:", error);
        return errorResponse(req, "Failed to calculate IAA", 500);
      }
      return jsonResponse(req, { project_id, iaa_score: iaa });
    }

    return errorResponse(req, "Either task_id or project_id is required");
  } catch (err) {
    console.error("compute-quality error:", err);
    return errorResponse(req, "Internal server error", 500);
  }
});
