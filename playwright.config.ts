import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  workers: 4,
  reporter: "list",
  globalSetup: "./tests/fixtures/warmup.ts",
  expect: { timeout: 10_000 },
  use: {
    baseURL: "http://localhost:3100",
    trace: "retain-on-failure",
    extraHTTPHeaders: { "x-e2e-client-ip": "192.0.2.1" },
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
  ],
  webServer: [
    {
      command: "node tests/fixtures/backend-proxy.mjs",
      url: "http://127.0.0.1:4312/_e2e/health",
      reuseExistingServer: false,
    },
    {
      command: "node node_modules/next/dist/bin/next dev --webpack --port 3100",
      url: "http://localhost:3100",
      // Reuse only a frontend already started with this fixture API_URL.
      env: {
        API_URL: "http://127.0.0.1:4312",
        E2E_TEST_RUN: "1",
        INQUIRY_TRUSTED_CLIENT_HEADER: "x-e2e-client-ip",
        INQUIRY_RELAY_SECRET:
          process.env.INQUIRY_RELAY_SECRET ??
          "test-only-inquiry-relay-secret-for-browser-fixtures",
      },
      reuseExistingServer: process.env.E2E_REUSE_FRONTEND === "1",
      timeout: 120_000,
    },
  ],
});
