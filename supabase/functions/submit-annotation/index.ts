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

    const { task_id, labels, confidence, time_spent_ms } = body;

    if (!task_id || typeof task_id !== "string" || !UUID_RE.test(task_id as string)) {
      return errorResponse(req, "Valid task_id (UUID) is required");
    }
    if (!labels || typeof labels !== "object") {
      return errorResponse(req, "labels object is required");
    }
    if (confidence !== undefined && confidence !== null) {
      const conf = Number(confidence);
      if (isNaN(conf) || conf < 0 || conf > 1) {
        return errorResponse(req, "confidence must be a number between 0 and 1");
      }
    }

    const userClient = createUserClient(authHeader);
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return errorResponse(req, "Unauthorized", 401);

    const serviceClient = createServiceClient();

    // Fetch task with all needed fields in one query
    const { data: task } = await serviceClient
      .from("tasks")
      .select("id, is_gold, project_id, tenant_id")
      .eq("id", task_id)
      .single();

    if (!task) return errorResponse(req, "Task not found", 404);

    // Check assignment
    const { data: assignment } = await serviceClient
      .from("task_assignments")
      .select("id")
      .eq("task_id", task_id)
      .eq("assignee_id", user.id)
      .eq("status", "assigned")
      .maybeSingle();

    // Create annotation
    const { data: annotation, error: annotationError } = await serviceClient
      .from("annotations")
      .insert({
        task_id,
        annotator_id: user.id,
        labels,
        confidence: confidence ?? null,
        time_spent_ms: Number(time_spent_ms) || 0,
      })
      .select()
      .single();

    if (annotationError) {
      console.error("Annotation insert error:", annotationError);
      return errorResponse(req, "Failed to create annotation", 500);
    }

    // Update assignment if exists
    if (assignment) {
      await serviceClient
        .from("task_assignments")
        .update({ status: "submitted", completed_at: new Date().toISOString() })
        .eq("id", assignment.id);
    }

    // Update task status
    await serviceClient
      .from("tasks")
      .update({ status: "submitted" })
      .eq("id", task_id);

    // Gold set check
    let goldResult = null;
    if (task.is_gold) {
      const { data: goldSet } = await serviceClient
        .from("gold_sets")
        .select("id, expected_labels")
        .eq("project_id", task.project_id)
        .limit(1)
        .maybeSingle();

      if (goldSet) {
        const score = JSON.stringify(goldSet.expected_labels) === JSON.stringify(labels) ? 1.0 : 0.3;
        const { data: result } = await serviceClient
          .from("gold_set_results")
          .insert({
            gold_set_id: goldSet.id,
            annotator_id: user.id,
            submitted_labels: labels,
            score,
            passed: score >= 0.7,
          })
          .select()
          .single();
        goldResult = result;
      }
    }

    // Log event
    await serviceClient.from("event_log").insert({
      event_type: "annotation.submitted",
      entity_type: "annotation",
      entity_id: annotation.id,
      payload: { task_id, annotator_id: user.id, confidence },
      actor_id: user.id,
      tenant_id: task.tenant_id,
    });

    // Record cost — single join query
    const { data: workforce } = await serviceClient
      .from("workforce_members")
      .select("vendor_id, vendors(cost_per_task)")
      .eq("user_id", user.id)
      .maybeSingle();

    if (workforce?.vendor_id) {
      const vendor = Array.isArray(workforce.vendors) ? workforce.vendors[0] : workforce.vendors;
      const costPerTask = (vendor as Record<string, unknown>)?.cost_per_task as number | null;
      if (costPerTask) {
        await serviceClient.from("cost_ledger").insert({
          tenant_id: task.tenant_id,
          task_id,
          vendor_id: workforce.vendor_id,
          annotator_id: user.id,
          amount: costPerTask,
        });
      }
    }

    return jsonResponse(req, { annotation, gold_result: goldResult });
  } catch (err) {
    console.error("submit-annotation error:", err);
    return errorResponse(req, "Internal server error", 500);
  }
});
