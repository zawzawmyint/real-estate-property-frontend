import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { PropertyInventory } from "@/features/properties/crm/property-inventory";
import { PropertyReadOnly } from "@/features/properties/crm/property-read-only";
import type { StaffProperty } from "@/features/properties/data/types";

const property: StaffProperty = {
  id: "12345678-1234-1234-1234-123456789012",
  title: "A saved property",
  purpose: "sale",
  type: "apartment",
  description: "Saved description",
  priceFils: 12345600,
  city: "Dubai",
  community: "Marina",
  bedrooms: 0,
  bathrooms: 2,
  areaSqft: "745.25",
  ownerName: "Private owner",
  ownerPhone: "+971 50 000 0000",
  featured: false,
  publishingState: "published",
  availability: "available",
  photos: [],
  isDemo: false,
  createdAt: "2026-10-23T00:00:00Z",
  updatedAt: "2026-10-23T00:00:00Z",
};

it("separates inventory detail, edit and public destinations", () => {
  const html = renderToStaticMarkup(
    createElement(PropertyInventory, {
      result: { items: [property], total: 1, page: 1, pageSize: 12 },
      filters: {},
      canEdit: true,
    }),
  );
  const links = html.match(/<a\b[^>]*>/g) ?? [];
  for (const [label, href] of [
    ["View details", `/crm/properties/${property.id}`],
    ["Edit", `/crm/properties/${property.id}/edit`],
    ["View public listing", `/properties/${property.id}`],
  ]) {
    const actions = links.filter((link) =>
      link.includes(`aria-label="${label}"`),
    );
    expect(actions).toHaveLength(2);
    for (const action of actions) expect(action).toContain(`href="${href}"`);
  }
});

it("keeps Agent navigation read-only and hides ineligible public links", () => {
  const html = renderToStaticMarkup(
    createElement(PropertyInventory, {
      result: {
        items: [{ ...property, publishingState: "draft" }],
        total: 1,
        page: 1,
        pageSize: 12,
      },
      filters: {},
      canEdit: false,
    }),
  );
  expect(html).toContain("View details");
  expect(html).not.toContain(`/crm/properties/${property.id}/edit`);
  expect(html).not.toContain("View public listing");
});

it("uses saved read-only details for editors while keeping private fields out of Agent presentation", () => {
  const editor = renderToStaticMarkup(
    createElement(PropertyReadOnly, { property, canEdit: true }),
  );
  const agent = renderToStaticMarkup(
    createElement(PropertyReadOnly, { property, canEdit: false }),
  );
  expect(editor).toContain("Private owner");
  expect(editor).not.toContain("You have read-only access");
  expect(agent).not.toContain("Private owner");
  expect(agent).not.toContain(property.ownerPhone!);
  expect(agent).toContain("You have read-only access");
  for (const html of [editor, agent]) {
    expect(html).toContain("Studio");
    expect(html).toContain("Saved description");
    expect(html).not.toMatch(/<(?:input|form|textarea|select)\b/);
  }
});
