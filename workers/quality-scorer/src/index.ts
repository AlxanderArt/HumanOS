import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const POLL_INTERVAL_MS = 2000;
const MAX_RETRIES = 3;

interface QualityJob {
  id: string;
  event_type: string;
  payload: {
    annotation_id?: string;
    task_id?: string;
    annotator_id?: string;
  };
}

async function processAnnotationQuality(job: QualityJob) {
  const { task_id, annotator_id } = job.payload;
  if (!task_id) return;

  // Get all annotations for this task
  const { data: annotations } = await supabase
    .from("annotations")
    .select("id, labels, annotator_id, confidence")
    .eq("task_id", task_id);

  if (!annotations || annotations.length === 0) return;

  // Get task details
  const { data: task } = await supabase
    .from("tasks")
    .select("project_id, tenant_id, is_gold")
    .eq("id", task_id)
    .single();

  if (!task) return;

  // Get consensus config
  const { data: config } = await supabase
    .from("consensus_configs")
    .select("min_annotators, agreement_threshold, method")
    .eq("project_id", task.project_id)
    .single();

  const minAnnotators = config?.min_annotators ?? 2;

  // Check if we have enough annotations for consensus
  if (annotations.length >= minAnnotators) {
    // Compute simple agreement score
    const labelStrings = annotations.map((a) => JSON.stringify(a.labels));
    const mostCommon = labelStrings
      .sort((a, b) =>
        labelStrings.filter((v) => v === b).length -
        labelStrings.filter((v) => v === a).length
      )[0];

    const agreementCount = labelStrings.filter((l) => l === mostCommon).length;
    const agreementScore = agreementCount / annotations.length;

    // Store consensus result
    await supabase.from("consensus_results").insert({
      task_id,
      consensus_labels: JSON.parse(mostCommon),
      agreement_score: agreementScore,
      method: config?.method ?? "majority_vote",
      annotator_count: annotations.length,
    });

    // Log event
    await supabase.from("event_log").insert({
      event_type: "quality.computed",
      entity_type: "task",
      entity_id: task_id,
      payload: { agreement_score: agreementScore, annotator_count: annotations.length },
      tenant_id: task.tenant_id,
    });

    console.log(
      `[quality-scorer] Consensus computed for task ${task_id}: agreement=${agreementScore.toFixed(2)}`
    );
  }
}

async function pollAndProcess() {
  // Fetch unprocessed annotation events
  const { data: jobs } = await supabase
    .from("event_log")
    .select("id, event_type, payload")
    .eq("event_type", "annotation.submitted")
    .eq("processed", false)
    .order("created_at", { ascending: true })
    .limit(10);

  if (!jobs || jobs.length === 0) return;

  for (const job of jobs) {
    try {
      await processAnnotationQuality(job as QualityJob);

      // Mark as processed
      await supabase
        .from("event_log")
        .update({ processed: true, processed_at: new Date().toISOString() })
        .eq("id", job.id);
    } catch (err) {
      console.error(`[quality-scorer] Failed to process job ${job.id}:`, err);

      // Increment attempts
      await supabase.rpc("increment_event_attempts", {
        event_id: job.id,
        error_message: err instanceof Error ? err.message : String(err),
      });
    }
  }
}

async function main() {
  console.log("[quality-scorer] Worker started");
  console.log(`[quality-scorer] Polling every ${POLL_INTERVAL_MS}ms`);

  while (true) {
    try {
      await pollAndProcess();
    } catch (err) {
      console.error("[quality-scorer] Loop error:", err);
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
}

main();
