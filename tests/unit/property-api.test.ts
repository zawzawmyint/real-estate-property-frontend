import { afterEach, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { createProperty } from "@/features/properties/data/mutations";
import {
  requestProperty,
  PropertyApiError,
} from "@/features/properties/data/request";

afterEach(() => vi.unstubAllGlobals());

it("treats an invalid successful create response as uncertain instead of navigating to an undefined record", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response("{}", { status: 201 })),
  );
  await expect(
    createProperty({ title: "A draft", purpose: "sale" }, {}),
  ).rejects.toMatchObject({ status: 502, code: "INVALID_RESPONSE" });
});

it("uses no-store and preserves the service error contract", async () => {
  const fetch = vi.fn().mockResolvedValue(
    new Response(
      JSON.stringify({
        error: {
          code: "NOT_FOUND",
          message: "Property not found",
          requestId: "request-1",
        },
      }),
      { status: 404 },
    ),
  );

  vi.stubGlobal("fetch", fetch);
  await expect(
    requestProperty("/api/v1/properties/missing"),
  ).rejects.toMatchObject({
    status: 404,
    code: "NOT_FOUND",
    requestId: "request-1",
  });
  expect(fetch.mock.calls[0]?.[1].cache).toBe("no-store");
});

it("does not retry uncertain mutations or expose raw server messages", async () => {
  const fetch = vi.fn().mockRejectedValue(new Error("owner private value"));

  vi.stubGlobal("fetch", fetch);
  await expect(
    requestProperty("/api/v1/staff/properties", { method: "POST", body: "{}" }),
  ).rejects.toBeInstanceOf(PropertyApiError);
  expect(fetch).toHaveBeenCalledTimes(1);
});

it("accepts the empty successful delete response", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response(null, { status: 204 })),
  );
  await expect(
    requestProperty("/api/v1/staff/properties/id", { method: "DELETE" }),
  ).resolves.toBeUndefined();
});

it("distinguishes expired sessions from permission and service failures", async () => {
  const fetch = vi.fn().mockResolvedValue(
    new Response(
      JSON.stringify({
        error: { code: "UNAUTHENTICATED", message: "Expired" },
      }),
      { status: 401 },
    ),
  );

  vi.stubGlobal("fetch", fetch);
  await expect(
    requestProperty("/api/v1/staff/properties"),
  ).rejects.toMatchObject({
    status: 401,
    code: "UNAUTHENTICATED",
    message: expect.stringContaining("session has expired"),
  });
});
