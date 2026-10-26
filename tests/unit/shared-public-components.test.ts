import { createElement as h } from "react";
import { renderToStaticMarkup as render } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { PublicSectionHeader } from "@/components/layout/public-section-header";
import { PublicSearchPanel } from "@/components/layout/public-search-panel";
import { PropertyGrid } from "@/features/properties/public/property-grid";
import type { PublicPropertySummary } from "@/features/properties/data/types";
vi.mock("@/features/properties/public/property-card", () => ({
  PropertyCard: ({
    property,
    resultsQuery,
  }: {
    property: PublicPropertySummary;
    resultsQuery?: string;
  }) =>
    h(
      "a",
      {
        href: `/properties/${property.id}${resultsQuery ? `?from=${encodeURIComponent(resultsQuery)}` : ""}`,
      },
      property.title,
    ),
}));
it("retains page/section heading semantics, identifiers and action links", () => {
  const page = render(
    h(PublicSectionHeader, {
      level: 1,
      id: "collection",
      title: "Homes",
      eyebrow: "Explore",
      description: "Our collection",
    }),
  );
  expect(page).toMatch(/<h1[^>]*id="collection"/);
  expect(page).toContain("Explore");
  expect(page).toContain("Our collection");
  const section = render(
    h(PublicSectionHeader, {
      level: 2,
      title: "Featured",
      actions: h("a", { href: "/properties" }, "View all"),
    }),
  );
  expect(section).toContain("Featured</h2>");
  expect(section).not.toContain("<h1");
  expect(section).toContain('href="/properties"');
  expect(section).not.toContain("<p");
});
it("wraps public search treatments without introducing another form", () => {
  for (const treatment of ["hero", "listing"] as const) {
    const html = render(
      h(PublicSearchPanel, {
        treatment,
        children: h("form", { "aria-label": "Search" }),
      }),
    );
    expect(html.match(/<form/g)).toHaveLength(1);
    expect(html).toContain("bg-card");
  }
});
it("preserves card order and forwards optional result context", () => {
  const properties = [
    { id: "one", title: "First" },
    { id: "two", title: "Second" },
  ] as PublicPropertySummary[];
  const query = "purpose=rent&page=2";
  const results = render(h(PropertyGrid, { properties, resultsQuery: query }));
  expect(results.indexOf("First")).toBeLessThan(results.indexOf("Second"));
  expect(results).toContain(`?from=${encodeURIComponent(query)}`);
  expect(render(h(PropertyGrid, { properties }))).not.toContain("?from=");
  expect(render(h(PropertyGrid, { properties: [] }))).not.toContain("<a");
});
