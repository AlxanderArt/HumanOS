import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { formatPercent } from "@/lib/utils";
import { ShieldCheck, Target, Users, AlertTriangle } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function QualityIntelligencePage() {
  const [goldSets, setGoldSets] = useState<Array<Record<string, unknown>>>([]);
  const [driftSnapshots, setDriftSnapshots] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [goldRes, driftRes] = await Promise.all([
      supabase.from("gold_sets").select("*, gold_set_results(*)").limit(20),
      supabase.from("drift_snapshots").select("*").order("detected_at", { ascending: false }).limit(20),
    ]);
    setGoldSets(goldRes.data ?? []);
    setDriftSnapshots(driftRes.data ?? []);
  }

  const qualityTrend = [
    { period: "Week 1", accuracy: 0.82, iaa: 0.75 },
    { period: "Week 2", accuracy: 0.85, iaa: 0.78 },
    { period: "Week 3", accuracy: 0.87, iaa: 0.82 },
    { period: "Week 4", accuracy: 0.89, iaa: 0.85 },
    { period: "Week 5", accuracy: 0.91, iaa: 0.87 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Quality Intelligence</h1>
        <p className="text-[var(--color-muted-foreground)]">Gold sets, consensus, IAA metrics, and drift detection</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3">
            <Target className="h-5 w-5 text-[var(--color-primary)]" />
            <div>
              <p className="text-xl font-bold">{goldSets.length}</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">Gold Set Items</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-[var(--color-success)]" />
            <div>
              <p className="text-xl font-bold">{formatPercent(0.87)}</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">Avg Accuracy</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <Users className="h-5 w-5 text-[var(--color-accent)]" />
            <div>
              <p className="text-xl font-bold">{formatPercent(0.82)}</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">IAA Score</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-[var(--color-warning)]" />
            <div>
              <p className="text-xl font-bold">{driftSnapshots.length}</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">Drift Alerts</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quality Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={qualityTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="period" tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
                <YAxis domain={[0.6, 1]} tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                  }}
                />
                <Line type="monotone" dataKey="accuracy" stroke="var(--color-success)" strokeWidth={2} name="Accuracy" />
                <Line type="monotone" dataKey="iaa" stroke="var(--color-primary)" strokeWidth={2} name="IAA" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gold Set Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {goldSets.map((gs) => (
                <div key={gs.id as string} className="flex items-center justify-between rounded-lg border border-[var(--color-border)] p-3">
                  <div className="text-sm">
                    {JSON.stringify(gs.task_payload).slice(0, 50)}...
                  </div>
                  <Badge variant={gs.difficulty === "easy" ? "success" : gs.difficulty === "hard" ? "destructive" : "warning"}>
                    {gs.difficulty as string}
                  </Badge>
                </div>
              ))}
              {goldSets.length === 0 && (
                <p className="py-8 text-center text-sm text-[var(--color-muted-foreground)]">
                  No gold sets configured yet.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
