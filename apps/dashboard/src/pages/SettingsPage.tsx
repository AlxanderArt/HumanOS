import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Shield, Bell, Database } from "lucide-react";

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-[var(--color-muted-foreground)]">Tenant configuration and platform settings</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              General
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Organization Name</label>
              <input
                type="text"
                placeholder="Acme AI Labs"
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Plan</label>
              <input
                type="text"
                disabled
                value="Enterprise"
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-2 text-sm opacity-50"
              />
            </div>
            <Button size="sm">Save Changes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Quality Defaults
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Default Consensus Method</label>
              <select className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-2 text-sm">
                <option>Majority Vote</option>
                <option>Weighted Vote</option>
                <option>Specialist</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Min Annotators per Task</label>
              <input
                type="number"
                defaultValue={3}
                min={2}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Agreement Threshold</label>
              <input
                type="number"
                defaultValue={0.8}
                step={0.05}
                min={0}
                max={1}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-2 text-sm"
              />
            </div>
            <Button size="sm">Save Quality Settings</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {["Drift Detection Alerts", "Quality Threshold Breaches", "Task Escalations", "Vendor SLA Violations"].map((item) => (
              <label key={item} className="flex items-center justify-between">
                <span className="text-sm">{item}</span>
                <input type="checkbox" defaultChecked className="accent-[var(--color-primary)]" />
              </label>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Workflow Templates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Manage reusable workflow templates for labeling pipelines.
            </p>
            <Button variant="outline" size="sm">Manage Templates</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
