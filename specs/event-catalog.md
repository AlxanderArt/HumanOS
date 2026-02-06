# Event Catalog

All platform events flow through the `event_log` table and are consumed by workers via polling or Supabase Realtime subscriptions.

## Task Events

| Event | Producer | Consumers | Description |
|-------|----------|-----------|-------------|
| `task.created` | Dashboard / API | Workflow Engine | New task added to a project |
| `task.assigned` | assign-task function | Dashboard (realtime) | Task assigned to an annotator |
| `task.completed` | route-task function | Workflow Engine | Task accepted after routing |
| `task.escalated` | route-task function | Dashboard (alerts) | Low-confidence task escalated |

## Annotation Events

| Event | Producer | Consumers | Description |
|-------|----------|-----------|-------------|
| `annotation.submitted` | submit-annotation function | Quality Scorer | Annotator submitted labels |
| `annotation.reviewed` | Dashboard | Workflow Engine | Reviewer approved/rejected annotation |

## Quality Events

| Event | Producer | Consumers | Description |
|-------|----------|-----------|-------------|
| `quality.computed` | Quality Scorer | Workflow Engine | Quality metrics calculated |
| `consensus.reached` | compute-quality function | Workflow Engine, Dashboard | Consensus achieved for a task |
| `drift.detected` | Quality Scorer | Dashboard (alerts) | Label distribution drift detected |

## Workflow Events

| Event | Producer | Consumers | Description |
|-------|----------|-----------|-------------|
| `workflow.stage.advanced` | Workflow Engine | Dashboard (realtime) | Task moved to next workflow stage |
| `workflow.completed` | Workflow Engine | Dashboard | Workflow finished for a task |

## Agent Events

| Event | Producer | Consumers | Description |
|-------|----------|-----------|-------------|
| `agent.trace.ingested` | ingest-agent-trace function | Dashboard | Agent trajectory stored for evaluation |
| `agent.eval.completed` | Dashboard | Quality Scorer | Human evaluation of agent trace completed |

## Vendor Events

| Event | Producer | Consumers | Description |
|-------|----------|-----------|-------------|
| `vendor.cost.recorded` | submit-annotation function | Dashboard | Cost recorded for completed task |
