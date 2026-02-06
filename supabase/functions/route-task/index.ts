import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { createServiceClient, getAuthToken } from "../_shared/supabase.ts";

serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const authHeader = getAuthToken(req);
    if (!authHeader) return errorResponse("Missing authorization", 401);

    const { task_id } = await req.json();
    if (!task_id) return errorResponse("task_id is required");

    const serviceClient = createServiceClient();

    // Get task with its latest annotation confidence
    const { data: task, error: taskError } = await serviceClient
      .from("tasks")
      .select("*, projects(*)")
      .eq("id", task_id)
      .single();

    if (taskError || !task) return errorResponse("Task not found", 404);

    // Get latest annotation confidence
    const { data: annotations } = await serviceClient
      .from("annotations")
      .select("confidence")
      .eq("task_id", task_id)
      .order("created_at", { ascending: false })
      .limit(1);

    const latestConfidence = annotations?.[0]?.confidence ?? null;

    // Routing logic
    const HIGH_CONFIDENCE_THRESHOLD = 0.9;
    const LOW_CONFIDENCE_THRESHOLD = 0.5;

    let route: string;
    let newStatus: string;
    let reason: string;

    if (latestConfidence === null) {
      route = "human_review";
      newStatus = "in_review";
      reason = "No confidence score — requires human review";
    } else if (latestConfidence >= HIGH_CONFIDENCE_THRESHOLD) {
      route = "auto_accept";
      newStatus = "accepted";
      reason = `High confidence (${latestConfidence}) — auto-accepted`;
    } else if (latestConfidence < LOW_CONFIDENCE_THRESHOLD) {
      route = "escalate";
      newStatus = "escalated";
      reason = `Low confidence (${latestConfidence}) — escalated to specialist`;
    } else {
      route = "human_review";
      newStatus = "in_review";
      reason = `Medium confidence (${latestConfidence}) — routed to reviewer`;
    }

    // Update task status
    await serviceClient
      .from("tasks")
      .update({ status: newStatus, confidence: latestConfidence })
      .eq("id", task_id);

    // Log routing decision
    await serviceClient.from("event_log").insert({
      event_type: newStatus === "escalated" ? "task.escalated" : "task.completed",
      entity_type: "task",
      entity_id: task_id,
      payload: { route, confidence: latestConfidence, reason },
      tenant_id: task.tenant_id,
    });

    return jsonResponse({
      task_id,
      route,
      new_status: newStatus,
      confidence: latestConfidence,
      reason,
    });
  } catch (err) {
    return errorResponse(err.message, 500);
  }
});
