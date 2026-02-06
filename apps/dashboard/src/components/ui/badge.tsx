import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "destructive" | "outline";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        {
          "bg-[var(--color-primary)]/10 text-[var(--color-primary)]": variant === "default",
          "bg-[var(--color-success)]/10 text-[var(--color-success)]": variant === "success",
          "bg-[var(--color-warning)]/10 text-[var(--color-warning)]": variant === "warning",
          "bg-[var(--color-destructive)]/10 text-[var(--color-destructive)]": variant === "destructive",
          "border border-[var(--color-border)] text-[var(--color-muted-foreground)]": variant === "outline",
        },
        className
      )}
      {...props}
    />
  );
}
