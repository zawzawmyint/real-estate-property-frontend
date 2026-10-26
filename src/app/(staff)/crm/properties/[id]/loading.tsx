import { LoadingState } from "@/components/ui/building-loader";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main id="main-content" className="min-w-0 flex-1 px-4 py-10 sm:px-8">
      <h1 className="text-3xl font-semibold tracking-tight">
        Property details
      </h1>
      <LoadingState label="Loading property details…" className="py-8" />
      <div aria-hidden="true" className="max-w-4xl space-y-6">
        <Skeleton className="h-7 w-2/3" />
        <Skeleton className="aspect-[16/9] w-full rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <Skeleton key={item} className="h-20 w-full" />
          ))}
        </div>
        <Skeleton className="h-28 w-full" />
      </div>
    </main>
  );
}
