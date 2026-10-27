import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { config, proxy } from "@/proxy";

afterEach(() => vi.unstubAllEnvs());

describe("CRM optimistic route guard", () => {
  it("matches only CRM routes, including nested direct links", () => {
    for (const url of ["/crm", "/crm/properties", "/crm/leads/123/edit"])
      expect(unstable_doesMiddlewareMatch({ config, url })).toBe(true);
    for (const url of [
      "/",
      "/login",
      "/properties",
      "/api/v1/auth/get-session",
      "/_next/static/file.js",
      "/crm-other",
    ])
      expect(unstable_doesMiddlewareMatch({ config, url })).toBe(false);
  });

  it.each(["development", "production"])(
    "redirects without the configured %s cookie without fetching",
    (environment) => {
      vi.stubEnv("NODE_ENV", environment);
      const fetch = vi.spyOn(globalThis, "fetch");
      const response = proxy(
        new NextRequest("http://localhost:3100/crm/properties?q=test"),
      );
      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe(
        "http://localhost:3100/login",
      );
      expect(fetch).not.toHaveBeenCalled();
      fetch.mockRestore();
    },
  );

  it.each([
    ["development", "agency.session"],
    ["production", "__Host-agency.session"],
  ])(
    "only checks presence of the %s cookie; live verification remains downstream",
    (environment, name) => {
      vi.stubEnv("NODE_ENV", environment);
      const response = proxy(
        new NextRequest("https://example.com/crm", {
          headers: { Cookie: `${name}=unverified-cookie` },
        }),
      );
      expect(response.headers.get("x-middleware-next")).toBe("1");
    },
  );

  it("does not accept the development cookie in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const response = proxy(
      new NextRequest("https://example.com/crm", {
        headers: { Cookie: "agency.session=unverified-cookie" },
      }),
    );
    expect(response.status).toBe(307);
  });
});
