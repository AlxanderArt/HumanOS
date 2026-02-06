import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { handleCors, jsonResponse, errorResponse, parseJson } from "../_shared/cors.ts";
import { createServiceClient, createUserClient, getAuthToken } from "../_shared/supabase.ts";

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

    const { project_id, expires_in_minutes = 60 } = body;

    if (!project_id || typeof project_id !== "string" || !UUID_RE.test(project_id)) {
      return errorResponse(req, "Valid project_id (UUID) is required");
    }

    const expiry = Number(expires_in_minutes);
    if (!Number.isInteger(expiry) || expiry < 1 || expiry > 10080) {
      return errorResponse(req, "expires_in_minutes must be an integer between 1 and 10080");
    }

    const userClient = createUserClient(authHeader);
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return errorResponse(req, "Unauthorized", 401);

    const serviceClient = createServiceClient();

    const { data, error } = await serviceClient.rpc("assign_next_task", {
      p_project_id: project_id,
      p_assignee_id: user.id,
      p_expires_in_minutes: expiry,
    });

    if (error) {
      console.error("assign_next_task RPC error:", error);
      return errorResponse(req, "Failed to assign task", 500);
    }

    if (!data) {
      return jsonResponse(req, { assigned: false, message: "No tasks available" });
    }

    await serviceClient.from("event_log").insert({
      event_type: "task.assigned",
      entity_type: "task_assignment",
      entity_id: data,
      payload: { project_id, assignee_id: user.id },
      actor_id: user.id,
    });

    const { data: assignment } = await serviceClient
      .from("task_assignments")
      .select("*, tasks(*)")
      .eq("id", data)
      .single();

    return jsonResponse(req, { assigned: true, assignment });
  } catch (err) {
    console.error("assign-task error:", err);
    return errorResponse(req, "Internal server error", 500);
  }
});
