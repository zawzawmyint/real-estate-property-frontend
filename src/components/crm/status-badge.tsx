import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const tones = {
  neutral: "border-border bg-muted/50 text-muted-foreground",
  success: "border-transparent bg-green-50 text-green-800",
  info: "border-transparent bg-sky-50 text-sky-800",
  warning: "border-transparent bg-amber-50 text-amber-800",
};

export function StatusBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "info" | "warning";
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-auto min-h-6 px-2.5 py-0.5 text-xs capitalize",
        tones[tone],
      )}
    >
      {children}
    </Badge>
  );
}
