import { z } from "zod";
import type { StaffSession } from "@/lib/auth/transport";
import type { components } from "@/lib/api/generated/agent-performance";
import type { ReportFilters } from "./filters";

export type AgentPerformanceReport =
  components["schemas"]["AgentPerformanceReport"];
export type AgentPerformanceRow = components["schemas"]["AgentPerformanceRow"];

const count = z.number().int().nonnegative();
const date = z.iso.date().refine((value) => !value.startsWith("0000-"));
const agent = z.strictObject({
  id: z.string().min(1),
  name: z.string().min(1),
  availability: z.enum(["active", "inactive", "former"]),
});

export const reportSchema = z.strictObject({
  generatedAt: z.iso.datetime(),
  timezone: z.literal("Asia/Dubai"),
  from: date,
  to: date,
  rangeStart: z.iso.datetime(),
  rangeEndExclusive: z.iso.datetime(),
  asOf: z.iso.datetime(),
  scope: z.enum(["agency", "mine"]),
  page: count.min(1),
  pageSize: z.union([z.literal(25), z.literal(50)]),
  total: count.max(2000),
  items: z
    .array(
      z.strictObject({
        agent,
        leadsHandled: count,
        dealsClosed: count,
        assignmentEpisodes: count,
        completedFollowUps: count,
        averageFirstFollowUpSeconds: count.nullable(),
        awaitingFollowUp: count,
        endedWithoutFollowUp: count,
      }),
    )
    .max(50),
  agentOptions: z.array(agent).max(2000),
  coverage: z.strictObject({
    excludedActionCount: count,
    excludedAssignmentEpisodeCount: count,
    unattributedFirstWinCount: count,
    hasLimitations: z.boolean(),
  }),
}) satisfies z.ZodType<AgentPerformanceReport>;

export function reportResponseMatches(
  report: AgentPerformanceReport,
  filters: ReportFilters,
  staff: Pick<StaffSession, "id" | "role">,
) {
  if (report.scope === "agency" && staff.role === "agent") return false;
  const scopedId = report.scope === "mine" ? staff.id : filters.agentId;
  if (
    report.scope === "mine" &&
    filters.agentId !== undefined &&
    filters.agentId !== scopedId
  )
    return false;

  const offset = (filters.page - 1) * filters.pageSize;
  const expectedAgents = report.agentOptions.slice(
    offset,
    offset + filters.pageSize,
  );
  return (
    report.from === filters.from &&
    report.to === filters.to &&
    report.page === filters.page &&
    report.pageSize === filters.pageSize &&
    report.total === report.agentOptions.length &&
    (scopedId === undefined ||
      (report.total === 1 && report.agentOptions[0]?.id === scopedId)) &&
    report.items.length === expectedAgents.length &&
    report.items.every(
      ({ agent, averageFirstFollowUpSeconds, completedFollowUps }, index) => {
        const expected = expectedAgents[index];
        return (
          agent.id === expected?.id &&
          agent.name === expected.name &&
          agent.availability === expected.availability &&
          (averageFirstFollowUpSeconds === null) === (completedFollowUps === 0)
        );
      },
    )
  );
}

export type ReportProblem =
  | "sign-in"
  | "forbidden"
  | "unknown-agent"
  | "invalid"
  | "too-large"
  | "unavailable";

export function reportProblem(status: number, body: unknown): ReportProblem {
  if (status === 401) return "sign-in";
  if (status === 403) return "forbidden";
  const parsed = z
    .object({ error: z.object({ code: z.string() }) })
    .safeParse(body);
  const code = parsed.data?.error.code;
  if (status === 400 && code === "VALIDATION_ERROR") return "invalid";
  if (status === 404 && code === "NOT_FOUND") return "unknown-agent";
  if (status === 422 && code === "REPORT_TOO_LARGE") return "too-large";
  return "unavailable";
}
