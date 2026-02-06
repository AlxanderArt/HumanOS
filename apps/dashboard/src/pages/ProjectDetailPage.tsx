import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { formatNumber, formatPercent } from "@/lib/utils";
import { ListTodo, CheckCircle2, AlertTriangle, Clock } from "lucide-react";

interface TaskSummary {
  total: number;
  pending: number;
  active: number;
  completed: number;
  escalated: number;
}

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Record<string, unknown> | null>(null);
  const [taskSummary, setTaskSummary] = useState<TaskSummary>({ total: 0, pending: 0, active: 0, completed: 0, escalated: 0 });
  const [tasks, setTasks] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    if (projectId) loadProject(projectId);
  }, [projectId]);

  async function loadProject(id: string) {
    const [projectRes, tasksRes] = await Promise.all([
      supabase.from("projects").select("*").eq("id", id).single(),
      supabase.from("tasks").select("*").eq("project_id", id).order("priority", { ascending: false }),
    ]);

    setProject(projectRes.data);
    const t = tasksRes.data ?? [];
    setTasks(t);
    setTaskSummary({
      total: t.length,
      pending: t.filter((x) => x.status === "pending").length,
      active: t.filter((x) => ["assigned", "in_progress"].includes(x.status as string)).length,
      completed: t.filter((x) => x.status === "accepted").length,
      escalated: t.filter((x) => x.status === "escalated").length,
    });
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
      </div>
    );
  }

  const completionRate = taskSummary.total > 0 ? taskSummary.completed / taskSummary.total : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{project.name as string}</h1>
        <p className="text-[var(--color-muted-foreground)]">{project.description as string}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3">
            <ListTodo className="h-5 w-5 text-[var(--color-primary)]" />
            <div>
              <p className="text-xl font-bold">{formatNumber(taskSummary.total)}</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">Total Tasks</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-[var(--color-warning)]" />
            <div>
              <p className="text-xl font-bold">{formatNumber(taskSummary.pending)}</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-[var(--color-success)]" />
            <div>
              <p className="text-xl font-bold">{formatPercent(completionRate)}</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">Completion</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-[var(--color-destructive)]" />
            <div>
              <p className="text-xl font-bold">{formatNumber(taskSummary.escalated)}</p>
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
            {tasks.map((task) => (
              <div key={task.id as string} className="flex items-center justify-between rounded-lg border border-[var(--color-border)] p-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-[var(--color-muted-foreground)]">
                    {(task.id as string).slice(0, 8)}
                  </span>
                  <span className="text-sm">
                    {JSON.stringify(task.payload).slice(0, 60)}...
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">P{task.priority as number}</Badge>
                  <Badge variant={task.status === "accepted" ? "success" : task.status === "escalated" ? "destructive" : "default"}>
                    {task.status as string}
                  </Badge>
                </div>
              </div>
            ))}
            {tasks.length === 0 && (
              <p className="py-8 text-center text-sm text-[var(--color-muted-foreground)]">
                No tasks in this project yet.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
