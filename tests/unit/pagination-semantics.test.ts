import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
vi.mock("@/components/ui/navigation-pending", () => ({
  NavigationPending: () => null,
}));
import { PaginationNext } from "@/components/ui/pagination";

it("exposes page navigation as a native link rather than an action button", () => {
  const html = renderToStaticMarkup(
    h(PaginationNext, { href: "/crm/tasks?page=2" }),
  );
  expect(html).toContain('href="/crm/tasks?page=2"');
  expect(html).toContain('aria-label="Go to next page"');
  expect(html).not.toContain('role="button"');
  expect(html).not.toContain('type="button"');
});
