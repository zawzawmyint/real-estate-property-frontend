import { afterEach, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/api/server", () => ({
  getBackendOrigin: () => "http://backend.test",
}));

import {
  getPublicAgency,
  getPublicAgent,
  getPublicAgents,
} from "@/features/agency/data/queries";

afterEach(() => vi.unstubAllGlobals());

it("reads public content anonymously with no-store and a bounded timeout", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify({ items: [], total: 0 })));
  vi.stubGlobal("fetch", fetch);

  await expect(getPublicAgents()).resolves.toEqual({ items: [], total: 0 });

  expect(fetch).toHaveBeenCalledWith(
    "http://backend.test/api/v1/public/agents",
    expect.objectContaining({
      cache: "no-store",
      credentials: "omit",
      headers: { Accept: "application/json" },
      signal: expect.any(AbortSignal),
    }),
  );
});

it("distinguishes an unknown profile from an unavailable catalog", async () => {
  const fetch = vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ error: { code: "NOT_FOUND" } }), {
      status: 404,
    }),
  );
  vi.stubGlobal("fetch", fetch);

  await expect(getPublicAgent("missing-person")).rejects.toMatchObject({
    status: 404,
    code: "NOT_FOUND",
  });

  fetch.mockResolvedValue(
    new Response(
      JSON.stringify({ error: { message: "private catalog failure" } }),
      {
        status: 503,
      },
    ),
  );
  await expect(getPublicAgency()).rejects.toMatchObject({
    status: 503,
    message: "Agency information is temporarily unavailable. Please try again.",
  });
});

it("rejects invalid slugs without a backend lookup", async () => {
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);

  await expect(getPublicAgent("../private")).rejects.toMatchObject({
    status: 404,
  });
  expect(fetch).not.toHaveBeenCalled();
});

it("treats dropped or malformed content responses as unavailable", async () => {
  const fetch = vi.fn().mockRejectedValue(new Error("private details"));
  vi.stubGlobal("fetch", fetch);

  await expect(getPublicAgency()).rejects.toMatchObject({ status: 0 });
  expect(fetch).toHaveBeenCalledTimes(1);

  fetch.mockResolvedValue(new Response("null"));
  await expect(getPublicAgency()).rejects.toMatchObject({ status: 502 });
});
