import { describe, expect, it } from "vitest";
import {
  formatFollowUpDuration,
  parseReportFilters,
  reportHref,
} from "@/features/reports/agent-performance/filters";
import {
  reportResponseMatches,
  reportSchema,
  reportProblem,
} from "@/features/reports/agent-performance/response";

const dubaiNewYear = new Date("2025-12-31T20:00:00.000Z");

describe("agent performance query", () => {
  it("uses the Dubai month during the UTC year boundary", () => {
    expect(parseReportFilters({}, dubaiNewYear)).toEqual({
      today: "2026-01-01",
      filters: { from: "2026-01-01", to: "2026-01-01", page: 1, pageSize: 25 },
    });
  });

  it.each([
    { from: "2025-12-01" },
    { from: "2025-02-29", to: "2025-03-01" },
    { from: "0000-01-01", to: "0000-01-01" },
    { from: "2025-12-10", to: "2025-12-09" },
    { from: "2024-12-31", to: "2026-01-01" },
    { from: "2026-01-01", to: "2026-01-02" },
    { agentId: ["self", "other"] },
    { "agentId[]": "self" },
    { agentId: " " },
    { agentId: "a".repeat(129) },
    { page: "01" },
    { page: "9007199254740992" },
    { pageSize: "100" },
  ])("rejects invalid entry values %j", (query) => {
    expect(parseReportFilters(query, dubaiNewYear)).toHaveProperty("error");
  });

  it("keeps a 366-day inclusive range, page size, and encoded selection", () => {
    const parsed = parseReportFilters(
      {
        from: "2025-01-01",
        to: "2026-01-01",
        agentId: "historic /+&",
        page: "3",
        pageSize: "50",
      },
      dubaiNewYear,
    );
    expect(parsed).toHaveProperty("filters.page", 3);
    if (!("filters" in parsed)) throw new Error("Expected valid filters");
    expect(reportHref({ ...parsed.filters, page: 1 })).toBe(
      "/crm/reports/agents?from=2025-01-01&to=2026-01-01&agentId=historic+%2F%2B%26&pageSize=50",
    );
  });
});

describe("recorded follow-up duration", () => {
  it.each([
    [null, "—"],
    [0, "0s"],
    [45, "45s"],
    [61, "1m 1s"],
    [90_061, "1d 1h 1m 1s"],
  ] as const)("formats %s seconds as %s", (seconds, expected) => {
    expect(formatFollowUpDuration(seconds)).toBe(expected);
  });
});

describe("agent report response boundary", () => {
  const filters = {
    from: "2025-12-01",
    to: "2025-12-31",
    page: 1,
    pageSize: 25,
  } as const;
  const agent = {
    id: "self",
    name: "Own agent",
    availability: "active",
  } as const;
  const report = {
    ...filters,
    generatedAt: "2026-01-01T00:00:00.000Z",
    timezone: "Asia/Dubai",
    rangeStart: "2025-11-30T20:00:00.000Z",
    rangeEndExclusive: "2025-12-31T20:00:00.000Z",
    asOf: "2025-12-31T20:00:00.000Z",
    scope: "mine",
    total: 1,
    items: [
      {
        agent,
        leadsHandled: 0,
        dealsClosed: 0,
        completedFollowUps: 0,
        averageFirstFollowUpSeconds: null,
        assignmentEpisodes: 0,
        awaitingFollowUp: 0,
        endedWithoutFollowUp: 0,
      },
    ],
    agentOptions: [agent],
    coverage: {
      excludedActionCount: 0,
      excludedAssignmentEpisodeCount: 0,
      unattributedFirstWinCount: 0,
      hasLimitations: false,
    },
  } as const;

  it("validates shape without accepting extra identity or lead details", () => {
    expect(reportSchema.safeParse(report).success).toBe(true);
    expect(
      reportSchema.safeParse({
        ...report,
        items: [{ ...report.items[0], leadId: "private" }],
      }).success,
    ).toBe(false);
  });

  it("accepts the preceding UTC year when the earliest Dubai date starts", () => {
    expect(
      parseReportFilters(
        { from: "0001-01-01", to: "0001-01-01" },
        dubaiNewYear,
      ),
    ).toHaveProperty("filters.from", "0001-01-01");
    expect(
      reportSchema.safeParse({
        ...report,
        from: "0001-01-01",
        to: "0001-01-01",
        rangeStart: "0000-12-31T20:00:00.000Z",
        rangeEndExclusive: "0001-01-01T20:00:00.000Z",
        asOf: "0001-01-01T20:00:00.000Z",
      }).success,
    ).toBe(true);
  });

  it("checks identity, live scope and committed query before display", () => {
    const data = reportSchema.parse(report);
    const staff = { role: "agent", id: agent.id } as const;
    expect(reportResponseMatches(data, filters, staff)).toBe(true);
    expect(
      reportResponseMatches({ ...data, scope: "agency" }, filters, staff),
    ).toBe(false);
    expect(
      reportResponseMatches(data, filters, { ...staff, id: "other" }),
    ).toBe(false);
    expect(reportResponseMatches(data, { ...filters, page: 2 }, staff)).toBe(
      false,
    );
    expect(
      reportResponseMatches(data, { ...filters, agentId: "other" }, staff),
    ).toBe(false);
  });

  it("maps recognized failures and drops internal messages", () => {
    expect(
      reportProblem(422, {
        error: { code: "REPORT_TOO_LARGE", message: "private SQL" },
      }),
    ).toBe("too-large");
    expect(
      reportProblem(422, {
        error: { code: "UNKNOWN", message: "private SQL" },
      }),
    ).toBe("unavailable");
    expect(reportProblem(503, { error: { message: "private SQL" } })).toBe(
      "unavailable",
    );
    expect(reportProblem(401, null)).toBe("sign-in");
  });
});
