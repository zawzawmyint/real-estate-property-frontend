import { BuildingLoader } from "@/components/ui/building-loader";
import { Skeleton } from "@/components/ui/skeleton";
export function LeadLoading() {
  return (
    <div className="space-y-5" role="status" aria-label="Loading leads">
      <div className="flex items-center gap-3 text-primary">
        <BuildingLoader className="size-16" />
        <span className="text-sm text-muted-foreground">Loading leads…</span>
      </div>
      <div
        aria-hidden="true"
        className="overflow-hidden rounded-xl border border-border bg-card"
      >
        <div className="hidden h-11 items-center gap-8 border-b border-border bg-muted/60 px-4 md:flex">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-4 w-20" />
        </div>
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className="space-y-3 border-b border-border px-4 py-5 last:border-b-0 md:flex md:items-center md:gap-8 md:space-y-0"
          >
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}
