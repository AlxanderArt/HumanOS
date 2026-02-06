import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { Building2, DollarSign, Users, Target } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Vendor {
  id: string;
  name: string;
  region: string | null;
  status: string;
  sla_target: number | null;
  cost_per_task: number | null;
}

export function VendorOpsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [totalCost, setTotalCost] = useState(0);

  useEffect(() => {
    loadVendors();
  }, []);

  async function loadVendors() {
    const [vendorRes, costRes] = await Promise.all([
      supabase.from("vendors").select("*").order("name"),
      supabase.from("cost_ledger").select("amount"),
    ]);
    setVendors(vendorRes.data ?? []);
    setTotalCost((costRes.data ?? []).reduce((sum, c) => sum + (c.amount || 0), 0));
  }

  const costByVendor = vendors.map((v) => ({
    name: v.name,
    cost: v.cost_per_task ?? 0,
    sla: (v.sla_target ?? 0) * 100,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Vendor Operations</h1>
        <p className="text-[var(--color-muted-foreground)]">Vendor management, workforce, and cost tracking</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-[var(--color-primary)]" />
            <div>
              <p className="text-xl font-bold">{vendors.length}</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">Active Vendors</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-[var(--color-success)]" />
            <div>
              <p className="text-xl font-bold">{formatCurrency(totalCost)}</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">Total Spend</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <Users className="h-5 w-5 text-[var(--color-accent)]" />
            <div>
              <p className="text-xl font-bold">0</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">Workforce Size</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <Target className="h-5 w-5 text-[var(--color-warning)]" />
            <div>
              <p className="text-xl font-bold">{formatPercent(0.91)}</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">Avg SLA Compliance</p>
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
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={costByVendor}>
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
                <Bar dataKey="cost" fill="var(--color-primary)" radius={[4, 4, 0, 0]} name="Cost/Task ($)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vendor Roster</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {vendors.map((v) => (
                <div key={v.id} className="flex items-center justify-between rounded-lg border border-[var(--color-border)] p-4">
                  <div>
                    <p className="font-medium">{v.name}</p>
                    <p className="text-xs text-[var(--color-muted-foreground)]">
                      {v.region ?? "Global"} · {formatCurrency(v.cost_per_task ?? 0)}/task
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={v.status === "active" ? "success" : "warning"}>{v.status}</Badge>
                    {v.sla_target && (
                      <Badge variant="outline">SLA: {formatPercent(v.sla_target)}</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
