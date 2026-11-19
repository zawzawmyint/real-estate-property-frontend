import Link from "next/link";
import { redirect } from "next/navigation";
import { CollectionPagination } from "@/components/crm/collection-pagination";
import { DataTable, type DataColumn } from "@/components/crm/data-table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { SessionRetry } from "@/features/auth/session-retry";
import { requireStaffSession } from "@/lib/auth/server";
import { SessionServiceError } from "@/lib/auth/transport";
import {
  formatFollowUpDuration,
  reportHref,
  type ReportFilters,
} from "./filters";
import {
  ReportAgentFilter,
  ReportReadComplete,
  ReportScope,
} from "./report-controls";
import type {
  AgentPerformanceReport,
  AgentPerformanceRow,
  ReportProblem,
} from "./response";
import { getAgentPerformanceReport } from "./server";

const availabilityLabels = {
  active: "Active",
  inactive: "Inactive",
  former: "Former agent",
};
const dateTime = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Dubai",
  dateStyle: "medium",
  timeStyle: "medium",
});

const columns: DataColumn<AgentPerformanceRow>[] = [
  {
    id: "agent",
    header: "Agent",
    className: "min-w-40 max-w-56 whitespace-normal",
    cell: ({ agent }) => (
      <>
        <p className="wrap-anywhere font-medium">{agent.name}</p>
        <p className="text-xs text-muted-foreground">
          {availabilityLabels[agent.availability]}
        </p>
      </>
    ),
  },
  { id: "handled", header: "Leads handled", cell: (row) => row.leadsHandled },
  { id: "deals", header: "Deals closed", cell: (row) => row.dealsClosed },
  {
    id: "episodes",
    header: "Assignment episodes",
    cell: (row) => row.assignmentEpisodes,
  },
  {
    id: "average",
    header: "Average first recorded follow-up",
    headerClassName: "min-w-44 whitespace-normal",
    cell: (row) => (
      <>
        <p className="tabular-nums">
          {formatFollowUpDuration(row.averageFirstFollowUpSeconds)}
        </p>
        <p className="text-xs text-muted-foreground">
          {row.completedFollowUps === 1
            ? "1 completed episode"
            : `${row.completedFollowUps} completed episodes`}
        </p>
      </>
    ),
  },
  {
    id: "awaiting",
    header: "Without recorded follow-up",
    headerClassName: "min-w-36 whitespace-normal",
    cell: (row) => row.awaitingFollowUp,
  },
  {
    id: "ended",
    header: "Ended without follow-up",
    headerClassName: "min-w-32 whitespace-normal",
    cell: (row) => row.endedWithoutFollowUp,
  },
];

const problemMessages: Record<Exclude<ReportProblem, "sign-in">, string> = {
  forbidden: "You do not have access to this report selection.",
  "unknown-agent": "This agent is unavailable for the report.",
  invalid:
    "The report filters were rejected. Check the dates and apply them again.",
  "too-large":
    "This report is too large. Narrow the date range and apply it again.",
  unavailable:
    "The report could not be loaded. Try again using the same filters.",
};

function ReportFailure({
  problem,
  filters,
}: {
  problem: Exclude<ReportProblem, "sign-in">;
  filters: ReportFilters;
}) {
  const canClear =
    filters.agentId !== undefined &&
    (problem === "forbidden" || problem === "unknown-agent");
  return (
    <Alert variant="destructive">
      <AlertDescription className="space-y-2">
        <div>{problemMessages[problem]}</div>
        {problem === "unavailable" && (
          <Button type="button" variant="outline" size="sm" data-report-retry>
            Retry report
          </Button>
        )}
        {canClear && (
          <Link
            href={reportHref({ ...filters, agentId: undefined, page: 1 })}
            data-report-clear
          >
            Clear agent selection
          </Link>
        )}
      </AlertDescription>
    </Alert>
  );
}

function ReportCoverage({
  coverage,
}: {
  coverage: AgentPerformanceReport["coverage"];
}) {
  return (
    <Alert role="note">
      <AlertDescription>
        <p>
          <strong className="font-semibold text-foreground">
            Coverage limits.
          </strong>{" "}
          Incomplete or ambiguous history can omit recorded work, including
          cases whose impact cannot be counted.
        </p>
        {coverage.hasLimitations && (
          <ul className="list-disc space-y-1 ps-5">
            <li>Excluded actions · {coverage.excludedActionCount}</li>
            <li>
              Excluded assignment episodes ·{" "}
              {coverage.excludedAssignmentEpisodeCount}
            </li>
            <li>
              Unattributed first wins · {coverage.unattributedFirstWinCount}
            </li>
          </ul>
        )}
      </AlertDescription>
    </Alert>
  );
}

export async function ReportResults({ filters }: { filters: ReportFilters }) {
  const content = await readReportContent(filters);
  return (
    <ReportReadComplete key={crypto.randomUUID()} href={reportHref(filters)}>
      {content}
    </ReportReadComplete>
  );
}

async function readReportContent(filters: ReportFilters) {
  let staff;
  try {
    staff = await requireStaffSession();
  } catch (error) {
    if (!(error instanceof SessionServiceError)) throw error;
    return <SessionRetry />;
  }

  const result = await getAgentPerformanceReport(filters, staff);
  if ("problem" in result) {
    if (result.problem === "sign-in") redirect("/login");
    return <ReportFailure problem={result.problem} filters={filters} />;
  }
  const { report } = result;

  return (
    <ReportScope viewerId={staff.id} scope={report.scope}>
      <section
        aria-labelledby="performance-results"
        className="min-w-0 space-y-4"
      >
        {report.scope === "agency" && (
          <ReportAgentFilter
            options={report.agentOptions}
            agentId={filters.agentId}
          />
        )}
        <div className="space-y-1">
          <h2 id="performance-results" className="text-xl font-semibold">
            {report.scope === "mine" ? "Your results" : "Agent results"}
          </h2>
          <p className="text-sm text-muted-foreground">
            Generated{" "}
            <time dateTime={report.generatedAt}>
              {dateTime.format(new Date(report.generatedAt))}
            </time>
            {" · "}As of{" "}
            <time dateTime={report.asOf}>
              {dateTime.format(new Date(report.asOf))}
            </time>
            {" · Dubai time"}
          </p>
        </div>
        <DataTable
          label="Agent performance metrics"
          scrollLabel="Scrollable agent performance table"
          variant="workspace"
          rows={report.items}
          columns={columns}
          getRowKey={(row) => row.agent.id}
          empty={
            <p
              role="status"
              className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground"
            >
              {report.total > 0
                ? "No agents on this page. Choose another page to see results."
                : "No matching agents for these dates."}
            </p>
          }
        />
        {report.total > report.pageSize || report.page > 1 ? (
          <CollectionPagination
            page={report.page}
            pageSize={report.pageSize}
            total={report.total}
            href={(page) => reportHref({ ...filters, page })}
            variant="workspace"
          />
        ) : null}
        <ReportCoverage coverage={report.coverage} />
      </section>
    </ReportScope>
  );
}
