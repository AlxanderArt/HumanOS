import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGoldSets, useDriftSnapshots, useQualityScores } from "@/hooks/use-queries";
import { formatPercent } from "@/lib/utils";
import { ShieldCheck, Target, Users, AlertTriangle, AlertCircle } from "lucide-react";
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
  const { data: goldSets = [], isLoading, error } = useGoldSets();
  const { data: driftSnapshots = [] } = useDriftSnapshots();
  const { data: qualityScores = [] } = useQualityScores();

  const avgAccuracy = qualityScores.length > 0
    ? qualityScores.reduce((sum: number, q: Record<string, unknown>) => sum + ((q.accuracy as number) ?? 0), 0) / qualityScores.length
    : 0;

  const avgIaa = qualityScores.length > 0
    ? qualityScores.reduce((sum: number, q: Record<string, unknown>) => sum + ((q.f1 as number) ?? 0), 0) / qualityScores.length
    : 0;

  // Build trend data from quality_scores
  const qualityTrend = qualityScores
    .slice(0, 10)
    .reverse()
    .map((q: Record<string, unknown>, i: number) => ({
      period: `#${i + 1}`,
      accuracy: (q.accuracy as number) ?? 0,
      iaa: (q.f1 as number) ?? 0,
    }));

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="mb-4 h-12 w-12 text-[var(--color-destructive)]" aria-hidden="true" />
        <h2 className="text-lg font-semibold">Failed to load quality data</h2>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold md:text-2xl">Quality Intelligence</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">Gold sets, consensus, IAA metrics, and drift detection</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3">
            <Target className="h-5 w-5 text-[var(--color-primary)]" aria-hidden="true" />
            <div>
              {isLoading ? (
                <div className="h-6 w-10 animate-pulse rounded bg-[var(--color-muted)]" />
              ) : (
                <p className="text-xl font-bold">{goldSets.length}</p>
              )}
              <p className="text-xs text-[var(--color-muted-foreground)]">Gold Set Items</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-[var(--color-success)]" aria-hidden="true" />
            <div>
              <p className="text-xl font-bold">{avgAccuracy > 0 ? formatPercent(avgAccuracy) : "—"}</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">Avg Accuracy</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <Users className="h-5 w-5 text-[var(--color-accent)]" aria-hidden="true" />
            <div>
              <p className="text-xl font-bold">{avgIaa > 0 ? formatPercent(avgIaa) : "—"}</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">IAA Score</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-[var(--color-warning)]" aria-hidden="true" />
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
            {qualityTrend.length === 0 ? (
              <p className="py-8 text-center text-sm text-[var(--color-muted-foreground)]">
                No quality data yet. Scores will appear as annotations are evaluated.
              </p>
            ) : (
              <div role="img" aria-label="Line chart showing accuracy and IAA trends">
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={qualityTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="period" tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
                    <YAxis domain={[0, 1]} tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "8px" }}
                    />
                    <Line type="monotone" dataKey="accuracy" stroke="var(--color-success)" strokeWidth={2} name="Accuracy" />
                    <Line type="monotone" dataKey="iaa" stroke="var(--color-primary)" strokeWidth={2} name="IAA" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gold Set Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(goldSets as Array<Record<string, unknown>>).map((gs) => (
                <div key={gs.id as string} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-border)] p-3">
                  <span className="min-w-0 truncate text-sm">
                    {JSON.stringify(gs.task_payload).slice(0, 50)}
                  </span>
                  <Badge variant={gs.difficulty === "easy" ? "success" : gs.difficulty === "hard" ? "destructive" : "warning"} className="shrink-0">
                    {gs.difficulty as string}
                  </Badge>
                </div>
              ))}
              {goldSets.length === 0 && (
                <p className="py-8 text-center text-sm text-[var(--color-muted-foreground)]">
                  No gold sets configured yet. Add gold standard items to measure annotator quality.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
