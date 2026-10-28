import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PublicSectionHeader({
  level,
  title,
  id,
  description,
  eyebrow,
  actions,
  className,
}: {
  level: 1 | 2;
  title: ReactNode;
  id?: string;
  description?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  const Heading = level === 1 ? "h1" : "h2";
  return (
    <div
      className={cn(
        level === 1
          ? "mb-8"
          : "mb-7 flex flex-wrap items-end justify-between gap-5",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
            {eyebrow}
          </p>
        )}
        <Heading
          id={id}
          className={cn(
            "display-heading break-words leading-tight",
            level === 1 ? "text-4xl sm:text-5xl" : "text-3xl sm:text-4xl",
            eyebrow && "mt-3",
          )}
        >
          {title}
        </Heading>
        {description && (
          <p
            className={
              level === 1
                ? "mt-4 text-sm leading-7 text-muted-foreground"
                : "mt-3 text-sm text-muted-foreground"
            }
          >
            {description}
          </p>
        )}
      </div>
      {actions}
    </div>
  );
}
