import { Skeleton } from "@/components/ui/skeleton";
import { BuildingLoader } from "@/components/ui/building-loader";
import { PropertyImagePlaceholder } from "./property-image-placeholder";

export function PropertyInventoryLoading() {
  return (
    <div role="status" aria-label="Loading inventory" className="space-y-6">
      <span className="sr-only">Loading inventory…</span>
      <div aria-hidden="true" className="flex items-center gap-3 text-primary">
        <BuildingLoader className="size-16" />
        <span className="text-sm text-muted-foreground">
          Loading inventory…
        </span>
      </div>
      <div aria-hidden="true" className="space-y-6">
        <Skeleton className="h-5 w-48" />
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="hidden grid-cols-6 gap-4 border-b border-border p-4 md:grid">
            {[0, 1, 2, 3, 4, 5].map((column) => (
              <Skeleton key={column} className="h-4 w-3/4" />
            ))}
          </div>
          {[0, 1, 2, 3].map((row) => (
            <div
              key={row}
              className="grid gap-4 border-b border-border p-4 last:border-0 md:grid-cols-6 md:items-center"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-16 w-20 shrink-0 rounded-lg" />
                <Skeleton className="h-4 w-20" />
              </div>
              {[0, 1, 2, 3, 4].map((column) => (
                <Skeleton key={column} className="h-4 w-3/4" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PropertyCardsLoading() {
  return (
    <div role="status" className="mt-10" aria-label="Loading properties">
      <span className="sr-only">Loading properties…</span>
      <div
        aria-hidden="true"
        className="mb-6 flex items-center gap-3 text-primary"
      >
        <BuildingLoader className="size-16" />
        <span className="text-sm text-muted-foreground">
          Loading properties…
        </span>
      </div>
      <div
        aria-hidden="true"
        className="grid gap-6 md:grid-cols-2 xl:grid-cols-3"
      >
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="overflow-hidden rounded-xl border border-border bg-card"
          >
            <PropertyImagePlaceholder className="aspect-[4/3] h-auto" />
            <div className="space-y-4 p-5">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
