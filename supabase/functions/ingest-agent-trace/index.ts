import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { createServiceClient, createUserClient, getAuthToken } from "../_shared/supabase.ts";

serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const authHeader = getAuthToken(req);
    if (!authHeader) return errorResponse("Missing authorization", 401);

    const userClient = createUserClient(authHeader);
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return errorResponse("Unauthorized", 401);

    const {
      agent_id,
      agent_version,
      session_id,
      trajectory,
      metadata,
      confidence,
      tenant_id,
    } = await req.json();

    if (!agent_id || !session_id || !trajectory) {
      return errorResponse("agent_id, session_id, and trajectory are required");
    }

    if (!Array.isArray(trajectory) || trajectory.length === 0) {
      return errorResponse("trajectory must be a non-empty array");
    }

    const serviceClient = createServiceClient();

    // Resolve tenant_id from user's membership if not provided
    let resolvedTenantId = tenant_id;
    if (!resolvedTenantId) {
      const { data: membership } = await serviceClient
        .from("tenant_members")
        .select("tenant_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      resolvedTenantId = membership?.tenant_id;
    }

    if (!resolvedTenantId) {
      return errorResponse("Could not resolve tenant_id", 400);
    }

    // Store the trace
    const { data: trace, error: traceError } = await serviceClient
      .from("agent_traces")
      .insert({
        tenant_id: resolvedTenantId,
        agent_id,
        agent_version: agent_version ?? null,
        session_id,
        trajectory,
        metadata: metadata ?? {},
        confidence: confidence ?? null,
      })
      .select()
      .single();

    if (traceError) return errorResponse(traceError.message, 500);

    // Log event
    await serviceClient.from("event_log").insert({
      event_type: "agent.trace.ingested",
      entity_type: "agent_trace",
      entity_id: trace.id,
      payload: {
        agent_id,
        session_id,
        step_count: trajectory.length,
      },
      actor_id: user.id,
      tenant_id: resolvedTenantId,
    });

    return jsonResponse({
      trace_id: trace.id,
      step_count: trajectory.length,
    });
  } catch (err) {
    return errorResponse(err.message, 500);
  }
});
