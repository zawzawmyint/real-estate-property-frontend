import { BuildingLoader } from "@/components/ui/building-loader";
import { Skeleton } from "@/components/ui/skeleton";
export function LeadLoading() {
  return (
    <div className="space-y-5" role="status" aria-label="Loading leads">
      <div className="flex items-center gap-3 text-primary">
        <BuildingLoader className="size-16" />
        <span className="text-sm text-muted-foreground">Loading leads…</span>
      </div>
      <div aria-hidden="true" className="space-y-3">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className="space-y-4 rounded-xl border border-border bg-card p-6"
          >
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}
