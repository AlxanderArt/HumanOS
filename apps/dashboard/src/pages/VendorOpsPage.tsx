import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useVendors, useCostLedger, useWorkforceCount } from "@/hooks/use-queries";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { Building2, DollarSign, Users, Target, AlertCircle } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function VendorOpsPage() {
  const { data: vendors = [], isLoading, error } = useVendors();
  const { data: totalCost = 0 } = useCostLedger();
  const { data: workforceCount = 0 } = useWorkforceCount();

  const avgSla = vendors.length > 0
    ? vendors.reduce((sum: number, v: Record<string, unknown>) => sum + ((v.sla_target as number) ?? 0), 0) / vendors.length
    : 0;

  const costByVendor = vendors.map((v: Record<string, unknown>) => ({
    name: v.name as string,
    cost: (v.cost_per_task as number) ?? 0,
  }));

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="mb-4 h-12 w-12 text-[var(--color-destructive)]" aria-hidden="true" />
        <h2 className="text-lg font-semibold">Failed to load vendor data</h2>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold md:text-2xl">Vendor Operations</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">Vendor management, workforce, and cost tracking</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-[var(--color-primary)]" aria-hidden="true" />
            <div>
              {isLoading ? (
                <div className="h-6 w-8 animate-pulse rounded bg-[var(--color-muted)]" />
              ) : (
                <p className="text-xl font-bold">{vendors.length}</p>
              )}
              <p className="text-xs text-[var(--color-muted-foreground)]">Active Vendors</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-[var(--color-success)]" aria-hidden="true" />
            <div>
              <p className="text-xl font-bold">{formatCurrency(totalCost)}</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">Total Spend</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <Users className="h-5 w-5 text-[var(--color-accent)]" aria-hidden="true" />
            <div>
              <p className="text-xl font-bold">{workforceCount}</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">Workforce Size</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <Target className="h-5 w-5 text-[var(--color-warning)]" aria-hidden="true" />
            <div>
              <p className="text-xl font-bold">{avgSla > 0 ? formatPercent(avgSla) : "—"}</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">Avg SLA Target</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cost per Task by Vendor</CardTitle>
          </CardHeader>
          <CardContent>
            {costByVendor.length === 0 ? (
              <p className="py-8 text-center text-sm text-[var(--color-muted-foreground)]">No vendor data yet</p>
            ) : (
              <div role="img" aria-label="Bar chart showing cost per task for each vendor">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={costByVendor}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="name" tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
                    <YAxis tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "8px" }}
                    />
                    <Bar dataKey="cost" fill="var(--color-primary)" radius={[4, 4, 0, 0]} name="Cost/Task ($)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vendor Roster</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {vendors.length === 0 ? (
                <p className="py-8 text-center text-sm text-[var(--color-muted-foreground)]">No vendors configured yet.</p>
              ) : (
                (vendors as Array<Record<string, unknown>>).map((v) => (
                  <div key={v.id as string} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-border)] p-3 md:p-4">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{v.name as string}</p>
                      <p className="text-xs text-[var(--color-muted-foreground)]">
                        {(v.region as string) ?? "Global"} · {formatCurrency((v.cost_per_task as number) ?? 0)}/task
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant={v.status === "active" ? "success" : "warning"}>{v.status as string}</Badge>
                      {v.sla_target && (
                        <Badge variant="outline" className="hidden sm:inline-flex">SLA: {formatPercent(v.sla_target as number)}</Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
