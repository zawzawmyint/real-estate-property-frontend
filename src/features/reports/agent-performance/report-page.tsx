import { Suspense } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  parseReportFilters,
  reportQuery,
  type ReportSearchParams,
} from "./filters";
import { ReportControls } from "./report-controls";
import { reportPath } from "./report-path";
import { ReportResults } from "./report-results";

export function AgentPerformancePage({
  searchParams,
}: {
  searchParams: ReportSearchParams;
}) {
  const parsed = parseReportFilters(searchParams);
  return (
    <main id="main-content" className="min-w-0 flex-1 px-4 py-6 sm:px-8">
      <PageHeader
        title="Agent performance"
        description="Recorded lead work and outcomes. Dates are inclusive and shown in Dubai time."
        variant="workspace"
      />
      <details className="mb-4 rounded-xl border border-border bg-card px-4 py-3 text-sm">
        <summary className="cursor-pointer font-medium focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
          How these metrics are counted
        </summary>
        <dl className="mt-3 grid gap-3 leading-relaxed text-muted-foreground lg:grid-cols-2">
          <div>
            <dt className="font-semibold text-foreground">Leads handled</dt>
            <dd>
              An agent logs a call attempt or moves an assigned lead from New to
              Contacted. Generic notes do not count. The same lead can count
              once for each agent who handles it.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">Deals closed</dt>
            <dd>
              Only the first move to Won counts, credited to the agent assigned
              at that time. A later move to Won earns no additional credit.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">
              Assignment episodes and average follow-up
            </dt>
            <dd>
              The report counts classifiable assignments that began in the
              period. The average uses only episodes with a recorded follow-up
              and measures elapsed clock time, including nights and weekends. A
              dash means there are no completed episodes to average.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">
              Without recorded follow-up
            </dt>
            <dd>
              Episodes still assigned at the cutoff with no recorded follow-up.
              This includes any lead stage and does not indicate that contact is
              needed. Ended assignments with no recorded follow-up are counted
              separately.
            </dd>
          </div>
        </dl>
      </details>
      {"error" in parsed ? (
        <Alert variant="destructive">
          <AlertDescription className="space-y-2">
            <div>{parsed.error}</div>
            <Link href={reportPath}>Clear report filters</Link>
          </AlertDescription>
        </Alert>
      ) : (
        <ReportControls filters={parsed.filters} today={parsed.today}>
          <Suspense key={reportQuery(parsed.filters)} fallback={null}>
            <ReportResults filters={parsed.filters} />
          </Suspense>
        </ReportControls>
      )}
    </main>
  );
}
