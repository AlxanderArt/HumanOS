import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { createServiceClient, createUserClient, getAuthToken } from "../_shared/supabase.ts";

serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const authHeader = getAuthToken(req);
    if (!authHeader) return errorResponse("Missing authorization", 401);

    const { task_id, labels, confidence, time_spent_ms } = await req.json();
    if (!task_id || !labels) return errorResponse("task_id and labels are required");

    const userClient = createUserClient(authHeader);
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return errorResponse("Unauthorized", 401);

    const serviceClient = createServiceClient();

    // Verify the task exists and user is assigned
    const { data: assignment } = await serviceClient
      .from("task_assignments")
      .select("id, task_id")
      .eq("task_id", task_id)
      .eq("assignee_id", user.id)
      .eq("status", "assigned")
      .single();

    if (!assignment) {
      // Check if task exists at all
      const { data: task } = await serviceClient
        .from("tasks")
        .select("id, tenant_id")
        .eq("id", task_id)
        .single();

      if (!task) return errorResponse("Task not found", 404);

      // Allow submission without assignment for flexibility
    }

    // Create annotation
    const { data: annotation, error: annotationError } = await serviceClient
      .from("annotations")
      .insert({
        task_id,
        annotator_id: user.id,
        labels,
        confidence: confidence ?? null,
        time_spent_ms: time_spent_ms ?? 0,
      })
      .select()
      .single();

    if (annotationError) return errorResponse(annotationError.message, 500);

    // Update assignment status
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

    // Check if this was a gold set task
    const { data: task } = await serviceClient
      .from("tasks")
      .select("is_gold, project_id, tenant_id")
      .eq("id", task_id)
      .single();

    let goldResult = null;

    if (task?.is_gold) {
      // Find matching gold set and score
      const { data: goldSet } = await serviceClient
        .from("gold_sets")
        .select("id, expected_labels")
        .eq("project_id", task.project_id)
        .limit(1)
        .single();

      if (goldSet) {
        const expectedStr = JSON.stringify(goldSet.expected_labels);
        const submittedStr = JSON.stringify(labels);
        const score = expectedStr === submittedStr ? 1.0 : 0.3;
        const passed = score >= 0.7;

        const { data: result } = await serviceClient
          .from("gold_set_results")
          .insert({
            gold_set_id: goldSet.id,
            annotator_id: user.id,
            submitted_labels: labels,
            score,
            passed,
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
      tenant_id: task?.tenant_id,
    });

    // Record cost if vendor workforce member
    const { data: workforce } = await serviceClient
      .from("workforce_members")
      .select("vendor_id")
      .eq("user_id", user.id)
      .single();

    if (workforce?.vendor_id) {
      const { data: vendor } = await serviceClient
        .from("vendors")
        .select("cost_per_task")
        .eq("id", workforce.vendor_id)
        .single();

      if (vendor?.cost_per_task) {
        await serviceClient.from("cost_ledger").insert({
          tenant_id: task?.tenant_id,
          task_id,
          vendor_id: workforce.vendor_id,
          annotator_id: user.id,
          amount: vendor.cost_per_task,
        });
      }
    }

    return jsonResponse({
      annotation,
      gold_result: goldResult,
    });
  } catch (err) {
    return errorResponse(err.message, 500);
  }
});
