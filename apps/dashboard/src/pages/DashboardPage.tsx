import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProjects, useTasks, useEvents, useQualityScores } from "@/hooks/use-queries";
import { formatNumber, formatPercent, formatRelativeTime } from "@/lib/utils";
import {
  FolderKanban,
  ListTodo,
  ShieldCheck,
  Users,
  TrendingUp,
  Activity,
  AlertCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function DashboardPage() {
  const { data: projects = [], isLoading: loadingProjects, error: projectsError } = useProjects();
  const { data: tasks = [], isLoading: loadingTasks } = useTasks();
  const { data: events = [] } = useEvents();
  const { data: qualityScores = [] } = useQualityScores();

  const isLoading = loadingProjects || loadingTasks;

  const pendingTasks = tasks.filter((t: Record<string, unknown>) => t.status === "pending").length;
  const avgQuality = qualityScores.length > 0
    ? qualityScores.reduce((sum: number, q: Record<string, unknown>) => sum + ((q.accuracy as number) ?? 0), 0) / qualityScores.length
    : 0;

  const projectData = projects.map((p: Record<string, unknown>) => {
    const projectTasks = tasks.filter((t: Record<string, unknown>) => t.project_id === p.id);
    const name = (p.name as string) ?? "";
    return {
      name: name.length > 15 ? name.slice(0, 15) + "..." : name,
      tasks: projectTasks.length,
      completed: projectTasks.filter((t: Record<string, unknown>) => t.status === "accepted").length,
    };
  });

  const kpis = [
    { label: "Active Projects", value: formatNumber(projects.length), icon: FolderKanban, color: "text-[var(--color-primary)]" },
    { label: "Pending Tasks", value: formatNumber(pendingTasks), icon: ListTodo, color: "text-[var(--color-warning)]" },
    { label: "Avg Quality", value: avgQuality > 0 ? formatPercent(avgQuality) : "—", icon: ShieldCheck, color: "text-[var(--color-success)]" },
    { label: "Total Tasks", value: formatNumber(tasks.length), icon: Users, color: "text-[var(--color-accent)]" },
  ];

  if (projectsError) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="mb-4 h-12 w-12 text-[var(--color-destructive)]" aria-hidden="true" />
        <h2 className="text-lg font-semibold">Failed to load dashboard</h2>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          Check your connection and try refreshing the page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div>
        <h1 className="text-lg font-bold md:text-2xl">Dashboard</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">Platform overview and key metrics</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="flex items-center gap-4">
              <div className={`rounded-lg bg-[var(--color-muted)] p-3 ${kpi.color}`}>
                <kpi.icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                {isLoading ? (
                  <div className="h-7 w-16 animate-pulse rounded bg-[var(--color-muted)]" />
                ) : (
                  <p className="text-2xl font-bold">{kpi.value}</p>
                )}
                <p className="text-sm text-[var(--color-muted-foreground)]">{kpi.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" aria-hidden="true" />
              Project Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            {projectData.length === 0 ? (
              <p className="py-8 text-center text-sm text-[var(--color-muted-foreground)]">No project data yet</p>
            ) : (
              <div role="img" aria-label="Bar chart showing task completion per project">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={projectData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="name" tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
                    <YAxis tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--color-card)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="tasks" fill="var(--color-primary)" radius={[4, 4, 0, 0]} name="Total Tasks" />
                    <Bar dataKey="completed" fill="var(--color-success)" radius={[4, 4, 0, 0]} name="Completed" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4" aria-hidden="true" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {events.length === 0 && (
                <p className="py-8 text-center text-sm text-[var(--color-muted-foreground)]">No recent activity</p>
              )}
              {(events as Array<Record<string, unknown>>).map((event) => (
                <div key={event.id as string} className="flex items-center justify-between border-b border-[var(--color-border)] pb-3 last:border-0">
                  <Badge variant={(event.event_type as string).includes("error") ? "destructive" : "default"}>
                    {event.event_type as string}
                  </Badge>
                  <span className="text-xs text-[var(--color-muted-foreground)]">
                    {formatRelativeTime(event.created_at as string)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
