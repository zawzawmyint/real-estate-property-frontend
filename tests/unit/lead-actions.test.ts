import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";
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
  createLead,
  assignLead,
  updateLead,
  addLeadNote,
  sendInquiry,
} from "@/features/leads/data/actions";
import { inquiryRelayHeaders } from "@/features/leads/data/inquiry-relay";
const id = "12b7aaf0-bd6b-4d07-a2e3-a657148c13e7";
const input = {
  submissionId: id,
  name: "Ada",
  email: "ada@example.com",
  purpose: "sale" as const,
  source: "call" as const,
};
const saved = { id, version: 1, name: "Ada" };
beforeEach(() => {
  vi.clearAllMocks();
  boundary.session.mockResolvedValue({ id: "agent", role: "agent" });
  boundary.cookies.mockResolvedValue({
    get: (name: string) =>
      name === "agency.session" ? { value: "signed-cookie" } : undefined,
  });
  boundary.headers.mockResolvedValue(
    new Headers({
      Origin: "http://localhost:3100",
      "x-forwarded-for": "127.0.0.1",
      "x-secret": "never-forward",
    }),
  );
  vi.stubEnv("API_URL", "http://localhost:4311");
  vi.stubEnv(
    "INQUIRY_RELAY_SECRET",
    "lead-test-relay-secret-at-least-32-characters",
  );
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(saved)));
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
it("allows agent manual create with live session and only allowlisted headers", async () => {
  expect(await createLead(input)).toEqual({ ok: true, data: saved });
  expect(fetch).toHaveBeenCalledWith(
    "http://localhost:4311/api/v1/staff/leads",
    expect.objectContaining({
      method: "POST",
      body: JSON.stringify(input),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Cookie: "agency.session=signed-cookie",
        Origin: "http://localhost:3100",
      },
    }),
  );
});
it("denies expired sessions and agent assignments before dispatch", async () => {
  expect(
    await assignLead(id, { expectedVersion: 1, assignedAgentId: null }),
  ).toMatchObject({ ok: false, error: { status: 403 } });
  boundary.session.mockResolvedValue(null);
  expect(await createLead(input)).toMatchObject({
    ok: false,
    error: { status: 401 },
  });
  expect(fetch).not.toHaveBeenCalled();
});
it("rejects strict input, empty edits and invalid origin", async () => {
  expect(await updateLead(id, { expectedVersion: 1 })).toMatchObject({
    ok: false,
    error: { status: 400 },
  });
  expect(await createLead({ ...input, stage: "won" } as never)).toMatchObject({
    ok: false,
    error: { status: 400 },
  });
  boundary.headers.mockResolvedValue(
    new Headers({ Origin: "https://example.com/path" }),
  );
  expect(await createLead(input)).toMatchObject({
    ok: false,
    error: { status: 403 },
  });
  expect(fetch).not.toHaveBeenCalled();
});
it("marks lost mutation responses uncertain and never retries", async () => {
  vi.mocked(fetch).mockRejectedValue(new Error("connection lost"));
  expect(await createLead(input)).toMatchObject({
    ok: false,
    error: { uncertain: true },
  });
  expect(fetch).toHaveBeenCalledTimes(1);
});
it("preserves notes receipt key and expected version without implicit retry", async () => {
  const payload = {
    submissionId: id,
    expectedVersion: 4,
    kind: "call" as const,
    body: "Called client",
  };
  vi.mocked(fetch).mockResolvedValue(
    Response.json({ note: { id }, leadVersion: 5 }),
  );
  expect(await addLeadNote(id, payload)).toMatchObject({
    ok: true,
    data: { leadVersion: 5 },
  });
  expect(fetch).toHaveBeenCalledWith(
    expect.stringContaining("/notes"),
    expect.objectContaining({ body: JSON.stringify(payload) }),
  );
});
it("signs public real-client relay and excludes session", async () => {
  vi.mocked(fetch).mockResolvedValue(Response.json({ received: true }));
  expect(
    await sendInquiry(id, {
      submissionId: id,
      name: "Ada",
      email: "ada@example.com",
    }),
  ).toEqual({ ok: true, data: { received: true } });
  const [, options] = vi.mocked(fetch).mock.calls[0]!;
  const headers = options?.headers as Record<string, string>;
  expect(headers.Cookie).toBeUndefined();
  expect(headers["x-inquiry-client-key"]).toMatch(/^[a-f0-9]{64}$/);
  expect(headers["x-inquiry-relay-signature"]).toBe(
    createHmac("sha256", process.env.INQUIRY_RELAY_SECRET!)
      .update(headers["x-inquiry-client-key"]!)
      .digest("hex"),
  );
});
it("fails closed in production without explicit trusted ingress configuration", () => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("INQUIRY_TRUSTED_CLIENT_HEADER", "");
  expect(() =>
    inquiryRelayHeaders(new Headers({ "x-forwarded-for": "127.0.0.1" })),
  ).toThrow();
  vi.stubEnv("INQUIRY_TRUSTED_CLIENT_HEADER", "x-verified-client-ip");
  expect(
    inquiryRelayHeaders(new Headers({ "x-verified-client-ip": "203.0.113.5" }))[
      "x-inquiry-client-key"
    ],
  ).toMatch(/^[a-f0-9]{64}$/);
  expect(() =>
    inquiryRelayHeaders(
      new Headers({ "x-verified-client-ip": "1.2.3.4,5.6.7.8" }),
    ),
  ).toThrow();
});
