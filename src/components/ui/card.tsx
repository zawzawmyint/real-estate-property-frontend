import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

// Used exports from https://ui.shadcn.com/r/styles/base-nova/card.json,
// adapted to the agency's semantic tokens and panel styling.
function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "group/card flex flex-col gap-6 rounded-2xl border border-border bg-card py-6 text-foreground shadow-sm",
        className,
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  );
}

export { Card, CardContent };
