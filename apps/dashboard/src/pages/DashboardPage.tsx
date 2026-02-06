import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { formatNumber, formatPercent, formatCurrency, formatRelativeTime } from "@/lib/utils";
import {
  FolderKanban,
  ListTodo,
  ShieldCheck,
  Users,
  TrendingUp,
  Activity,
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

interface DashboardStats {
  totalProjects: number;
  pendingTasks: number;
  avgQuality: number;
  activeAnnotators: number;
  totalCost: number;
}

interface RecentEvent {
  id: string;
  event_type: string;
  created_at: string;
  payload: Record<string, unknown>;
}

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    pendingTasks: 0,
    avgQuality: 0,
    activeAnnotators: 0,
    totalCost: 0,
  });
  const [events, setEvents] = useState<RecentEvent[]>([]);
  const [projectData, setProjectData] = useState<Array<{ name: string; tasks: number; completed: number }>>([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    const [projectsRes, tasksRes, eventsRes] = await Promise.all([
      supabase.from("projects").select("id, name, status"),
      supabase.from("tasks").select("id, status, project_id"),
      supabase.from("event_log").select("*").order("created_at", { ascending: false }).limit(10),
    ]);

    const projects = projectsRes.data ?? [];
    const tasks = tasksRes.data ?? [];

    setStats({
      totalProjects: projects.length,
      pendingTasks: tasks.filter((t) => t.status === "pending").length,
      avgQuality: 0.87,
      activeAnnotators: 0,
      totalCost: 0,
    });

    setEvents(eventsRes.data ?? []);

    const chartData = projects.map((p) => {
      const projectTasks = tasks.filter((t) => t.project_id === p.id);
      return {
        name: p.name.length > 15 ? p.name.slice(0, 15) + "..." : p.name,
        tasks: projectTasks.length,
        completed: projectTasks.filter((t) => t.status === "accepted").length,
      };
    });
    setProjectData(chartData);
  }

  const kpis = [
    { label: "Active Projects", value: formatNumber(stats.totalProjects), icon: FolderKanban, color: "text-[var(--color-primary)]" },
    { label: "Pending Tasks", value: formatNumber(stats.pendingTasks), icon: ListTodo, color: "text-[var(--color-warning)]" },
    { label: "Avg Quality", value: formatPercent(stats.avgQuality), icon: ShieldCheck, color: "text-[var(--color-success)]" },
    { label: "Active Annotators", value: formatNumber(stats.activeAnnotators), icon: Users, color: "text-[var(--color-accent)]" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-[var(--color-muted-foreground)]">Platform overview and key metrics</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="flex items-center gap-4">
              <div className={`rounded-lg bg-[var(--color-muted)] p-3 ${kpi.color}`}>
                <kpi.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{kpi.value}</p>
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
              <TrendingUp className="h-4 w-4" />
              Project Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {events.length === 0 && (
                <p className="text-sm text-[var(--color-muted-foreground)]">No recent activity</p>
              )}
              {events.map((event) => (
                <div key={event.id} className="flex items-center justify-between border-b border-[var(--color-border)] pb-3 last:border-0">
                  <div className="flex items-center gap-3">
                    <Badge variant={event.event_type.includes("error") ? "destructive" : "default"}>
                      {event.event_type}
                    </Badge>
                  </div>
                  <span className="text-xs text-[var(--color-muted-foreground)]">
                    {formatRelativeTime(event.created_at)}
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
