import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { Plus, FolderKanban } from "lucide-react";

interface Project {
  id: string;
  name: string;
  description: string | null;
  modality: string;
  status: string;
  created_at: string;
}

const statusVariant: Record<string, "default" | "success" | "warning" | "outline"> = {
  draft: "outline",
  active: "success",
  paused: "warning",
  completed: "default",
  archived: "outline",
};

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    const { data } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });
    setProjects(data ?? []);
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-[var(--color-muted-foreground)]">Manage labeling and evaluation projects</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
        </div>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20">
            <FolderKanban className="mb-4 h-12 w-12 text-[var(--color-muted-foreground)]" />
            <h3 className="text-lg font-semibold">No projects yet</h3>
            <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
              Create your first labeling project to get started.
            </p>
            <Button className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Create Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} to={`/projects/${project.id}`}>
              <Card className="cursor-pointer transition-colors hover:border-[var(--color-primary)]/50">
                <CardContent>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{project.name}</h3>
                      {project.description && (
                        <p className="mt-1 text-sm text-[var(--color-muted-foreground)] line-clamp-2">
                          {project.description}
                        </p>
                      )}
                    </div>
                    <Badge variant={statusVariant[project.status] ?? "outline"}>
                      {project.status}
                    </Badge>
                  </div>
                  <div className="mt-4 flex items-center gap-3 text-xs text-[var(--color-muted-foreground)]">
                    <Badge variant="outline">{project.modality}</Badge>
                    <span>
                      {new Date(project.created_at).toLocaleDateString()}
                    </span>
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
