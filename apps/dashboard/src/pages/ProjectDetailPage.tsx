import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useProject, useTasks } from "@/hooks/use-queries";
import { formatNumber, formatPercent } from "@/lib/utils";
import { ListTodo, CheckCircle2, AlertTriangle, Clock, ArrowLeft, AlertCircle } from "lucide-react";

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project, isLoading: loadingProject, error: projectError } = useProject(projectId);
  const { data: tasks = [], isLoading: loadingTasks } = useTasks(projectId);

  const isLoading = loadingProject || loadingTasks;

  if (projectError) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="mb-4 h-12 w-12 text-[var(--color-destructive)]" aria-hidden="true" />
        <h2 className="text-lg font-semibold">Project not found</h2>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          This project may have been deleted or you don't have access.
        </p>
        <Link to="/projects" className="mt-4">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Back to Projects
          </Button>
        </Link>
      </div>
    );
  }

  if (isLoading || !project) {
    return (
      <div className="flex items-center justify-center py-20" role="status" aria-label="Loading project">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
      </div>
    );
  }

  const total = tasks.length;
  const pending = tasks.filter((x: Record<string, unknown>) => x.status === "pending").length;
  const completed = tasks.filter((x: Record<string, unknown>) => x.status === "accepted").length;
  const escalated = tasks.filter((x: Record<string, unknown>) => x.status === "escalated").length;
  const completionRate = total > 0 ? completed / total : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <Link
            to="/projects"
            className="mb-2 inline-flex items-center gap-1 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Projects
          </Link>
          <h1 className="truncate text-lg font-bold md:text-2xl">{project.name}</h1>
          {project.description && (
            <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{project.description}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3">
            <ListTodo className="h-5 w-5 text-[var(--color-primary)]" aria-hidden="true" />
            <div>
              <p className="text-xl font-bold">{formatNumber(total)}</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">Total Tasks</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-[var(--color-warning)]" aria-hidden="true" />
            <div>
              <p className="text-xl font-bold">{formatNumber(pending)}</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-[var(--color-success)]" aria-hidden="true" />
            <div>
              <p className="text-xl font-bold">{formatPercent(completionRate)}</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">Completion</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-[var(--color-destructive)]" aria-hidden="true" />
            <div>
              <p className="text-xl font-bold">{formatNumber(escalated)}</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">Escalated</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {tasks.map((task: Record<string, unknown>) => (
              <div key={task.id as string} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-border)] p-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="shrink-0 font-mono text-xs text-[var(--color-muted-foreground)]">
                    {(task.id as string).slice(0, 8)}
                  </span>
                  <span className="truncate text-sm">
                    {JSON.stringify(task.payload).slice(0, 60)}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="outline">P{task.priority as number}</Badge>
                  <Badge variant={task.status === "accepted" ? "success" : task.status === "escalated" ? "destructive" : "default"}>
                    {task.status as string}
                  </Badge>
                </div>
              </div>
            ))}
            {tasks.length === 0 && (
              <p className="py-8 text-center text-sm text-[var(--color-muted-foreground)]">
                No tasks in this project yet. Tasks will appear here once created.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
