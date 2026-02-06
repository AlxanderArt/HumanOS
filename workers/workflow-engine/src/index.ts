import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const POLL_INTERVAL_MS = 3000;

interface WorkflowEvent {
  id: string;
  event_type: string;
  payload: {
    task_id?: string;
    instance_id?: string;
    consensus_labels?: Record<string, unknown>;
    agreement_score?: number;
  };
}

async function advanceWorkflow(event: WorkflowEvent) {
  const { task_id } = event.payload;
  if (!task_id) return;

  // Find active workflow instance for this task
  const { data: instance } = await supabase
    .from("workflow_instances")
    .select("*, workflow_templates(*)")
    .eq("task_id", task_id)
    .eq("status", "active")
    .single();

  if (!instance) return;

  const template = instance.workflow_templates;
  const stages = (template?.stages as Array<{ order: number; type: string; name: string; config?: Record<string, unknown> }>) ?? [];
  const currentStage = instance.current_stage;
  const nextStage = currentStage + 1;

  // Check if there are more stages
  if (nextStage >= stages.length) {
    // Workflow complete
    await supabase
      .from("workflow_instances")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", instance.id);

    await supabase.from("event_log").insert({
      event_type: "workflow.completed",
      entity_type: "workflow_instance",
      entity_id: instance.id,
      payload: { task_id, final_stage: currentStage },
    });

    console.log(`[workflow-engine] Workflow ${instance.id} completed for task ${task_id}`);
    return;
  }

  // Record transition
  await supabase.from("stage_transitions").insert({
    instance_id: instance.id,
    from_stage: currentStage,
    to_stage: nextStage,
    reason: `Auto-advanced after ${event.event_type}`,
  });

  // Advance to next stage
  await supabase
    .from("workflow_instances")
    .update({ current_stage: nextStage })
    .eq("id", instance.id);

  await supabase.from("event_log").insert({
    event_type: "workflow.stage.advanced",
    entity_type: "workflow_instance",
    entity_id: instance.id,
    payload: {
      task_id,
      from_stage: currentStage,
      to_stage: nextStage,
      stage_name: stages[nextStage]?.name,
    },
  });

  console.log(
    `[workflow-engine] Task ${task_id}: stage ${currentStage} → ${nextStage} (${stages[nextStage]?.name})`
  );
}

async function pollAndProcess() {
  // Watch for events that could trigger workflow advancement
  const { data: events } = await supabase
    .from("event_log")
    .select("id, event_type, payload")
    .in("event_type", ["consensus.reached", "annotation.reviewed", "quality.computed"])
    .eq("processed", false)
    .order("created_at", { ascending: true })
    .limit(10);

  if (!events || events.length === 0) return;

  for (const event of events) {
    try {
      await advanceWorkflow(event as WorkflowEvent);

      await supabase
        .from("event_log")
        .update({ processed: true, processed_at: new Date().toISOString() })
        .eq("id", event.id);
    } catch (err) {
      console.error(`[workflow-engine] Failed to process event ${event.id}:`, err);

      await supabase.rpc("increment_event_attempts", {
        event_id: event.id,
        error_message: err instanceof Error ? err.message : String(err),
      });
    }
  }
}

async function main() {
  console.log("[workflow-engine] Worker started");
  console.log(`[workflow-engine] Polling every ${POLL_INTERVAL_MS}ms`);

  while (true) {
    try {
      await pollAndProcess();
    } catch (err) {
      console.error("[workflow-engine] Loop error:", err);
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
}

main();
