import { afterEach, beforeEach, expect, it, vi } from "vitest";

const boundary = vi.hoisted(() => ({ headers: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ headers: boundary.headers }));
vi.mock("@/lib/api/server", () => ({
  getBackendOrigin: () => "http://localhost:4311",
}));

import { sendPublicChat } from "@/features/public-chat/data/actions";

const reply = {
  kind: "faq",
  message: "Use the inquiry form to request a viewing.",
  sources: [{ id: "viewings", title: "Viewings", path: "/contact" }],
  properties: [],
};

beforeEach(() => {
  vi.stubEnv("PUBLIC_CHAT_ENABLED", "true");
  vi.stubEnv(
    "INQUIRY_RELAY_SECRET",
    "test-public-chat-relay-secret-at-least-32",
  );
  vi.stubEnv("INQUIRY_TRUSTED_CLIENT_HEADER", "x-trusted-ip");
  boundary.headers.mockResolvedValue(
    new Headers({
      origin: "http://localhost:3100",
      "x-trusted-ip": "192.0.2.1",
      cookie: "agency.session=private",
    }),
  );
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(reply)));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

it("relays one trimmed question with signed identity and without session credentials", async () => {
  expect(await sendPublicChat("  How do I request a viewing?  ")).toEqual({
    ok: true,
    reply,
  });
  expect(fetch).toHaveBeenCalledExactlyOnceWith(
    "http://localhost:4311/api/v1/public/chat",
    expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ message: "How do I request a viewing?" }),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Origin: "http://localhost:3100",
        "x-inquiry-client-key": expect.stringMatching(/^[a-f0-9]{64}$/),
        "x-inquiry-relay-signature": expect.stringMatching(/^[a-f0-9]{64}$/),
      },
    }),
  );
});

it("rejects invalid messages, origin and disabled calls before dispatch", async () => {
  expect(await sendPublicChat(" ".repeat(4))).toMatchObject({ ok: false });
  expect(await sendPublicChat("a".repeat(501))).toMatchObject({ ok: false });
  boundary.headers.mockResolvedValue(
    new Headers({ origin: "https://example.com/path" }),
  );
  expect(await sendPublicChat("A question")).toMatchObject({ ok: false });
  vi.stubEnv("PUBLIC_CHAT_ENABLED", "false");
  expect(await sendPublicChat("A question")).toMatchObject({ ok: false });
  expect(fetch).not.toHaveBeenCalled();
});

it("keeps unsafe source destinations and provider error details out of the UI", async () => {
  vi.mocked(fetch).mockResolvedValueOnce(
    Response.json({
      ...reply,
      sources: [{ ...reply.sources[0], path: "//evil.example" }],
    }),
  );
  expect(await sendPublicChat("How do I book?")).toMatchObject({ ok: false });

  vi.mocked(fetch).mockResolvedValueOnce(
    Response.json(
      { error: { message: "provider diagnostic" } },
      { status: 429 },
    ),
  );
  const limited = await sendPublicChat("How do I book?");
  expect(limited).toMatchObject({
    ok: false,
    message: expect.stringMatching(/busy/i),
  });
  expect(JSON.stringify(limited)).not.toContain("provider diagnostic");
});
