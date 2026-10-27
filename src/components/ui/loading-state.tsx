import { cn } from "@/lib/utils";
import { BuildingLoader } from "./building-loader";

export function LoadingState({
  label = "Loading…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-8 text-sm text-primary",
        className,
      )}
    >
      <BuildingLoader className="size-24" />
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}
