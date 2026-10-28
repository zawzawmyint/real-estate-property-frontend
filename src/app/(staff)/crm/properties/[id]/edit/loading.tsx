import { LoadingState } from "@/components/ui/loading-state";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main id="main-content" className="min-w-0 flex-1 px-4 py-10 sm:px-8">
      <h1 className="text-3xl font-semibold tracking-tight">Edit property</h1>
      <LoadingState label="Loading property editor…" className="py-8" />
      <div aria-hidden="true" className="max-w-4xl space-y-6">
        <Skeleton className="h-7 w-2/3" />
        <div className="grid gap-6 sm:grid-cols-2">
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-11 w-full" />
            </div>
          ))}
        </div>
        <Skeleton className="h-32 w-full" />
      </div>
    </main>
  );
}
