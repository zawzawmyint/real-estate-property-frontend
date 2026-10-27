import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { parsePipelineFilters } from "@/features/leads/data/pipeline";
import { LeadFilters } from "@/features/leads/crm/lead-filters";
import {
  CreateLeadAction,
  InvalidLeadFilters,
} from "@/features/leads/crm/lead-inventory";
import {
  PipelineFilterRegion,
  PipelineResultRegion,
} from "@/features/leads/crm/pipeline/pipeline-regions";
import { PipelineLoading } from "@/features/leads/crm/pipeline/pipeline-loading";

export const metadata: Metadata = {
  title: "Sales pipeline · Agency workspace",
  robots: { index: false, follow: false },
};

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams))
    if (typeof value === "string") query.set(key, value);
  const queryString = query.toString();
  let filters;
  try {
    filters = parsePipelineFilters(queryString, "manager");
  } catch {
    return (
      <main id="main-content" className="min-w-0 flex-1 p-6 sm:p-8">
        <PageHeader title="Sales pipeline" />
        <InvalidLeadFilters />
      </main>
    );
  }
  return (
    <main id="main-content" className="min-w-0 flex-1 px-4 py-8 sm:px-8">
      <PageHeader
        title="Sales pipeline"
        description="Give every opportunity a clear next step."
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
      <div className="min-w-0 space-y-6">
        <Suspense
          fallback={
            <LeadFilters
              filters={filters}
              manager={false}
              checkingSession
              pipeline
            />
          }
        >
          <PipelineFilterRegion query={queryString} />
        </Suspense>
        <Suspense key={queryString} fallback={<PipelineLoading />}>
          <PipelineResultRegion query={queryString} />
        </Suspense>
      </div>
    </main>
  );
}
