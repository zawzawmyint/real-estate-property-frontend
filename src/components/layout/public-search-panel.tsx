import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PublicSearchPanel({
  children,
  treatment,
  className,
}: {
  children: ReactNode;
  treatment: "hero" | "listing";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border border-border bg-card p-5",
        treatment === "hero"
          ? "rounded-2xl shadow-[0_12px_40px_-20px_rgba(37,35,41,0.25)] sm:p-7"
          : "rounded-xl",
        className,
      )}
    >
      {children}
    </div>
  );
}
