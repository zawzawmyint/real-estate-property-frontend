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
import {
  createViewing,
  rescheduleViewing,
  updateViewingStatus,
} from "@/features/viewings/data/actions";
const id = "12b7aaf0-bd6b-4d07-a2e3-a657148c13e7";
const input = {
  submissionId: id,
  leadId: id,
  propertyId: id,
  expectedLeadVersion: 1,
  startsAt: "2026-12-31T10:00:00+04:00",
  endsAt: "2026-12-31T11:00:00+04:00",
};
const saved = { id, version: 1, lead: { id }, property: { id } };
beforeEach(() => {
  vi.clearAllMocks();
  boundary.session.mockResolvedValue({ id: "agent", role: "agent" });
  boundary.cookies.mockResolvedValue({
    get: (name: string) =>
      name === "agency.session" ? { value: "signed" } : undefined,
  });
  boundary.headers.mockResolvedValue(
    new Headers({
      Origin: "http://localhost:3100",
      "x-secret": "never-forward",
    }),
  );
  vi.stubEnv("API_URL", "http://localhost:4311");
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(saved)));
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
it("authenticates every action and forwards only approved cookie and Origin", async () => {
  expect(await createViewing(input)).toEqual({ ok: true, data: saved });
  expect(fetch).toHaveBeenCalledWith(
    "http://localhost:4311/api/v1/staff/viewings",
    expect.objectContaining({
      method: "POST",
      body: JSON.stringify(input),
      headers: {
        Accept: "application/json",
        Cookie: "agency.session=signed",
        Origin: "http://localhost:3100",
        "Content-Type": "application/json",
      },
    }),
  );
  boundary.session.mockResolvedValue(null);
  vi.mocked(fetch).mockClear();
  expect(
    await updateViewingStatus(id, { expectedVersion: 1, status: "cancelled" }),
  ).toMatchObject({ ok: false, error: { status: 401 } });
  expect(fetch).not.toHaveBeenCalled();
});
it("validates IDs, payloads and origin before dispatch", async () => {
  expect(
    await rescheduleViewing("bad", {
      expectedVersion: 1,
      expectedLeadVersion: 1,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
    }),
  ).toMatchObject({ ok: false, error: { status: 400 } });
  boundary.headers.mockResolvedValue(
    new Headers({ Origin: "http://localhost:3100/path" }),
  );
  expect(await createViewing(input)).toMatchObject({
    ok: false,
    error: { status: 403 },
  });
  expect(fetch).not.toHaveBeenCalled();
});
it("returns safe stale-version failures without uncertain flags", async () => {
  vi.mocked(fetch).mockResolvedValue(
    Response.json(
      {
        error: {
          code: "VERSION_CONFLICT",
          message: "Review latest",
          requestId: "req",
        },
      },
      { status: 409 },
    ),
  );
  expect(await createViewing(input)).toEqual({
    ok: false,
    error: {
      code: "VERSION_CONFLICT",
      message: "Review latest",
      status: 409,
      requestId: "req",
    },
  });
});
it("marks network and malformed success outcomes uncertain without retrying", async () => {
  vi.mocked(fetch).mockRejectedValueOnce(new Error("lost"));
  expect(await createViewing(input)).toMatchObject({
    ok: false,
    error: { uncertain: true },
  });
  expect(fetch).toHaveBeenCalledTimes(1);
  vi.mocked(fetch).mockResolvedValueOnce(Response.json({}));
  expect(await createViewing(input)).toMatchObject({
    ok: false,
    error: { uncertain: true, code: "INVALID_RESPONSE" },
  });
});
it("returns only validated authorized receipt identifiers for explicit review", async () => {
  for (const existingViewingId of [id, "javascript:alert(1)", undefined]) {
    vi.mocked(fetch).mockResolvedValueOnce(
      Response.json(
        {
          error: {
            code: "VIEWING_RECEIPT_CONFLICT",
            message: "Review saved viewing",
            existingViewingId,
          },
        },
        { status: 409 },
      ),
    );
    const result = await createViewing(input);
    expect(result).toMatchObject({
      ok: false,
      error: { code: "VIEWING_RECEIPT_CONFLICT", status: 409 },
    });
    if (!result.ok)
      expect(result.error.existingViewingId).toBe(
        existingViewingId === id ? id : undefined,
      );
  }
});
