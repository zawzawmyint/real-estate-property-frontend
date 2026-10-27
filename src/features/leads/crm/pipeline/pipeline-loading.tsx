import { BuildingLoader } from "@/components/ui/building-loader";
import { Skeleton } from "@/components/ui/skeleton";

export function PipelineLoading() {
  return (
    <div
      role="status"
      aria-label="Loading pipeline"
      className="min-w-0 space-y-5"
    >
      <div className="flex items-center gap-3">
        <BuildingLoader className="size-16" />
        <span className="text-sm text-muted-foreground">
          Loading your pipeline…
        </span>
      </div>
      <div aria-hidden="true" className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="space-y-4 rounded-2xl border border-border bg-muted/40 p-4"
          >
            <Skeleton className="h-5 w-28" />
            <div className="space-y-4 rounded-xl border border-border bg-card p-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
