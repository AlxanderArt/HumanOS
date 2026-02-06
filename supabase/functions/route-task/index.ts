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

    const { task_id } = body;
    if (!task_id || typeof task_id !== "string" || !UUID_RE.test(task_id as string)) {
      return errorResponse(req, "Valid task_id (UUID) is required");
    }

    const serviceClient = createServiceClient();

    const { data: task, error: taskError } = await serviceClient
      .from("tasks")
      .select("id, tenant_id")
      .eq("id", task_id)
      .single();

    if (taskError || !task) return errorResponse(req, "Task not found", 404);

    const { data: annotations } = await serviceClient
      .from("annotations")
      .select("confidence")
      .eq("task_id", task_id)
      .order("created_at", { ascending: false })
      .limit(1);

    const latestConfidence = annotations?.[0]?.confidence ?? null;

    const HIGH = 0.9;
    const LOW = 0.5;

    let route: string;
    let newStatus: string;
    let reason: string;

    if (latestConfidence === null) {
      route = "human_review";
      newStatus = "in_review";
      reason = "No confidence score — requires human review";
    } else if (latestConfidence >= HIGH) {
      route = "auto_accept";
      newStatus = "accepted";
      reason = `High confidence (${latestConfidence}) — auto-accepted`;
    } else if (latestConfidence < LOW) {
      route = "escalate";
      newStatus = "escalated";
      reason = `Low confidence (${latestConfidence}) — escalated to specialist`;
    } else {
      route = "human_review";
      newStatus = "in_review";
      reason = `Medium confidence (${latestConfidence}) — routed to reviewer`;
    }

    await serviceClient
      .from("tasks")
      .update({ status: newStatus, confidence: latestConfidence })
      .eq("id", task_id);

    await serviceClient.from("event_log").insert({
      event_type: newStatus === "escalated" ? "task.escalated" : "task.completed",
      entity_type: "task",
      entity_id: task_id,
      payload: { route, confidence: latestConfidence, reason },
      tenant_id: task.tenant_id,
    });

    return jsonResponse(req, { task_id, route, new_status: newStatus, confidence: latestConfidence, reason });
  } catch (err) {
    console.error("route-task error:", err);
    return errorResponse(req, "Internal server error", 500);
  }
});
