import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { createServiceClient, getAuthToken } from "../_shared/supabase.ts";

serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const authHeader = getAuthToken(req);
    if (!authHeader) return errorResponse("Missing authorization", 401);

    const { task_id, project_id } = await req.json();

    const serviceClient = createServiceClient();

    // If task_id provided: compute consensus for that task
    if (task_id) {
      const { data, error } = await serviceClient.rpc("compute_consensus", {
        p_task_id: task_id,
      });

      if (error) return errorResponse(error.message, 500);

      // Log event if consensus was computed
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

      return jsonResponse(data);
    }

    // If project_id provided: compute IAA for the entire project
    if (project_id) {
      const { data: iaa, error } = await serviceClient.rpc("calculate_iaa", {
        p_project_id: project_id,
      });

      if (error) return errorResponse(error.message, 500);

      return jsonResponse({
        project_id,
        iaa_score: iaa,
      });
    }

    return errorResponse("task_id or project_id is required");
  } catch (err) {
    return errorResponse(err.message, 500);
  }
});
