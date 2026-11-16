import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";

const session = vi.hoisted(() => vi.fn());
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/server", () => ({ requireStaffSession: session }));
import LeadImportPage from "@/app/(staff)/crm/leads/import/page";
import { CreateLeadAction } from "@/features/leads/crm/lead-inventory";

beforeEach(() => session.mockResolvedValue({ id: "manager", role: "manager" }));
it.each(["admin", "manager"])(
  "renders the %s importer using the lead template and file input",
  async (role) => {
    session.mockResolvedValue({ id: role, role });
    const html = renderToStaticMarkup(await LeadImportPage());
    expect(html).toContain('href="/api/v1/staff/leads/imports/template"');
    expect(html).toContain('id="csv-file"');
    expect(html).toContain("Import leads");
    expect(html).toContain("New and unassigned");
  },
);
it("denies Agents without rendering private import controls", async () => {
  session.mockResolvedValue({ id: "agent", role: "agent" });
  const html = renderToStaticMarkup(await LeadImportPage());
  expect(html).toContain("You do not have permission to import leads.");
  expect(html).not.toContain('id="csv-file"');
  expect(html).not.toContain("imports/template");
});
it.each(["admin", "manager", "agent"])(
  "keeps %s header actions scoped to the list",
  async (role) => {
    session.mockResolvedValue({ id: role, role });
    const list = renderToStaticMarkup(await CreateLeadAction({ query: "" }));
    expect(list).toContain('href="/crm/leads/new"');
    expect(list).toContain("Export CSV");
    expect(list.includes('href="/crm/leads/import"')).toBe(role !== "agent");
    const pipeline = renderToStaticMarkup(await CreateLeadAction());
    expect(pipeline).not.toContain('href="/crm/leads/import"');
  },
);
