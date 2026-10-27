import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { parseLeadFilters } from "@/features/leads/data/filters";
import { LeadFilters } from "@/features/leads/crm/lead-filters";
import { LeadLoading } from "@/features/leads/crm/lead-loading";
import {
  LeadFilterRegion,
  LeadResultRegion,
  CreateLeadAction,
  InvalidLeadFilters,
} from "@/features/leads/crm/lead-inventory";

export const metadata: Metadata = {
  title: "Leads · Agency workspace",
  robots: { index: false, follow: false },
};

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams))
    if (typeof value === "string") query.set(key, value);

  // Construct only inert controls here. Verified regions resolve role-specific
  // defaults and validate Agent restrictions before fetching data.
  let provisionalFilters;
  try {
    provisionalFilters = parseLeadFilters(query, "manager");
  } catch {
    return (
      <main id="main-content" className="min-w-0 flex-1 p-6 sm:p-8">
        <PageHeader title="Leads" />
        <InvalidLeadFilters />
      </main>
    );
  }
  const queryString = query.toString();

  return (
    <main id="main-content" className="min-w-0 flex-1 px-4 py-8 sm:px-8">
      <PageHeader
        title="Leads"
        description="Turn every inquiry into a thoughtful next step."
        actions={
          <Suspense
            fallback={
              <Skeleton
                className="h-11 w-32"
                aria-label="Checking lead permissions"
              />
            }
          >
            <CreateLeadAction />
          </Suspense>
        }
      />
      <div className="space-y-6">
        <Suspense
          fallback={
            <LeadFilters
              filters={provisionalFilters}
              manager={false}
              checkingSession
            />
          }
        >
          <LeadFilterRegion query={queryString} />
        </Suspense>
        <Suspense key={queryString} fallback={<LeadLoading />}>
          <LeadResultRegion query={queryString} />
        </Suspense>
      </div>
    </main>
  );
}
