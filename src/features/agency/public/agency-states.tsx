import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AgencyRetry } from "./agency-retry";
import { ContactIntroduction } from "./contact-introduction";

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
      <Skeleton aria-hidden="true" className="mb-6 h-12 w-full" />
      <div
        aria-hidden="true"
        className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6"
      >
        {[0, 1, 2].map((key) => (
          <div
            key={key}
            className="overflow-hidden rounded-lg border border-border bg-card"
          >
            <Skeleton className="aspect-[7/6] rounded-none" />
            <div className="space-y-4 p-5 sm:p-6">
              <Skeleton className="h-7 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-7 w-3/4" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-11 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EnquiryFieldsLoading() {
  return (
    <div aria-hidden="true" className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        {[0, 1, 2, 3].map((key) => (
          <div key={key} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-12" />
          </div>
        ))}
      </div>
      <Skeleton className="h-4 w-3/4" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-16" />
      </div>
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-11 w-full" />
    </div>
  );
}

export function ContactLoading({
  presentation = "contact",
}: {
  presentation?: "contact" | "directory";
}) {
  if (presentation === "contact") {
    return (
      <div
        role="status"
        aria-label="Loading contact information"
        className="agency-contact-layout"
      >
        <span className="sr-only">Loading contact information…</span>
        <ContactIntroduction />
        <div className="agency-contact-form">
          <div aria-hidden="true" className="mb-9 flex min-h-11 items-center">
            <Skeleton className="h-4 w-28" />
          </div>
          <Skeleton aria-hidden="true" className="mb-6 h-12 w-full" />
          <h2 id="agency-inquiry-heading" className="display-heading">
            Send a property enquiry
          </h2>
          <Skeleton aria-hidden="true" className="mb-8 mt-4 h-7 w-full" />
          <EnquiryFieldsLoading />
        </div>
        <div className="agency-contact-media" aria-hidden="true">
          <Skeleton className="agency-contact-illustration bg-white/10" />
          <Skeleton className="mt-2 h-4 w-28 bg-white/10" />
          <Skeleton className="mt-6 h-11 w-48 bg-white/10" />
        </div>
      </div>
    );
  }
  return (
    <div
      role="status"
      aria-label="Loading contact information"
      className="grid gap-7 rounded-xl border border-border p-5 sm:p-7 lg:grid-cols-[minmax(0,3fr)_minmax(0,7fr)]"
    >
      <span className="sr-only">Loading contact information…</span>
      <div aria-hidden="true" className="space-y-5">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
      <EnquiryFieldsLoading />
    </div>
  );
}
