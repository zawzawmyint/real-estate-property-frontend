import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";

const location = vi.hoisted(() => ({ pathname: "/crm", purpose: "sale" }));

vi.mock("next/navigation", () => ({
  usePathname: () => location.pathname,
  useSearchParams: () => new URLSearchParams({ purpose: location.purpose }),
}));

import { WorkspaceNavigation } from "@/components/layout/workspace-navigation";
import { PublicHeader } from "@/components/layout/public-header";

beforeEach(() => {
  location.pathname = "/crm";
  location.purpose = "sale";
});

it.each([
  "/crm/properties",
  "/crm/properties/new",
  "/crm/properties/123",
  "/crm/properties/123/edit",
])("keeps Properties selected at %s without selecting Overview", (pathname) => {
  location.pathname = pathname;
  const html = renderToStaticMarkup(createElement(WorkspaceNavigation));

  expect(html.match(/aria-current="page"/g)).toHaveLength(1);
  expect(html.match(/<a\b[^>]*aria-current="page"[^>]*>/)?.[0]).toContain(
    'href="/crm/properties"',
  );
  expect(html).toContain('aria-hidden="true"');
});

it.each(["sale", "rent"])(
  "selects only the matching public purpose %s",
  (purpose) => {
    location.pathname = "/properties";
    location.purpose = purpose;
    const html = renderToStaticMarkup(createElement(PublicHeader));

    expect(html.match(/aria-current="page"/g)).toHaveLength(1);
    expect(html.match(/<a\b[^>]*aria-current="page"[^>]*>/)?.[0]).toContain(
      `href="/properties?purpose=${purpose}"`,
    );
  },
);

it.each(["/", "/properties/123"])(
  "does not imply a selected purpose at %s",
  (pathname) => {
    location.pathname = pathname;
    const html = renderToStaticMarkup(createElement(PublicHeader));

    expect(html).not.toContain('aria-current="page"');
    expect(html).toContain('href="/properties?purpose=sale"');
    expect(html).toContain('href="/properties?purpose=rent"');
    expect(html).not.toContain('href="/crm"');
    expect(html).not.toContain("Agency workspace");
    expect(html.match(/<button\b[^>]*>/)?.[0]).toContain('disabled=""');
  },
);
