import { createElement as h } from "react";
import { expect, it } from "vitest";
import { renderToStaticMarkup as render } from "react-dom/server";
import { DataTable, type DataColumn } from "@/components/crm/data-table";
import { CollectionPagination } from "@/components/crm/collection-pagination";
import { TextField, SelectField } from "@/components/forms/fields";

it("renders ordered custom columns and mobile cards from typed rows", () => {
  type Row = { id: string; name: string };
  const columns: DataColumn<Row>[] = [
    { id: "name", header: "Name", cell: (row) => h("strong", null, row.name) },
    {
      id: "action",
      header: "Action",
      cell: (row) => h("a", { href: `/${row.id}` }, "Open"),
    },
  ];
  const html = render(
    h(DataTable<Row>, {
      rows: [{ id: "one", name: "Alice" }],
      columns,
      label: "Contacts",
      getRowKey: (row) => row.id,
      empty: "Empty",
      renderMobile: (row) => h("article", null, row.name),
    }),
  );
  expect(html).toContain('aria-label="Contacts"');
  expect(html.indexOf(">Name<")).toBeLessThan(html.indexOf(">Action<"));
  expect(html).toContain("<strong>Alice</strong>");
  expect(html).toContain("<article>Alice</article>");
  expect(html).not.toContain(">Empty<");
});
it("renders empty content without table", () => {
  const html = render(
    h(DataTable, {
      rows: [],
      columns: [],
      getRowKey: () => "",
      label: "Contacts",
      empty: h("p", null, "No contacts"),
    }),
  );
  expect(html).toContain("No contacts");
  expect(html).not.toContain("<table");
});
it("preserves pagination boundaries and optional page totals", () => {
  const first = render(
    h(CollectionPagination, {
      page: 1,
      pageSize: 20,
      total: 21,
      href: (page) => `?page=${page}`,
      showTotal: true,
    }),
  );
  expect(first).not.toContain("Previous");
  expect(first).toContain("?page=2");
  expect(first).toContain("Page 1 of 2");
  const last = render(
    h(CollectionPagination, {
      page: 2,
      pageSize: 20,
      total: 21,
      href: (page) => `?page=${page}`,
    }),
  );
  expect(last).toContain("?page=1");
  expect(last).not.toContain("Next");
  expect(
    render(
      h(CollectionPagination, {
        page: 1,
        pageSize: 20,
        total: 0,
        href: () => "",
      }),
    ),
  ).toBe("");
});
it("associates labels, help, errors and external descriptions, retaining native props", () => {
  const html = render(
    h(TextField, {
      id: "name",
      label: "Name",
      name: "name",
      defaultValue: "Alice",
      help: "Legal name",
      error: "Required",
      "aria-describedby": "external",
      maxLength: 120,
      readOnly: true,
    }),
  );
  expect(html).toContain('for="name"');
  expect(html).toContain('aria-describedby="external name-help name-error"');
  expect(html).toContain('aria-invalid="true"');
  expect(html).toContain('id="name-help"');
  expect(html).toContain('id="name-error"');
  expect(html).toContain('maxLength="120"');
  expect(html).toContain('value="Alice"');
  const select = render(
    h(
      SelectField,
      { id: "purpose", label: "Purpose", defaultValue: "rent", disabled: true },
      h("option", { value: "rent" }, "Rent"),
    ),
  );
  expect(select).toContain('for="purpose"');
  expect(select).toContain('selected=""');
  expect(select).toContain('disabled=""');
});
