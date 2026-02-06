import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProjects } from "@/hooks/use-queries";
import { Plus, FolderKanban, AlertCircle, Search } from "lucide-react";

const statusVariant: Record<string, "default" | "success" | "warning" | "outline"> = {
  draft: "outline",
  active: "success",
  paused: "warning",
  completed: "default",
  archived: "outline",
};

export function ProjectsPage() {
  const { data: projects = [], isLoading, error } = useProjects();
  const [search, setSearch] = useState("");

  const filtered = projects.filter((p: Record<string, unknown>) =>
    ((p.name as string) ?? "").toLowerCase().includes(search.toLowerCase())
  );

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="mb-4 h-12 w-12 text-[var(--color-destructive)]" aria-hidden="true" />
        <h2 className="text-lg font-semibold">Failed to load projects</h2>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold md:text-2xl">Projects</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">Manage labeling and evaluation projects</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          New Project
        </Button>
      </div>

      {!isLoading && projects.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" aria-hidden="true" />
          <input
            type="search"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search projects"
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] sm:max-w-xs"
          />
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20" role="status" aria-label="Loading projects">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
        </div>
      ) : filtered.length === 0 && search ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Search className="mb-4 h-12 w-12 text-[var(--color-muted-foreground)]" aria-hidden="true" />
            <h3 className="text-lg font-semibold">No matching projects</h3>
            <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
              Try a different search term.
            </p>
          </CardContent>
        </Card>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20">
            <FolderKanban className="mb-4 h-12 w-12 text-[var(--color-muted-foreground)]" aria-hidden="true" />
            <h3 className="text-lg font-semibold">No projects yet</h3>
            <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
              Create your first labeling project to get started.
            </p>
            <Button className="mt-4">
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              Create Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project: Record<string, unknown>) => (
            <Link key={project.id as string} to={`/projects/${project.id}`} aria-label={`View ${project.name} project`}>
              <Card className="cursor-pointer transition-colors hover:border-[var(--color-primary)]/50 focus-within:ring-2 focus-within:ring-[var(--color-primary)]">
                <CardContent>
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold">{project.name as string}</h3>
                      {project.description && (
                        <p className="mt-1 text-sm text-[var(--color-muted-foreground)] line-clamp-2">
                          {project.description as string}
                        </p>
                      )}
                    </div>
                    <Badge variant={statusVariant[(project.status as string)] ?? "outline"} className="ml-2 shrink-0">
                      {project.status as string}
                    </Badge>
                  </div>
                  <div className="mt-4 flex items-center gap-3 text-xs text-[var(--color-muted-foreground)]">
                    <Badge variant="outline">{project.modality as string}</Badge>
                    <span>{new Date(project.created_at as string).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
