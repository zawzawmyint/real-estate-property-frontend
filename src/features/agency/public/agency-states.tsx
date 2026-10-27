import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AgencyRetry } from "./agency-retry";

export function AgencyUnavailable({ profile = false }: { profile?: boolean }) {
  return (
    <Alert className="rounded-xl border-border bg-card p-6 sm:p-8">
      <AlertDescription>
        <p className="font-medium text-foreground">
          {profile
            ? "This profile couldn’t be loaded"
            : "Agency information is temporarily unavailable"}
        </p>
        <p>
          Please try again in a moment. You can still{" "}
          <Link href="/contact">send a property enquiry</Link>.
        </p>
        <AgencyRetry />
      </AlertDescription>
    </Alert>
  );
}

export function DemoDisclosure() {
  return (
    <p className="text-sm leading-6 text-muted-foreground">
      <span className="font-medium text-primary">Demo team.</span> These
      profiles and portraits are fictional illustrations, not real members of
      staff.
    </p>
  );
}

export function AgentDirectoryLoading() {
  return (
    <div role="status" aria-label="Loading our agents">
      <span className="sr-only">Loading our agents…</span>
      <div
        aria-hidden="true"
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        {[0, 1, 2].map((key) => (
          <div
            key={key}
            className="overflow-hidden rounded-xl border border-border bg-card"
          >
            <Skeleton className="aspect-[4/5] rounded-none" />
            <div className="space-y-4 p-6">
              <Skeleton className="h-7 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-11 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ContactLoading() {
  return (
    <div
      role="status"
      aria-label="Loading contact information"
      className="rounded-2xl border border-border bg-card p-6 sm:p-10"
    >
      <span className="sr-only">Loading contact information…</span>
      <div aria-hidden="true" className="space-y-6">
        <Skeleton className="h-9 w-3/4 max-w-md" />
        <div className="grid gap-6 sm:grid-cols-2">
          {[0, 1, 2, 3].map((key) => (
            <Skeleton key={key} className="h-16" />
          ))}
        </div>
        <Skeleton className="h-32" />
        <Skeleton className="h-11 w-40" />
      </div>
    </div>
  );
}
