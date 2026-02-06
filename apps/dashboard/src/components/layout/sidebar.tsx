import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderKanban,
  PenTool,
  ShieldCheck,
  Building2,
  Bot,
  Settings,
} from "lucide-react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/projects", icon: FolderKanban, label: "Projects" },
  { to: "/labeling", icon: PenTool, label: "Labeling" },
  { to: "/quality", icon: ShieldCheck, label: "Quality" },
  { to: "/vendors", icon: Building2, label: "Vendors" },
  { to: "/agents", icon: Bot, label: "Agent Eval" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-[var(--color-border)] bg-[var(--color-card)]">
      <div className="flex h-16 items-center border-b border-[var(--color-border)] px-6">
        <span className="text-xl font-bold tracking-tight">
          <span className="text-[var(--color-primary)]">H</span>SOP
        </span>
        <span className="ml-2 text-xs text-[var(--color-muted-foreground)]">v0.1</span>
      </div>

      <nav className="flex flex-col gap-1 p-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                  : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
