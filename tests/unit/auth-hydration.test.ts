import { createElement, Suspense } from "react";
import { renderToStaticMarkup, renderToReadableStream } from "react-dom/server";
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

it("does not expose an enabled sign-out button before hydration", async () => {
  const stream = await renderToReadableStream(
    createElement(
      StaffAccountProvider,
      {
        staff: Promise.resolve({
          id: "a",
          name: "Staff",
          email: "staff@example.com",
          role: "agent" as const,
          expiresAt: "2026-10-22T20:00:00Z",
        }),
      },
      createElement(StaffAccount),
    ),
  );
  await stream.allReady;
  const html = await new Response(stream).text();

  expect(html.match(/<button\b[^>]*>/)?.[0]).toContain('disabled=""');
  expect(html).toContain('aria-label="Sign out"');
  expect(html).toContain("Staff");
  expect(html).toContain("Agent");
});

it("renders static shell content while only the account waits for verified identity", () => {
  const staff = new Promise<null>(() => {});
  const html = renderToStaticMarkup(
    createElement(
      StaffAccountProvider,
      { staff },
      createElement("nav", null, "Static workspace navigation"),
      createElement(
        Suspense,
        { fallback: createElement("p", null, "Checking account") },
        createElement(StaffAccount),
      ),
    ),
  );
  expect(html).toContain("Static workspace navigation");
  expect(html).toContain("Checking account");
  expect(html).not.toContain('aria-label="Sign out"');
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
