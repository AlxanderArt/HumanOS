import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut, User, Menu } from "lucide-react";

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { user, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    const { error } = await signOut();
    if (error) {
      setSigningOut(false);
    }
  }

  return (
    <header
      className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-background)]/80 px-4 backdrop-blur-sm md:px-8"
      aria-label="Page header"
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="rounded-lg p-2 text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] md:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h2 className="hidden text-sm font-medium text-[var(--color-muted-foreground)] md:block">
          HumanOS
        </h2>
      </div>

      <div className="flex items-center gap-3">
        {user && (
          <>
            <div className="hidden items-center gap-2 text-sm text-[var(--color-muted-foreground)] sm:flex">
              <User className="h-4 w-4" aria-hidden="true" />
              <span className="max-w-[200px] truncate">{user.email}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              disabled={signingOut}
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
