import { afterEach, describe, expect, it, vi } from "vitest";
import {
  requestStaffSession,
  SessionServiceError,
} from "../../src/lib/auth/transport";

afterEach(() => vi.unstubAllGlobals());

const native = {
  user: {
    id: "staff-1",
    name: "Maya",
    email: "maya@example.com",
    role: "agent",
  },
  session: { token: "private-token", expiresAt: "2026-10-22T20:00:00.000Z" },
};

describe("server staff session transport", () => {
  it("forwards only the configured auth cookie, never caches, and limits waiting", async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json(native));

    vi.stubGlobal("fetch", fetcher);

    const result = await requestStaffSession(
      "http://localhost:4311",
      [
        { name: "agency.session", value: "signed-value" },
        { name: "__Host-agency.session", value: "other" },
        { name: "analytics", value: "not-auth" },
      ],
      false,
    );

    expect(fetcher).toHaveBeenCalledWith(
      "http://localhost:4311/api/v1/auth/get-session",
      expect.objectContaining({
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/json",
          Cookie: "agency.session=signed-value",
        },
        signal: expect.any(AbortSignal),
      }),
    );
    expect(result).toEqual({
      ...native.user,
      expiresAt: native.session.expiresAt,
    });
    expect(JSON.stringify(result)).not.toContain("private-token");
  });
  it("uses the production host cookie exclusively", async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json(null));

    vi.stubGlobal("fetch", fetcher);
    await requestStaffSession(
      "https://api.example.com",
      [
        { name: "__Host-agency.session", value: "signed" },
        { name: "agency.session", value: "dev" },
      ],
      true,
    );
    expect(fetcher.mock.calls[0]?.[1].headers.Cookie).toBe(
      "__Host-agency.session=signed",
    );
  });
  it("accepts a native 200 null as anonymous", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(null)));
    await expect(
      requestStaffSession("http://localhost:4311", [], false),
    ).resolves.toBeNull();
  });
  it.each([
    {},
    { user: native.user },
    { ...native, user: { ...native.user, role: "Owner" } },
    { ...native, session: { expiresAt: "broken" } },
  ])("rejects malformed session data", async (body) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(body)));
    await expect(
      requestStaffSession("http://localhost:4311", [], false),
    ).rejects.toBeInstanceOf(SessionServiceError);
  });
  it.each([401, 403, 429, 500, 503])(
    "does not turn native error %s into anonymous",
    async (status) => {
      vi.stubGlobal(
        "fetch",
        vi
          .fn()
          .mockResolvedValue(
            Response.json(
              { code: "UNAVAILABLE", message: "internal diagnostic" },
              { status },
            ),
          ),
      );
      await expect(
        requestStaffSession("http://localhost:4311", [], false),
      ).rejects.toThrow(
        "Session verification is unavailable. Please try again.",
      );
    },
  );
  it("rejects non-JSON and network failure as recoverable errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("bad gateway")),
    );
    await expect(
      requestStaffSession("http://localhost:4311", [], false),
    ).rejects.toBeInstanceOf(SessionServiceError);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("connection refused")),
    );
    await expect(
      requestStaffSession("http://localhost:4311", [], false),
    ).rejects.toBeInstanceOf(SessionServiceError);
  });
  it("uses a five-second timeout", async () => {
    const timeout = vi.spyOn(AbortSignal, "timeout");

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(null)));
    await requestStaffSession("http://localhost:4311", [], false);
    expect(timeout).toHaveBeenCalledWith(5_000);
    timeout.mockRestore();
  });
});
