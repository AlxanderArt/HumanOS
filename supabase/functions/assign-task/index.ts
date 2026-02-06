import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { createServiceClient, createUserClient, getAuthToken } from "../_shared/supabase.ts";

serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const authHeader = getAuthToken(req);
    if (!authHeader) return errorResponse("Missing authorization", 401);

    const { project_id, expires_in_minutes = 60 } = await req.json();
    if (!project_id) return errorResponse("project_id is required");

    // Get the requesting user
    const userClient = createUserClient(authHeader);
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return errorResponse("Unauthorized", 401);

    // Use service client for assignment (needs to bypass RLS for atomic operation)
    const serviceClient = createServiceClient();

    // Call the assign_next_task database function
    const { data, error } = await serviceClient.rpc("assign_next_task", {
      p_project_id: project_id,
      p_assignee_id: user.id,
      p_expires_in_minutes: expires_in_minutes,
    });

    if (error) return errorResponse(error.message, 500);

    if (!data) {
      return jsonResponse({ assigned: false, message: "No tasks available" });
    }

    // Log the event
    await serviceClient.from("event_log").insert({
      event_type: "task.assigned",
      entity_type: "task_assignment",
      entity_id: data,
      payload: { project_id, assignee_id: user.id },
      actor_id: user.id,
    });

    // Fetch the assigned task details
    const { data: assignment } = await serviceClient
      .from("task_assignments")
      .select("*, tasks(*)")
      .eq("id", data)
      .single();

    return jsonResponse({ assigned: true, assignment });
  } catch (err) {
    return errorResponse(err.message, 500);
  }
});
