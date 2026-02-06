import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useTenantQuery, TenantCtx } from "@/hooks/use-tenant";
import { AppShell } from "@/components/layout/app-shell";
import { DashboardPage } from "@/pages/DashboardPage";
import { ProjectsPage } from "@/pages/ProjectsPage";
import { ProjectDetailPage } from "@/pages/ProjectDetailPage";
import { LabelingWorkbenchPage } from "@/pages/LabelingWorkbenchPage";
import { QualityIntelligencePage } from "@/pages/QualityIntelligencePage";
import { VendorOpsPage } from "@/pages/VendorOpsPage";
import { AgentEvalPage } from "@/pages/AgentEvalPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { AuthPage } from "@/pages/AuthPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { ErrorBoundary } from "@/components/error-boundary";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: (failureCount, error) => {
        if ((error as { status?: number })?.status === 401) return false;
        return failureCount < 2;
      },
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 15000),
    },
  },
});

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)]">
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent"
            role="status"
            aria-label="Loading"
          />
          <p className="text-sm text-[var(--color-muted-foreground)]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage redirectTo={location.pathname !== "/" ? location.pathname : undefined} />;
  }

  return <>{children}</>;
}

function TenantGate({ children }: { children: React.ReactNode }) {
  const { data: tenant, isLoading } = useTenantQuery();

  const value = {
    tenantId: tenant?.tenantId ?? null,
    tenantName: tenant?.tenantName ?? null,
    role: tenant?.role ?? null,
    loading: isLoading,
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)]">
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent"
            role="status"
            aria-label="Loading workspace"
          />
          <p className="text-sm text-[var(--color-muted-foreground)]">Loading workspace...</p>
        </div>
      </div>
    );
  }

  return <TenantCtx.Provider value={value}>{children}</TenantCtx.Provider>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthGate>
            <TenantGate>
              <Routes>
                <Route element={<AppShell />}>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/projects" element={<ProjectsPage />} />
                  <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
                  <Route path="/labeling" element={<LabelingWorkbenchPage />} />
                  <Route path="/quality" element={<QualityIntelligencePage />} />
                  <Route path="/vendors" element={<VendorOpsPage />} />
                  <Route path="/agents" element={<AgentEvalPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Routes>
            </TenantGate>
          </AuthGate>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
