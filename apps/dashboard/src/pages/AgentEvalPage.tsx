import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Cpu, ShieldAlert, Wrench } from "lucide-react";

export function AgentEvalPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold md:text-2xl">Agent Evaluation</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Score agent trajectories, tool use, and safety compliance
        </p>
      </div>

      <div className="rounded-lg border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/5 p-4 text-sm text-[var(--color-warning)]">
        This module is under development. Agent traces can be ingested via the API — the evaluation UI is coming soon.
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3">
            <Bot className="h-5 w-5 text-[var(--color-primary)]" aria-hidden="true" />
            <div>
              <p className="text-xl font-bold">—</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">Agent Traces</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <Cpu className="h-5 w-5 text-[var(--color-accent)]" aria-hidden="true" />
            <div>
              <p className="text-xl font-bold">—</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">Evaluations</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <Wrench className="h-5 w-5 text-[var(--color-warning)]" aria-hidden="true" />
            <div>
              <p className="text-xl font-bold">—</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">Tool Assessments</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 text-[var(--color-destructive)]" aria-hidden="true" />
            <div>
              <p className="text-xl font-bold">—</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">Safety Flags</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Evaluation Workbench</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 md:py-16">
          <Bot className="mb-4 h-16 w-16 text-[var(--color-muted-foreground)]" aria-hidden="true" />
          <h3 className="text-lg font-semibold">Coming Soon</h3>
          <p className="mt-2 max-w-md text-center text-sm text-[var(--color-muted-foreground)]">
            The Agent Evaluation workbench will let you step through agent trajectories,
            score tool-use decisions, grade planning quality, and flag safety concerns.
            Agent traces can be ingested via the <Badge variant="outline">ingest-agent-trace</Badge> edge function.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <div className="rounded-lg border border-[var(--color-border)] p-4">
              <h4 className="font-medium text-[var(--color-primary)]">Trajectory Labeling</h4>
              <p className="mt-1 text-[var(--color-muted-foreground)]">Step-by-step review of agent decisions and actions</p>
            </div>
            <div className="rounded-lg border border-[var(--color-border)] p-4">
              <h4 className="font-medium text-[var(--color-primary)]">Tool-Use Scoring</h4>
              <p className="mt-1 text-[var(--color-muted-foreground)]">Rate correctness and necessity of each tool call</p>
            </div>
            <div className="rounded-lg border border-[var(--color-border)] p-4">
              <h4 className="font-medium text-[var(--color-primary)]">Safety Review</h4>
              <p className="mt-1 text-[var(--color-muted-foreground)]">Flag harmful actions, data leaks, or guardrail violations</p>
            </div>
            <div className="rounded-lg border border-[var(--color-border)] p-4">
              <h4 className="font-medium text-[var(--color-primary)]">RLHF Dataset</h4>
              <p className="mt-1 text-[var(--color-muted-foreground)]">Generate training signals from human evaluation scores</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
