import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <p className="text-6xl font-bold text-[var(--color-muted-foreground)]">404</p>
      <h1 className="mt-4 text-xl font-semibold">Page not found</h1>
      <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
        The page you're looking for doesn't exist.
      </p>
      <Link to="/" className="mt-6">
        <Button>
          <Home className="mr-2 h-4 w-4" aria-hidden="true" />
          Back to Dashboard
        </Button>
      </Link>
    </div>
  );
}
