import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="md:ml-64">
        <Header onMenuToggle={() => setSidebarOpen(true)} />
        <main id="main-content" className="p-4 md:p-8" aria-label="Main content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
