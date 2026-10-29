import { afterEach, describe, expect, it, vi } from "vitest";
import {
  requestDashboard,
  DashboardApiError,
} from "@/features/dashboard/request";
import {
  formatConversion,
  sourceCounts,
  stageCounts,
  formatDashboardWeek,
} from "@/features/dashboard/presentation";
import type { DashboardSummary } from "@/features/dashboard/types";

const snapshot: DashboardSummary = {
  generatedAt: "2026-10-29T08:00:00.000Z",
  scope: "agency",
  timezone: "Asia/Dubai",
  weekStart: "2026-10-25T20:00:00.000Z",
  weekEndExclusive: "2026-11-01T20:00:00.000Z",
  totalLeads: 10,
  newLeadsThisWeek: 3,
  wonLeads: 2,
  conversionRatePercent: 20,
  leadsBySource: [
    { source: "website", count: 5 },
    { source: "call", count: 3 },
    { source: "walk_in", count: 2 },
  ],
  pipelineByStage: [
    { stage: "new", count: 3 },
    { stage: "contacted", count: 2 },
    { stage: "viewing_scheduled", count: 1 },
    { stage: "offer", count: 1 },
    { stage: "won", count: 2 },
    { stage: "lost", count: 1 },
  ],
};

afterEach(() => vi.unstubAllGlobals());

describe("dashboard transport", () => {
  it("accepts the complete zero snapshot with null conversion", async () => {
    const empty: DashboardSummary = {
      ...snapshot,
      scope: "mine",
      totalLeads: 0,
      newLeadsThisWeek: 0,
      wonLeads: 0,
      conversionRatePercent: null,
      leadsBySource: snapshot.leadsBySource.map((item) => ({
        ...item,
        count: 0,
      })),
      pipelineByStage: snapshot.pipelineByStage.map((item) => ({
        ...item,
        count: 0,
      })),
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(empty)));
    await expect(requestDashboard("/dashboard")).resolves.toEqual(empty);
  });
  it("reads a fresh authenticated snapshot without accepting cached data", async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json(snapshot));
    vi.stubGlobal("fetch", fetcher);
    await expect(
      requestDashboard("https://api.example/staff/dashboard", {
        headers: { Cookie: "agency.session=staff" },
      }),
    ).resolves.toEqual(snapshot);
    expect(fetcher).toHaveBeenCalledWith(
      "https://api.example/staff/dashboard",
      expect.objectContaining({
        cache: "no-store",
        headers: { Accept: "application/json", Cookie: "agency.session=staff" },
      }),
    );
  });
  it.each([
    { totalLeads: 10 },
    { ...snapshot, privateContacts: ["private"] },
    { ...snapshot, totalLeads: -1 },
    { ...snapshot, newLeadsThisWeek: 1.5 },
    { ...snapshot, wonLeads: 11 },
    { ...snapshot, conversionRatePercent: 101 },
    { ...snapshot, conversionRatePercent: 20.01 },
    { ...snapshot, generatedAt: "invalid" },
    { ...snapshot, weekStart: "2026-02-30T20:00:00.000Z" },
    { ...snapshot, weekEndExclusive: snapshot.weekStart },
    { ...snapshot, timezone: "UTC" },
    { ...snapshot, scope: "all" },
    { ...snapshot, leadsBySource: snapshot.leadsBySource.slice(1) },
    { ...snapshot, leadsBySource: [...snapshot.leadsBySource].reverse() },
    {
      ...snapshot,
      leadsBySource: [
        { source: "website", count: "5" },
        ...snapshot.leadsBySource.slice(1),
      ],
    },
    {
      ...snapshot,
      leadsBySource: [
        { source: "website", count: 5, contacts: [] },
        ...snapshot.leadsBySource.slice(1),
      ],
    },
    { ...snapshot, pipelineByStage: snapshot.pipelineByStage.slice(1) },
    { ...snapshot, pipelineByStage: [...snapshot.pipelineByStage].reverse() },
    {
      ...snapshot,
      pipelineByStage: [
        { stage: "other", count: 3 },
        ...snapshot.pipelineByStage.slice(1),
      ],
    },
    { ...snapshot, totalLeads: 11 },
    { ...snapshot, conversionRatePercent: null },
  ])(
    "rejects malformed or extra successful snapshot fields: %j",
    async (body) => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(body)));
      await expect(requestDashboard("/dashboard")).rejects.toMatchObject({
        status: 502,
        code: "INVALID_RESPONSE",
      });
    },
  );
  it.each([401, 403, 500])(
    "preserves status %s and hides service internals",
    async (status) => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          Response.json(
            {
              error: { code: "FAILURE", message: "private database detail" },
            },
            { status },
          ),
        ),
      );
      const error = await requestDashboard("/dashboard").catch(
        (error: unknown) => error,
      );
      expect(error).toBeInstanceOf(DashboardApiError);
      expect(error).toMatchObject({ status });
      expect((error as Error).message).not.toContain("database");
    },
  );
  it("does not turn unavailable or malformed snapshots into zero counts", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    await expect(requestDashboard("/dashboard")).rejects.toMatchObject({
      status: 0,
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("invalid")));
    await expect(requestDashboard("/dashboard")).rejects.toMatchObject({
      status: 502,
    });
  });
});

describe("dashboard presentation", () => {
  it("keeps backend-rounded conversion at one decimal and distinguishes no denominator", () => {
    expect(formatConversion(20)).toBe("20.0%");
    expect(formatConversion(0)).toBe("0.0%");
    expect(formatConversion(null)).toBe("—");
  });
  it("preserves zero categories and contract order with readable labels", () => {
    expect(
      sourceCounts([
        { source: "website", count: 3 },
        { source: "call", count: 0 },
        { source: "walk_in", count: 1 },
      ]),
    ).toEqual([
      { label: "Website", count: 3 },
      { label: "Call", count: 0 },
      { label: "Walk-in", count: 1 },
    ]);
    expect(
      stageCounts([
        { stage: "new", count: 0 },
        { stage: "contacted", count: 0 },
        { stage: "viewing_scheduled", count: 1 },
        { stage: "offer", count: 0 },
        { stage: "won", count: 0 },
        { stage: "lost", count: 0 },
      ]).map((item) => item.label),
    ).toEqual([
      "New",
      "Contacted",
      "Viewing Scheduled",
      "Offer",
      "Won",
      "Lost",
    ]);
  });
  it("labels the inclusive Dubai week using the exclusive API end", () => {
    expect(
      formatDashboardWeek(
        "2026-10-25T20:00:00.000Z",
        "2026-11-01T20:00:00.000Z",
      ),
    ).toBe("26 Oct–1 Nov · Dubai time");
  });
});
