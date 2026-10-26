import { LoadingState } from "@/components/ui/building-loader";

export default function Loading() {
  return (
    <main id="main-content" className="w-full px-6 py-16">
      <LoadingState label="Loading sign in…" />
    </main>
  );
}
