import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { handleCors, jsonResponse, errorResponse, parseJson } from "../_shared/cors.ts";
import { createServiceClient, createUserClient, getAuthToken } from "../_shared/supabase.ts";

serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const authHeader = getAuthToken(req);
    if (!authHeader) return errorResponse(req, "Missing authorization", 401);

    const userClient = createUserClient(authHeader);
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return errorResponse(req, "Unauthorized", 401);

    let body: Record<string, unknown>;
    try {
      body = await parseJson(req);
    } catch {
      return errorResponse(req, "Invalid JSON in request body");
    }

    const { agent_id, agent_version, session_id, trajectory, metadata, confidence, tenant_id } = body;

    if (!agent_id || typeof agent_id !== "string") {
      return errorResponse(req, "agent_id (string) is required");
    }
    if (!session_id || typeof session_id !== "string") {
      return errorResponse(req, "session_id (string) is required");
    }
    if (!Array.isArray(trajectory) || trajectory.length === 0) {
      return errorResponse(req, "trajectory must be a non-empty array");
    }
    if (confidence !== undefined && confidence !== null) {
      const conf = Number(confidence);
      if (isNaN(conf) || conf < 0 || conf > 1) {
        return errorResponse(req, "confidence must be between 0 and 1");
      }
    }

    const serviceClient = createServiceClient();

    let resolvedTenantId = tenant_id as string | undefined;
    if (!resolvedTenantId) {
      const { data: membership } = await serviceClient
        .from("tenant_members")
        .select("tenant_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();
      resolvedTenantId = membership?.tenant_id;
    }

    if (!resolvedTenantId) {
      return errorResponse(req, "Could not resolve tenant_id", 400);
    }

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

    if (traceError) {
      console.error("agent_traces insert error:", traceError);
      return errorResponse(req, "Failed to store trace", 500);
    }

    await serviceClient.from("event_log").insert({
      event_type: "agent.trace.ingested",
      entity_type: "agent_trace",
      entity_id: trace.id,
      payload: { agent_id, session_id, step_count: trajectory.length },
      actor_id: user.id,
      tenant_id: resolvedTenantId,
    });

    return jsonResponse(req, { trace_id: trace.id, step_count: trajectory.length });
  } catch (err) {
    console.error("ingest-agent-trace error:", err);
    return errorResponse(req, "Internal server error", 500);
  }
});
