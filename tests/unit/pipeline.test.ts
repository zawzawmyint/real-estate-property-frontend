import { afterEach, expect, it, vi } from "vitest";
import {
  parsePipelineFilters,
  pipelineHref,
  pipelineQuery,
  loadPipelineColumn,
  appendPipelinePage,
} from "@/features/leads/data/pipeline";
import type { LeadList, LeadSummary } from "@/features/leads/data/types";

afterEach(() => vi.unstubAllGlobals());

it("defaults the manager board to all leads and the agent board to mine", () => {
  expect(parsePipelineFilters("", "manager").view).toBe("all");
  expect(parsePipelineFilters("", "agent").view).toBe("mine");
  expect(() => parsePipelineFilters("view=all", "agent")).toThrow();
  expect(() => parsePipelineFilters("agentId=other", "agent")).toThrow();
});

it("keeps shared filters but gives each stage its own page", () => {
  const filters = parsePipelineFilters(
    "view=all&q=Marina&source=call&agentId=agent&stage=won&page=4&sort=oldest",
    "manager",
  );
  const query = new URLSearchParams(pipelineQuery(filters, "contacted", 2));
  expect(Object.fromEntries(query)).toEqual({
    view: "all",
    q: "Marina",
    source: "call",
    agentId: "agent",
    sort: "oldest",
    page: "2",
    stage: "contacted",
  });
  expect(pipelineHref(filters)).not.toContain("stage=");
  expect(pipelineHref(filters)).toContain("/crm/leads/pipeline?");
});

it("loads a stage through the authenticated same-origin read contract", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      Response.json({
        items: [],
        total: 0,
        page: 2,
        pageSize: 20,
        unassignedCount: 0,
      }),
    ),
  );
  const result = await loadPipelineColumn(
    parsePipelineFilters("source=website", "manager"),
    "won",
    2,
  );
  const url = new URL(
    String(vi.mocked(fetch).mock.calls[0]?.[0]),
    "http://localhost",
  );
  expect(url.pathname).toBe("/api/v1/staff/leads");
  expect(url.searchParams.get("stage")).toBe("won");
  expect(url.searchParams.get("source")).toBe("website");
  expect(result.page).toBe(2);
});

it("merges overlapping pages without duplicate cards and retains the latest version", () => {
  const lead = { id: "one", version: 2 } as LeadSummary;
  const current: LeadList = {
    items: [lead],
    page: 1,
    pageSize: 20,
    total: 21,
    unassignedCount: null,
  };
  const next = {
    ...current,
    items: [{ ...lead, version: 1 }, { id: "two", version: 1 } as LeadSummary],
    page: 2,
  };
  const merged = appendPipelinePage(current, next);
  expect(merged.items.map((item) => [item.id, item.version])).toEqual([
    ["one", 2],
    ["two", 1],
  ]);
  expect(merged.page).toBe(2);
});
