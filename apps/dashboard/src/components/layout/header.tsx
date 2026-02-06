import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";

export function Header() {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-background)]/80 px-8 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <h2 className="text-sm font-medium text-[var(--color-muted-foreground)]">
          Human Signal Orchestration Platform
        </h2>
      </div>

      <div className="flex items-center gap-3">
        {user && (
          <>
            <div className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
              <User className="h-4 w-4" />
              {user.email}
            </div>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
