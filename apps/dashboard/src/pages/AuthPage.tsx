import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

interface AuthPageProps {
  redirectTo?: string;
}

export function AuthPage({ redirectTo }: AuthPageProps) {
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === "forgot") {
        const result = await resetPassword(email);
        if (result.error) {
          setError(result.error.message);
        } else {
          setSuccess("Password reset email sent. Check your inbox.");
        }
        setLoading(false);
        return;
      }

      const result =
        mode === "signin"
          ? await signIn(email, password)
          : await signUp(email, password, displayName);

      if (result.error) {
        setError(result.error.message);
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    }

    setLoading(false);
  }

  const title = mode === "signin" ? "Sign In" : mode === "signup" ? "Create Account" : "Reset Password";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mb-2 text-3xl font-bold">
            <span className="text-[var(--color-primary)]">Human</span>OS
          </div>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {mode === "signup" && (
              <div className="space-y-2">
                <label htmlFor="auth-display-name" className="text-sm font-medium">
                  Display Name <span className="text-[var(--color-destructive)]">*</span>
                </label>
                <input
                  id="auth-display-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  minLength={2}
                  maxLength={50}
                  autoComplete="name"
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="auth-email" className="text-sm font-medium">
                Email <span className="text-[var(--color-destructive)]">*</span>
              </label>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>
            {mode !== "forgot" && (
              <div className="space-y-2">
                <label htmlFor="auth-password" className="text-sm font-medium">
                  Password <span className="text-[var(--color-destructive)]">*</span>
                </label>
                <input
                  id="auth-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  aria-describedby="password-hint"
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
                {mode === "signup" && (
                  <p id="password-hint" className="text-xs text-[var(--color-muted-foreground)]">
                    At least 6 characters
                  </p>
                )}
              </div>
            )}
            {error && (
              <p className="text-sm text-[var(--color-destructive)]" role="alert">
                {error}
              </p>
            )}
            {success && (
              <p className="text-sm text-[var(--color-success)]" role="status">
                {success}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Loading..." : title}
            </Button>
          </form>
          <div className="mt-4 flex flex-col items-center gap-2">
            {mode === "signin" && (
              <button
                onClick={() => { setMode("forgot"); setError(null); setSuccess(null); }}
                className="text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded"
              >
                Forgot password?
              </button>
            )}
            <button
              onClick={() => {
                setMode(mode === "signup" ? "signin" : mode === "forgot" ? "signin" : "signup");
                setError(null);
                setSuccess(null);
              }}
              className="text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded"
              aria-label={mode === "signin" ? "Switch to sign up" : "Switch to sign in"}
            >
              {mode === "signin"
                ? "Need an account? Sign up"
                : mode === "signup"
                  ? "Already have an account? Sign in"
                  : "Back to sign in"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
