import { LoadingState } from "@/components/ui/loading-state";

export default function Loading() {
  return (
    <main id="main-content" className="w-full px-6 py-16">
      <LoadingState label="Loading your workspace…" />
    </main>
  );
}
