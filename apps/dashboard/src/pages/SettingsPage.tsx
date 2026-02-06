import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTenant } from "@/hooks/use-tenant";
import { Settings, Shield, Bell, Database, Check } from "lucide-react";

export function SettingsPage() {
  const { tenantName } = useTenant();
  const [orgName, setOrgName] = useState(tenantName ?? "");
  const [consensusMethod, setConsensusMethod] = useState("majority_vote");
  const [minAnnotators, setMinAnnotators] = useState(3);
  const [agreementThreshold, setAgreementThreshold] = useState(0.8);
  const [notifications, setNotifications] = useState({
    drift: true,
    quality: true,
    escalation: true,
    sla: true,
  });
  const [saved, setSaved] = useState<string | null>(null);

  function handleSave(section: string) {
    setSaved(section);
    setTimeout(() => setSaved(null), 2000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold md:text-2xl">Settings</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">Tenant configuration and platform settings</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-4 w-4" aria-hidden="true" />
              General
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="settings-org-name" className="text-sm font-medium">Organization Name</label>
              <input
                id="settings-org-name"
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="settings-plan" className="text-sm font-medium">Plan</label>
              <input
                id="settings-plan"
                type="text"
                disabled
                value="Enterprise"
                aria-describedby="plan-hint"
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-2.5 text-sm opacity-50"
              />
              <p id="plan-hint" className="text-xs text-[var(--color-muted-foreground)]">Contact support to change your plan</p>
            </div>
            <Button size="sm" onClick={() => handleSave("general")}>
              {saved === "general" ? <><Check className="mr-2 h-4 w-4" aria-hidden="true" />Saved</> : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-4 w-4" aria-hidden="true" />
              Quality Defaults
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="settings-consensus" className="text-sm font-medium">Default Consensus Method</label>
              <select
                id="settings-consensus"
                value={consensusMethod}
                onChange={(e) => setConsensusMethod(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              >
                <option value="majority_vote">Majority Vote</option>
                <option value="weighted_vote">Weighted Vote</option>
                <option value="specialist">Specialist</option>
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="settings-min-annotators" className="text-sm font-medium">Min Annotators per Task</label>
              <input
                id="settings-min-annotators"
                type="number"
                value={minAnnotators}
                onChange={(e) => setMinAnnotators(parseInt(e.target.value, 10) || 2)}
                min={2}
                max={10}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="settings-threshold" className="text-sm font-medium">Agreement Threshold</label>
              <input
                id="settings-threshold"
                type="number"
                value={agreementThreshold}
                onChange={(e) => setAgreementThreshold(parseFloat(e.target.value) || 0)}
                step={0.05}
                min={0}
                max={1}
                aria-describedby="threshold-hint"
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
              <p id="threshold-hint" className="text-xs text-[var(--color-muted-foreground)]">Value between 0 and 1</p>
            </div>
            <Button size="sm" onClick={() => handleSave("quality")}>
              {saved === "quality" ? <><Check className="mr-2 h-4 w-4" aria-hidden="true" />Saved</> : "Save Quality Settings"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-4 w-4" aria-hidden="true" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <fieldset className="space-y-3">
              <legend className="sr-only">Notification preferences</legend>
              {([
                { key: "drift", label: "Drift Detection Alerts" },
                { key: "quality", label: "Quality Threshold Breaches" },
                { key: "escalation", label: "Task Escalations" },
                { key: "sla", label: "Vendor SLA Violations" },
              ] as const).map((item) => (
                <label key={item.key} htmlFor={`notif-${item.key}`} className="flex items-center justify-between">
                  <span className="text-sm">{item.label}</span>
                  <input
                    id={`notif-${item.key}`}
                    type="checkbox"
                    checked={notifications[item.key]}
                    onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                    className="h-4 w-4 accent-[var(--color-primary)]"
                  />
                </label>
              ))}
            </fieldset>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-4 w-4" aria-hidden="true" />
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
