import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  className,
  variant = "default",
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
  variant?: "default" | "workspace";
}) {
  return (
    <header
      className={cn(
        "mb-8 flex flex-wrap items-center justify-between gap-4",
        variant === "workspace" && "mb-4 gap-3 border-b border-border pb-4",
        className,
      )}
    >
      <div className={variant === "workspace" ? "min-w-0" : undefined}>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p
            className={cn(
              "mt-2 text-sm text-muted-foreground",
              variant === "workspace" && "mt-1",
            )}
          >
            {description}
          </p>
        )}
      </div>
      {actions}
    </header>
  );
}
