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

import { markNotificationRead } from "@/features/notifications/actions";

const id = "12b7aaf0-bd6b-4d07-a2e3-a657148c13e7";

beforeEach(() => {
  vi.clearAllMocks();
  boundary.session.mockResolvedValue({ id: "agent", role: "agent" });
  boundary.cookies.mockResolvedValue({
    get: (name: string) =>
      name === "agency.session" ? { value: "signed" } : undefined,
  });
  boundary.headers.mockResolvedValue(
    new Headers({ Origin: "http://localhost:3100", "x-secret": "private" }),
  );
  vi.stubEnv("API_URL", "http://localhost:4311");
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response(null, { status: 204 })),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

it("marks read with a bodyless PATCH and only the approved session cookie and Origin", async () => {
  expect(await markNotificationRead(id, "agent")).toEqual({ ok: true });
  expect(fetch).toHaveBeenCalledWith(
    `http://localhost:4311/api/v1/staff/notifications/${id}/read`,
    expect.objectContaining({
      method: "PATCH",
      headers: {
        Cookie: "agency.session=signed",
        Origin: "http://localhost:3100",
      },
      cache: "no-store",
    }),
  );
  expect(vi.mocked(fetch).mock.calls[0]?.[1]?.body).toBeUndefined();
});

it("rejects stale account, invalid IDs and malformed Origin before reaching Express", async () => {
  expect(await markNotificationRead(id, "previous-agent")).toMatchObject({
    ok: false,
    error: "session",
  });
  expect(await markNotificationRead("../other", "agent")).toMatchObject({
    ok: false,
    error: "request",
  });
  boundary.headers.mockResolvedValue(
    new Headers({ Origin: "https://example.com/path" }),
  );
  expect(await markNotificationRead(id, "agent")).toMatchObject({
    ok: false,
    error: "request",
  });
  expect(fetch).not.toHaveBeenCalled();
});

it.each([
  [401, "session"],
  [404, "missing"],
  [503, "unavailable"],
])("returns a safe result for a backend %i", async (status, error) => {
  vi.mocked(fetch).mockResolvedValue(
    Response.json({ error: { message: "private" } }, { status }),
  );
  expect(await markNotificationRead(id, "agent")).toEqual({ ok: false, error });
});
