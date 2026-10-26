import { expect, it } from "vitest";
import { getDemoLoginConfig } from "@/features/auth/demo-login";

const password = "fixture-demo-password";

it("omits demo credentials outside development even when configured", () => {
  for (const NODE_ENV of ["production", "test", undefined]) {
    expect(
      getDemoLoginConfig({ NODE_ENV, DEMO_STAFF_PASSWORD: password }),
    ).toBeUndefined();
  }
});

it("omits demo access when the local password is absent or outside the staff password policy", () => {
  for (const DEMO_STAFF_PASSWORD of [
    undefined,
    "",
    "too-short",
    "a".repeat(129),
  ]) {
    expect(
      getDemoLoginConfig({ NODE_ENV: "development", DEMO_STAFF_PASSWORD }),
    ).toBeUndefined();
  }
});

it("uses the three provisioned demo accounts only for configured development", () => {
  expect(
    getDemoLoginConfig({
      NODE_ENV: "development",
      DEMO_STAFF_PASSWORD: password,
    }),
  ).toEqual({
    password,
    accounts: [
      { role: "admin", label: "Admin", email: "demo.admin@example.com" },
      { role: "manager", label: "Manager", email: "demo.manager@example.com" },
      { role: "agent", label: "Agent", email: "demo.agent@example.com" },
    ],
  });
});
