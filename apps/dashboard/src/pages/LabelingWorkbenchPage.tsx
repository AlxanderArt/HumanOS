import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useTenant } from "@/hooks/use-tenant";
import { PenTool, SkipForward, Flag, Send, AlertCircle } from "lucide-react";

interface ActiveTask {
  id: string;
  payload: Record<string, unknown>;
  priority: number;
  project: { name: string; task_schema: Record<string, unknown>; labeling_instructions: string | null };
}

export function LabelingWorkbenchPage() {
  const { tenantId } = useTenant();
  const [task, setTask] = useState<ActiveTask | null>(null);
  const [labels, setLabels] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState(Date.now());

  const loadNextTask = useCallback(async () => {
    setLoading(true);
    setError(null);

    const query = supabase
      .from("tasks")
      .select("id, payload, priority, projects(name, task_schema, labeling_instructions)")
      .eq("status", "pending")
      .order("priority", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (tenantId) query.eq("tenant_id", tenantId);
    const { data, error: fetchError } = await query;

    if (fetchError) {
      setError("Failed to load task. Please try again.");
      setLoading(false);
      return;
    }

    if (data) {
      const project = Array.isArray(data.projects) ? data.projects[0] : data.projects;
      setTask({
        id: data.id,
        payload: data.payload as Record<string, unknown>,
        priority: data.priority,
        project: project as ActiveTask["project"],
      });
      setLabels({});
      setStartTime(Date.now());
    } else {
      setTask(null);
    }
    setLoading(false);
  }, [tenantId]);

  useEffect(() => {
    loadNextTask();
  }, [loadNextTask]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "Enter" && !e.shiftKey && task && !submitting) {
        e.preventDefault();
        handleSubmit();
      }
      if (e.key === "s" && !e.ctrlKey && !e.metaKey && task) {
        e.preventDefault();
        loadNextTask();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  async function handleSubmit() {
    if (!task || submitting) return;
    setSubmitting(true);
    setError(null);

    const { error: submitError } = await supabase.functions.invoke("submit-annotation", {
      body: {
        task_id: task.id,
        labels,
        time_spent_ms: Date.now() - startTime,
      },
    });

    if (submitError) {
      setError("Failed to submit annotation. Please try again.");
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    loadNextTask();
  }

  async function handleFlag() {
    if (!task) return;
    await supabase.from("tasks").update({ status: "escalated" }).eq("id", task.id);
    loadNextTask();
  }

  function renderField(field: { name: string; type: string; options?: string[]; min?: number; max?: number }) {
    const fieldId = `field-${field.name.replace(/\s+/g, "-").toLowerCase()}`;

    switch (field.type) {
      case "select":
        return (
          <fieldset key={field.name} className="space-y-2">
            <legend className="text-sm font-medium">{field.name}</legend>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={field.name}>
              {field.options?.map((opt) => (
                <button
                  key={opt}
                  role="radio"
                  aria-checked={labels[field.name] === opt}
                  onClick={() => setLabels({ ...labels, [field.name]: opt })}
                  className={`min-h-[44px] rounded-lg border px-4 py-2 text-sm transition-colors ${
                    labels[field.name] === opt
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                      : "border-[var(--color-border)] hover:border-[var(--color-muted-foreground)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </fieldset>
        );

      case "multi_select":
        return (
          <fieldset key={field.name} className="space-y-2">
            <legend className="text-sm font-medium">{field.name}</legend>
            <div className="flex flex-wrap gap-2">
              {field.options?.map((opt) => {
                const selected = Array.isArray(labels[field.name]) && (labels[field.name] as string[]).includes(opt);
                return (
                  <button
                    key={opt}
                    role="checkbox"
                    aria-checked={selected}
                    onClick={() => {
                      const current = (labels[field.name] as string[]) ?? [];
                      setLabels({
                        ...labels,
                        [field.name]: selected ? current.filter((x) => x !== opt) : [...current, opt],
                      });
                    }}
                    className={`min-h-[44px] rounded-lg border px-4 py-2 text-sm transition-colors ${
                      selected
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                        : "border-[var(--color-border)] hover:border-[var(--color-muted-foreground)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </fieldset>
        );

      case "slider":
        return (
          <div key={field.name} className="space-y-2">
            <label htmlFor={fieldId} className="text-sm font-medium">
              {field.name}: {((labels[field.name] as number) ?? field.min ?? 0).toFixed(2)}
            </label>
            <input
              id={fieldId}
              type="range"
              min={field.min ?? 0}
              max={field.max ?? 1}
              step={0.05}
              value={(labels[field.name] as number) ?? field.min ?? 0}
              onChange={(e) => setLabels({ ...labels, [field.name]: parseFloat(e.target.value) })}
              className="w-full accent-[var(--color-primary)]"
            />
          </div>
        );

      case "number":
        return (
          <div key={field.name} className="space-y-2">
            <label htmlFor={fieldId} className="text-sm font-medium">{field.name}</label>
            <input
              id={fieldId}
              type="number"
              min={field.min}
              max={field.max}
              value={(labels[field.name] as number) ?? ""}
              onChange={(e) => setLabels({ ...labels, [field.name]: parseInt(e.target.value, 10) })}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
        );

      default:
        return null;
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20" role="status" aria-label="Loading task">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <PenTool className="mb-4 h-12 w-12 text-[var(--color-muted-foreground)]" aria-hidden="true" />
        <h2 className="text-lg font-semibold">No tasks available</h2>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          All tasks have been assigned or completed. Check back later.
        </p>
        <Button variant="outline" className="mt-4" onClick={loadNextTask}>
          Refresh
        </Button>
      </div>
    );
  }

  const schema = task.project.task_schema as { fields?: Array<{ name: string; type: string; options?: string[]; min?: number; max?: number }> };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold md:text-2xl">Labeling Workbench</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">{task.project.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">Priority: {task.priority}</Badge>
          <Badge variant="outline" className="hidden text-xs sm:inline-flex">
            Enter=Submit · S=Skip
          </Badge>
        </div>
      </div>

      {task.project.labeling_instructions && (
        <Card>
          <CardContent className="text-sm text-[var(--color-muted-foreground)]">
            <strong>Instructions:</strong> {task.project.labeling_instructions}
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-[var(--color-destructive)]/30 bg-[var(--color-destructive)]/5 p-3 text-sm text-[var(--color-destructive)]" role="alert">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Data</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="max-h-[50vh] overflow-auto whitespace-pre-wrap rounded-lg bg-[var(--color-muted)] p-4 text-xs md:text-sm">
              {JSON.stringify(task.payload, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Labels</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {schema.fields?.map(renderField)}

            <div className="flex flex-wrap gap-3 border-t border-[var(--color-border)] pt-4">
              <Button onClick={handleSubmit} disabled={submitting}>
                <Send className="mr-2 h-4 w-4" aria-hidden="true" />
                {submitting ? "Submitting..." : "Submit"}
              </Button>
              <Button variant="outline" onClick={loadNextTask}>
                <SkipForward className="mr-2 h-4 w-4" aria-hidden="true" />
                Skip
              </Button>
              <Button variant="ghost" onClick={handleFlag}>
                <Flag className="mr-2 h-4 w-4" aria-hidden="true" />
                Flag
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
