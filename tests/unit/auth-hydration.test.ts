import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("@/components/ui/button", () => ({
  Button: (props: object) => createElement("button", props),
}));
vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: () => ({
      data: null,
      isPending: true,
      error: null,
      refetch: vi.fn(),
    }),
  },
}));

import { LoginForm } from "../../src/features/auth/login-form";
import {
  StaffAccount,
  StaffAccountProvider,
} from "../../src/features/auth/staff-account";
import { PropertyInventoryFilters } from "@/features/properties/crm/property-inventory-filters";
import { getDemoLoginConfig } from "@/features/auth/demo-login";

it("keeps streamed inventory filters inert until their submit handler is ready", () => {
  const html = renderToStaticMarkup(
    createElement(PropertyInventoryFilters, { filters: {} }),
  );

  expect(html.match(/<fieldset\b[^>]*>/)?.[0]).toContain('disabled=""');
});

it("renders login fields and actions disabled until their React handlers are ready", () => {
  const html = renderToStaticMarkup(createElement(LoginForm));

  expect(html).toContain('method="post"');

  const controls = html.match(/<(?:input|button)\b[^>]*>/g) ?? [];

  expect(controls).toHaveLength(4);

  for (const control of controls) expect(control).toContain('disabled=""');
});

it("does not expose an enabled sign-out button before hydration", () => {
  const html = renderToStaticMarkup(
    createElement(
      StaffAccountProvider,
      {
        staff: {
          id: "a",
          name: "Staff",
          email: "staff@example.com",
          role: "agent",
          expiresAt: "2026-10-22T20:00:00Z",
        },
      },
      createElement(StaffAccount),
    ),
  );

  expect(html.match(/<button\b[^>]*>/)?.[0]).toContain('disabled=""');
  expect(html).toContain('aria-label="Sign out"');
  expect(html).toContain("Staff");
  expect(html).toContain("Agent");
});

it("keeps all three demo login actions inert until hydration", () => {
  const demoLogin = getDemoLoginConfig({
    NODE_ENV: "development",
    DEMO_STAFF_PASSWORD: "fixture-demo-password",
  });
  const html = renderToStaticMarkup(createElement(LoginForm, { demoLogin }));

  for (const role of ["Admin", "Manager", "Agent"])
    expect(html).toContain(`Sign in as demo ${role}`);
  const controls = html.match(/<(?:input|button)\b[^>]*>/g) ?? [];
  expect(controls).toHaveLength(7);
  for (const control of controls) expect(control).toContain('disabled=""');
});
