import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { PageHeader } from "@/components/layout/page-header";
import { FilterPanel } from "@/components/layout/filter-panel";

it("gives pages one heading and preserves semantic action links", () => {
  const html = renderToStaticMarkup(
    h(PageHeader, {
      title: "Contacts",
      description: "Manage contacts",
      actions: h("a", { href: "/crm/contacts/new" }, "New contact"),
    }),
  );
  expect(html).toContain("<h1");
  expect(html).toContain("Contacts</h1>");
  expect(html).toContain('href="/crm/contacts/new"');
  expect(html).toContain("Manage contacts");
});
it("disables native filter controls without swallowing surrounding feature slots", () => {
  const html = renderToStaticMarkup(
    h(FilterPanel, {
      children: h("input", { name: "q" }),
      disabled: true,
      busy: true,
      before: h("nav", null, "Views"),
      after: h("button", { type: "button" }, "Open filters"),
    }),
  );
  expect(html).toMatch(/<fieldset[^>]*disabled=""/);
  expect(html).toContain('aria-busy="true"');
  expect(html.indexOf("Views")).toBeLessThan(html.indexOf("<fieldset"));
  expect(html.indexOf("Open filters")).toBeGreaterThan(
    html.indexOf("</fieldset>"),
  );
});
