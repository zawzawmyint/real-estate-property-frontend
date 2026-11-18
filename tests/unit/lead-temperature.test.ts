import { afterEach, beforeEach, expect, it, vi } from "vitest";
const boundary = vi.hoisted(() => ({
  session: vi.fn(),
  cookies: vi.fn(),
  headers: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/server", () => ({ getStaffSession: boundary.session }));
vi.mock("next/headers", () => ({
  cookies: boundary.cookies,
  headers: boundary.headers,
}));
import { changeTemperature } from "@/features/leads/data/actions";
import {
  parseLeadFilters,
  leadQuery,
  leadExportQuery,
  safeLeadReturn,
} from "@/features/leads/data/filters";
import {
  parsePipelineFilters,
  pipelineQuery,
} from "@/features/leads/data/pipeline";
import {
  temperatureSchema,
  temperatureLabels,
} from "@/features/leads/data/input";
const id = "00000000-0000-4000-8000-000000000001";
beforeEach(() => {
  boundary.session.mockResolvedValue({ id: "staff", role: "agent" });
  boundary.cookies.mockResolvedValue({ get: () => ({ value: "signed" }) });
  boundary.headers.mockResolvedValue(
    new Headers({ Origin: "http://localhost:3100" }),
  );
  vi.stubEnv("API_URL", "http://localhost:4311");
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue(Response.json({ id, version: 2, temperature: "hot" })),
  );
});
afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
it("validates four values, exact labels and a dedicated authenticated action", async () => {
  expect(Object.values(temperatureLabels)).toEqual([
    "Hot",
    "Warm",
    "Cold",
    "Not assessed",
  ]);
  expect(
    temperatureSchema.safeParse({ temperature: "Hot", expectedVersion: 1 })
      .success,
  ).toBe(false);
  expect(
    (await changeTemperature(id, { temperature: "hot", expectedVersion: 1 }))
      .ok,
  ).toBe(true);
  expect(fetch).toHaveBeenCalledWith(
    `http://localhost:4311/api/v1/staff/leads/${id}/temperature`,
    expect.objectContaining({
      method: "PATCH",
      body: JSON.stringify({ expectedVersion: 1, temperature: "hot" }),
    }),
  );
  vi.mocked(fetch).mockClear();
  expect(
    (await changeTemperature("bad", { temperature: "hot", expectedVersion: 1 }))
      .ok,
  ).toBe(false);
  expect(
    (await changeTemperature(id, { temperature: "hot", expectedVersion: 0 }))
      .ok,
  ).toBe(false);
  expect(fetch).not.toHaveBeenCalled();
});
it("preserves temperature through list, export, pipeline and return links without accepting repeated values", () => {
  const filters = parseLeadFilters(
    new URLSearchParams("view=all&temperature=unassessed&source=call&page=2"),
    "manager",
  );
  expect(
    parseLeadFilters(new URLSearchParams(leadQuery(filters)), "manager"),
  ).toEqual(filters);
  expect(leadExportQuery(filters)).toContain("temperature=unassessed");
  expect(leadExportQuery(filters)).not.toContain("page=");
  const pipeline = parsePipelineFilters(leadQuery(filters), "manager");
  expect(pipelineQuery(pipeline, "offer")).toContain("temperature=unassessed");
  expect(pipeline.page).toBe(1);
  expect(safeLeadReturn(leadQuery(filters), "manager")).toContain(
    "temperature=unassessed",
  );
  for (const query of [
    "temperature=",
    "temperature=Hot",
    "temperature=hot&temperature=cold",
  ]) {
    expect(() =>
      parseLeadFilters(new URLSearchParams(query), "manager"),
    ).toThrow();
    expect(() => parsePipelineFilters(query, "manager")).toThrow();
  }
});
