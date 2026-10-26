import { createServer, type Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ApiError, requestHealth } from "../../src/lib/api/transport";
import { parseApiOrigin } from "../../src/lib/env";

let server: Server;
let origin: string;

beforeAll(async () => {
  server = createServer((req, res) => {
    res.setHeader("Content-Type", "application/json");

    if (req.url === "/api/v1/health") {
      res.end(JSON.stringify({ status: "ok", service: "real-estate-api" }));
    } else if (req.url?.startsWith("/error/")) {
      res.writeHead(503);
      res.end(
        JSON.stringify({
          error: {
            code: "UNAVAILABLE",
            message: "Try later",
            requestId: "request-123",
          },
        }),
      );
    } else if (req.url?.startsWith("/slow/")) {
      setTimeout(() => res.end("{}"), 100);
    } else {
      res.end(JSON.stringify({ status: "ok", service: "wrong-service" }));
    }
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));

  const address = server.address();

  if (!address || typeof address === "string")
    throw new Error("Missing test port");

  origin = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
});

describe("backend transport", () => {
  it("reads and validates the actual health response", async () => {
    await expect(requestHealth(origin)).resolves.toEqual({
      status: "ok",
      service: "real-estate-api",
    });
  });
  it("preserves structured backend error details for diagnostics", async () => {
    await expect(requestHealth(`${origin}/error`)).rejects.toMatchObject({
      name: "ApiError",
      status: 503,
      code: "UNAVAILABLE",
      requestId: "request-123",
      message: "Try later",
    });
  });
  it("rejects a successful response with the wrong contract", async () => {
    await expect(requestHealth(`${origin}/invalid`)).rejects.toThrow(
      "Invalid health response",
    );
  });
  it("stops waiting after the configured timeout", async () => {
    await expect(requestHealth(`${origin}/slow`, 10)).rejects.toThrow();
  });
  it("uses a distinct error class for HTTP failures", async () => {
    await expect(requestHealth(`${origin}/error`)).rejects.toBeInstanceOf(
      ApiError,
    );
  });
});

describe("server API configuration", () => {
  it("defaults to the local Express origin", () =>
    expect(parseApiOrigin(undefined)).toBe("http://localhost:4311"));
  it("normalizes a trailing slash", () =>
    expect(parseApiOrigin("https://api.example.com/")).toBe(
      "https://api.example.com",
    ));
  it.each([
    "",
    "not-a-url",
    "ftp://example.com",
    "https://user:pass@example.com",
    "https://example.com/path",
    "https://example.com/?secret=1",
  ])("rejects unsafe or non-origin configuration: %s", (value) => {
    expect(() => parseApiOrigin(value)).toThrow(
      "API_URL must be an HTTP(S) origin",
    );
  });
});
