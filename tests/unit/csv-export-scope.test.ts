import { createElement } from "react";
import { renderToReadableStream } from "react-dom/server";
import { expect, it, vi } from "vitest";

vi.mock("@/lib/auth/server", () => ({
  requireStaffSession: async () => ({ role: "agent" }),
}));
vi.mock("@/features/properties/crm/property-inventory-filters", () => ({
  PropertyInventoryFilters: () => null,
}));
vi.mock("@/features/properties/crm/property-inventory-results", () => ({
  PropertyInventoryResults: () => null,
}));
vi.mock("@/components/crm/csv-export-button", () => ({
  CsvExportButton: ({ scope, query }: { scope: string; query: string }) =>
    createElement("span", { "data-scope": scope, "data-query": query }),
}));

import PropertiesPage from "@/app/(staff)/crm/properties/page";
import { csvNavigationChangesScope } from "@/components/crm/csv-export";

it.each(["leads", "properties"])(
  "keeps equivalent query encodings in the same %s export scope",
  (entity) => {
    const current = `http://localhost:3100/crm/${entity}?q=Foo%20Bar&city=%44ubai`;
    expect(csvNavigationChangesScope(current, `?q=Foo+Bar&city=Dubai`)).toBe(
      false,
    );
    expect(csvNavigationChangesScope(current, `?q=Foo%2BBar&city=Dubai`)).toBe(
      true,
    );
    expect(csvNavigationChangesScope(current, `?q=Foo+Baz&city=Dubai`)).toBe(
      true,
    );
    expect(
      csvNavigationChangesScope(current, `?q=Foo+Bar&city=Dubai&page=2`),
    ).toBe(true);
  },
);

async function exportIdentity(params: Record<string, string>) {
  const page = await PropertiesPage({ searchParams: Promise.resolve(params) });
  const stream = await renderToReadableStream(page);
  const html = await new Response(stream).text();
  return {
    scope: html.match(/data-scope="([^"]*)"/)?.[1],
    query: html.match(/data-query="([^"]*)"/)?.[1],
  };
}

it("remounts the export session when active-page canonicalization changes the raw URL but not the applied filters", async () => {
  const bare = await exportIdentity({});
  const canonical = await exportIdentity({
    sort: "updated_desc",
    page: "1",
    pageSize: "12",
  });
  expect(bare.query).toBe(canonical.query);
  expect(bare.scope).toBe("");
  expect(canonical.scope).toBe("sort=updated_desc&amp;page=1&amp;pageSize=12");
  expect(bare.scope).not.toBe(canonical.scope);
});
