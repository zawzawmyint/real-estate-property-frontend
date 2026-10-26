import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function FilterPanel({
  children,
  disabled,
  busy,
  className,
  fieldsClassName,
  before,
  after,
}: {
  children: ReactNode;
  disabled?: boolean;
  busy?: boolean;
  className?: string;
  fieldsClassName?: string;
  before?: ReactNode;
  after?: ReactNode;
}) {
  return (
    <div
      aria-busy={busy}
      className={cn(
        "space-y-4 rounded-xl border border-border bg-card p-4",
        className,
      )}
    >
      {before}
      <fieldset
        disabled={disabled}
        className={cn("grid min-w-0 gap-4", fieldsClassName)}
      >
        {children}
      </fieldset>
      {after}
    </div>
  );
}
