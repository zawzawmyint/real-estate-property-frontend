import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/ui/navigation-pending", () => ({
  NavigationPending: () => null,
}));

import { getCollectionPageRange } from "@/components/crm/collection-page-range";
import { CollectionPagination } from "@/components/crm/collection-pagination";

describe("workspace collection pagination", () => {
  it.each([
    { page: 1, total: 0, start: 0, end: 0, current: 1, items: [1] },
    { page: 1, total: 7, start: 1, end: 7, current: 1, items: [1] },
    {
      page: 1,
      total: 200,
      start: 1,
      end: 20,
      current: 1,
      items: [1, 2, "ellipsis", 10],
    },
    {
      page: 5,
      total: 200,
      start: 81,
      end: 100,
      current: 5,
      items: [1, "ellipsis", 4, 5, 6, "ellipsis", 10],
    },
    {
      page: 10,
      total: 193,
      start: 181,
      end: 193,
      current: 10,
      items: [1, "ellipsis", 9, 10],
    },
    { page: 99, total: 25, start: 0, end: 0, current: 99, items: [1, 2] },
  ])(
    "bounds navigation and visible rows for page $page of $total records",
    ({ page, total, start, end, current, items }) => {
      const range = getCollectionPageRange(page, 20, total);

      expect(range).toMatchObject({ start, end, page: current, items });
      expect(range.items.length).toBeLessThanOrEqual(7);
    },
  );

  it("retains caller queries in numbered and adjacent native links", () => {
    const html = renderToStaticMarkup(
      h(CollectionPagination, {
        variant: "workspace",
        page: 2,
        pageSize: 20,
        total: 65,
        href: (page) =>
          `/crm/properties?publishingState=published&page=${page}`,
      }),
    );

    expect(html).toContain("Showing 21–40 of 65");
    expect(html).toContain(
      'href="/crm/properties?publishingState=published&amp;page=1"',
    );
    expect(html).toContain(
      'href="/crm/properties?publishingState=published&amp;page=3"',
    );
    expect(html).toContain('aria-current="page"');
  });

  it("keeps an empty collection count without invalid adjacent links", () => {
    const html = renderToStaticMarkup(
      h(CollectionPagination, {
        variant: "workspace",
        page: 1,
        pageSize: 20,
        total: 0,
        href: (page) => `/crm/properties?page=${page}`,
      }),
    );

    expect(html).toContain("Showing 0–0 of 0");
    expect(html).not.toContain('aria-label="Go to previous page"');
    expect(html).not.toContain('aria-label="Go to next page"');
  });

  it("preserves the requested empty page and its previous link without marking a valid page current", () => {
    const html = renderToStaticMarkup(
      h(CollectionPagination, {
        variant: "workspace",
        page: 99,
        pageSize: 20,
        total: 25,
        href: (page) =>
          `/crm/properties?publishingState=published&page=${page}`,
      }),
    );

    expect(html).toContain("Showing 0–0 of 25");
    expect(html).toMatch(/<span[^>]*aria-current="page"[^>]*>Page 99<\/span>/);
    expect(html).not.toMatch(/<a[^>]*aria-current="page"/);
    expect(html).toContain(
      'href="/crm/properties?publishingState=published&amp;page=98"',
    );
    expect(html).toContain(
      'href="/crm/properties?publishingState=published&amp;page=2"',
    );
    expect(html).not.toContain('aria-label="Go to next page"');
  });
});
