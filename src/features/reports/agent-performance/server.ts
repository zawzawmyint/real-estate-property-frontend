import "server-only";
import { getBackendOrigin, getStaffRequestHeaders } from "@/lib/api/server";
import type { StaffSession } from "@/lib/auth/transport";
import { reportQuery, type ReportFilters } from "./filters";
import {
  type AgentPerformanceReport,
  type ReportProblem,
  reportProblem,
  reportResponseMatches,
  reportSchema,
} from "./response";

type ReportResult =
  { report: AgentPerformanceReport } | { problem: ReportProblem };

export async function getAgentPerformanceReport(
  filters: ReportFilters,
  staff: StaffSession,
): Promise<ReportResult> {
  const headers = await getStaffRequestHeaders();
  try {
    const response = await fetch(
      `${getBackendOrigin()}/api/v1/staff/reports/agent-performance?${reportQuery(filters)}`,
      {
        headers: { Accept: "application/json", ...headers },
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(20_000),
      },
    );
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) return { problem: reportProblem(response.status, body) };

    const parsed = reportSchema.safeParse(body);
    return parsed.success && reportResponseMatches(parsed.data, filters, staff)
      ? { report: parsed.data }
      : { problem: "unavailable" };
  } catch {
    return { problem: "unavailable" };
  }
}
