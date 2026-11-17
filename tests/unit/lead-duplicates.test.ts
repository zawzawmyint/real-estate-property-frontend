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
import { checkLeadDuplicates } from "@/features/leads/data/duplicate-actions";
import { createLead } from "@/features/leads/data/actions";
import {
  parseLeadFilters,
  leadExportQuery,
} from "@/features/leads/data/filters";
import { patchLeadSchema } from "@/features/leads/data/input";
const token = "a".repeat(64);
const review = {
  canonicalPhone: "+971501234567",
  totalMatches: 0,
  matches: [],
  truncated: false,
  reviewToken: token,
};
beforeEach(() => {
  boundary.session.mockResolvedValue({ id: "staff", role: "agent" });
  boundary.cookies.mockResolvedValue({ get: () => ({ value: "signed" }) });
  boundary.headers.mockResolvedValue(
    new Headers({ Origin: "http://localhost:3100" }),
  );
  vi.stubEnv("API_URL", "http://localhost:4311");
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(review)));
});
afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
it("checks duplicates through an authenticated body-based action without a phone URL", async () => {
  expect(await checkLeadDuplicates({ phone: "0501234567" })).toEqual({
    ok: true,
    data: review,
  });
  expect(fetch).toHaveBeenCalledWith(
    "http://localhost:4311/api/v1/staff/leads/duplicate-check",
    expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ phone: "0501234567" }),
      headers: expect.objectContaining({
        Cookie: "agency.session=signed",
        Origin: "http://localhost:3100",
      }),
    }),
  );
});
it("rejects absent sessions and malformed review responses", async () => {
  boundary.session.mockResolvedValueOnce(null);
  expect(await checkLeadDuplicates({ phone: "0501234567" })).toMatchObject({
    ok: false,
    error: { status: 401 },
  });
  expect(fetch).not.toHaveBeenCalled();
  vi.mocked(fetch).mockResolvedValueOnce(
    Response.json({ ...review, totalMatches: 1 }),
  );
  expect(await checkLeadDuplicates({ phone: "0501234567" })).toMatchObject({
    ok: false,
    error: { code: "INVALID_RESPONSE" },
  });
});
it("preserves definite duplicate-review conflicts and phone validation diagnostics", async () => {
  vi.mocked(fetch).mockResolvedValueOnce(
    Response.json(
      {
        error: {
          code: "LEAD_DUPLICATE_REVIEW_REQUIRED",
          message: "Review matches",
        },
        duplicateReview: review,
      },
      { status: 409 },
    ),
  );
  const input = {
    submissionId: "12b7aaf0-bd6b-4d07-a2e3-a657148c13e7",
    name: "Ada",
    phone: "0501234567",
    purpose: "sale" as const,
    source: "call" as const,
    duplicateAcknowledgement: { reviewToken: token },
  };
  expect(await createLead(input)).toMatchObject({
    ok: false,
    error: { code: "LEAD_DUPLICATE_REVIEW_REQUIRED", duplicateReview: review },
  });
  vi.mocked(fetch).mockResolvedValueOnce(
    Response.json(
      {
        error: { code: "VALIDATION_ERROR", message: "Check phone" },
        fieldErrors: { phone: ["Use an international country code."] },
      },
      { status: 400 },
    ),
  );
  expect(await createLead(input)).toMatchObject({
    ok: false,
    error: { fieldErrors: { phone: ["Use an international country code."] } },
  });
});
it("preserves the duplicate filter through pagination and exports and rejects invalid values", () => {
  const filters = parseLeadFilters(
    new URLSearchParams("view=mine&duplicates=only&page=2"),
    "agent",
  );
  expect(filters).toMatchObject({ duplicates: "only", page: 2 });
  expect(leadExportQuery(filters)).toContain("duplicates=only");
  expect(leadExportQuery(filters)).not.toContain("page=");
  expect(() =>
    parseLeadFilters(new URLSearchParams("duplicates=all"), "manager"),
  ).toThrow();
});
it("does not accept acknowledgement-only updates", () => {
  expect(
    patchLeadSchema.safeParse({
      expectedVersion: 1,
      duplicateAcknowledgement: { reviewToken: token },
    }).success,
  ).toBe(false);
});
