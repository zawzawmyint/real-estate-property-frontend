import { signInDataToolsStaff } from "../fixtures/data-tools-staff";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";
import { createReviewedLead } from "../fixtures/create-lead";

test.setTimeout(120_000);
const columns = ["name", "phone", "email", "purpose", "budget_aed", "source"];

function uniqueLabel(kind: string) {
  // Lead search also matches digits against phones; keep each name query isolated.
  const suffix = randomUUID()
    .replace(/\d/g, (digit) => String.fromCharCode(107 + Number(digit)))
    .slice(0, 12);
  return `Lead ${kind} ${suffix}`;
}

function csvFile(prefix: string, invalid = false) {
  const first = [
    `${prefix} first`,
    "0501234567",
    "",
    "SALE",
    "123456.78",
    "CALL",
  ];
  const rows = [
    first,
    [
      `${prefix} second`,
      "",
      "Fictional.Import@EXAMPLE.COM",
      "rent",
      "",
      "walk_in",
    ],
    invalid ? [`${prefix} last`, "", "", "sale", "1e3", "call"] : first,
  ];
  const cell = (value: string) => `"${value.replaceAll('"', '""')}"`;
  return {
    name: "leads.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      "\uFEFF" +
        [columns, ...rows].map((row) => row.map(cell).join(",")).join("\r\n") +
        "\r\n",
    ),
  };
}

async function signIn(page: Page, role: "admin" | "manager" | "agent") {
  return signInDataToolsStaff(page, "lead-import", role);
}

type Lead = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  purpose: string;
  budgetFils: number | null;
  stage: string;
  version: number;
  assignedAgent: unknown;
  property: unknown;
};

async function inventory(page: Page, prefix: string, view = "all") {
  const response = await page.request.get(
    `/api/v1/staff/leads?${new URLSearchParams({ view, q: prefix })}`,
  );
  expect(response.status()).toBe(200);
  return (await response.json()) as { total: number; items: Lead[] };
}

async function activity(page: Page, id: string) {
  const response = await page.request.get(`/api/v1/staff/leads/${id}/activity`);
  expect(response.status()).toBe(200);
  return (await response.json()) as {
    total: number;
    items: { type: string; actor: { id: string } | null }[];
  };
}

async function preview(page: Page, file: ReturnType<typeof csvFile>) {
  await page.getByLabel("CSV file", { exact: true }).setInputFiles(file);
  await page.getByRole("button", { name: "Preview CSV", exact: true }).click();
}

async function acknowledgeDuplicateWarnings(page: Page) {
  const acknowledgement = page.getByLabel(
    "I reviewed the duplicate phone warnings and want to import every valid row as a separate lead.",
    { exact: true },
  );
  await expect(acknowledgement).toBeVisible();
  await expect(acknowledgement).not.toBeChecked();
  await acknowledgement.check();
  await expect(acknowledgement).toBeChecked();
}

async function complete(page: Page) {
  await expect(
    page.getByRole("heading", { name: "Import complete", exact: true }),
  ).toBeVisible();
}

test("manager template and all-or-nothing import create New unassigned leads with history", async ({
  page,
}, info) => {
  const actor = await signIn(page, "manager");
  for (const width of info.project.name === "mobile" ? [390, 320] : [1532]) {
    await page.setViewportSize({ width, height: 806 });
    await page.goto("/crm/leads");
    await expect(
      page.getByRole("link", { name: "Import CSV", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Export CSV", exact: true }),
    ).toBeEnabled();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      animations: "disabled",
      path: info.outputPath(`lead-header-${width}.png`),
    });
  }
  await page.getByRole("link", { name: "Import CSV", exact: true }).click();
  await expect(page).toHaveURL(/\/crm\/leads\/import$/);
  const downloading = page.waitForEvent("download");
  await page.getByRole("link", { name: /template/i }).click();
  const template = await downloading;
  expect(template.suggestedFilename()).toBe("lead-import-template.csv");
  expect(
    (await readFile((await template.path())!, "utf8"))
      .replace(/^\uFEFF/, "")
      .trim(),
  ).toBe(columns.join(","));

  const bad = uniqueLabel("invalid");
  await preview(page, csvFile(bad, true));
  await expect(page.getByText(/Fix every invalid row/i)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Import 3 leads", exact: true }),
  ).toHaveCount(0);
  expect((await inventory(page, bad)).total).toBe(0);
  await page.screenshot({
    animations: "disabled",
    path: info.outputPath("lead-import-invalid.png"),
    fullPage: true,
  });

  const prefix = uniqueLabel("valid");
  const file = csvFile(prefix);
  await preview(page, file);
  const confirm = page.getByRole("button", {
    name: "Import 3 leads",
    exact: true,
  });
  await expect(
    page.getByText("Possible duplicate phone numbers"),
  ).toBeVisible();
  await expect(confirm).toBeDisabled();
  await acknowledgeDuplicateWarnings(page);
  await expect(confirm).toBeEnabled();
  await page
    .getByLabel("CSV file", { exact: true })
    .setInputFiles(csvFile(`${prefix} changed`));
  await expect(confirm).toHaveCount(0);
  await preview(page, file);
  await expect(confirm).toBeDisabled();
  await acknowledgeDuplicateWarnings(page);
  await expect(confirm).toBeEnabled();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    animations: "disabled",
    path: info.outputPath("lead-import-preview.png"),
    fullPage: true,
  });
  await confirm.press("Enter");
  await complete(page);
  const imported = await inventory(page, prefix);
  expect(imported.total).toBe(3);
  for (const lead of imported.items) {
    expect(lead.stage).toBe("new");
    expect(lead.assignedAgent).toBeNull();
    expect(lead.property).toBeNull();
    expect(lead.version).toBe(1);
    const history = await activity(page, lead.id);
    expect(history.items).toHaveLength(1);
    expect(history.items[0]).toMatchObject({
      type: "created",
      actor: { id: actor.id },
    });
  }
  const repeated = imported.items.filter((lead) => lead.name.endsWith("first"));
  expect(repeated).toHaveLength(2);
  expect(repeated[0]!.phone).toBe("0501234567");
  expect(repeated[0]!.budgetFils).toBe(12_345_678);
  const second = imported.items.find((lead) => lead.name.endsWith("second"))!;
  expect(second.email).toBe("fictional.import@example.com");
  expect(second.phone).toBeNull();
  expect(second.budgetFils).toBeNull();
  await page.screenshot({
    animations: "disabled",
    path: info.outputPath("lead-import-complete.png"),
    fullPage: true,
  });
  await page.locator('a[href="/crm/leads?view=unassigned&stage=new"]').click();
  await expect(page).toHaveURL(/view=unassigned/);
  await page.goto(`/crm/leads/${second.id}`);
  await expect(
    page.getByRole("heading", { name: second.name, exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Manual lead created", { exact: true }),
  ).toBeVisible();
});

test("stale duplicate confirmation re-previews, then a lost retry response preserves replay identity", async ({
  page,
}, info) => {
  await signIn(page, "manager");
  await page.goto("/crm/leads/import");
  const prefix = uniqueLabel("retry");
  const file = csvFile(prefix);
  await preview(page, file);
  await acknowledgeDuplicateWarnings(page);
  const staleMatch = await createReviewedLead(page.request, {
    headers: { Origin: info.project.use.baseURL ?? "http://localhost:3100" },
    data: {
      submissionId: randomUUID(),
      name: uniqueLabel("stale match"),
      phone: "0501234567",
      purpose: "sale",
      source: "call",
    },
  });
  expect(staleMatch.status(), await staleMatch.text()).toBe(201);
  await page
    .getByRole("button", { name: "Import 3 leads", exact: true })
    .click();
  await expect(
    page.getByText(/Matching phone numbers changed\. Preview the same file/),
  ).toBeVisible();
  expect((await inventory(page, prefix)).total).toBe(0);
  await preview(page, file);
  await acknowledgeDuplicateWarnings(page);
  let dropped = false;
  await page.route("**/crm/leads/import", async (route) => {
    if (
      !dropped &&
      route.request().method() === "POST" &&
      route.request().headers()["next-action"]
    ) {
      dropped = true;
      const delivered = await route.fetch();
      await delivered.body();
      await route.abort("failed");
    } else await route.continue();
  });
  await page
    .getByRole("button", { name: "Import 3 leads", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Retry confirmation", exact: true }),
  ).toBeVisible();
  const before = await inventory(page, prefix);
  expect(before.total).toBe(3);
  const changed = before.items[0]!;
  const response = await page.request.patch(
    `/api/v1/staff/leads/${changed.id}/stage`,
    {
      headers: { Origin: info.project.use.baseURL ?? "http://localhost:3100" },
      data: { expectedVersion: changed.version, stage: "contacted" },
    },
  );
  expect(response.status()).toBe(200);
  await page.screenshot({
    animations: "disabled",
    path: info.outputPath("lead-import-uncertain.png"),
    fullPage: true,
  });
  await page.unroute("**/crm/leads/import");
  await page.reload();
  await preview(page, file);
  await acknowledgeDuplicateWarnings(page);
  await page
    .getByRole("button", { name: "Retry confirmation", exact: true })
    .click();
  await complete(page);
  const after = await inventory(page, prefix);
  expect(after.items.map((lead) => lead.id).sort()).toEqual(
    before.items.map((lead) => lead.id).sort(),
  );
  expect(after.items.find((lead) => lead.id === changed.id)).toMatchObject({
    stage: "contacted",
    version: 2,
  });
  for (const lead of after.items)
    expect(
      (await activity(page, lead.id)).items.filter(
        (entry) => entry.type === "created",
      ),
    ).toHaveLength(1);
});

test("Agent retains manual/export access but cannot import; Admin imports into the unassigned inbox", async ({
  page,
}, info) => {
  await signIn(page, "agent");
  await page.goto("/crm/leads");
  await expect(
    page.getByRole("button", { name: "Export CSV", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByRole("link", { name: "New lead", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Import CSV", exact: true }),
  ).toHaveCount(0);
  const origin = info.project.use.baseURL ?? "http://localhost:3100";
  expect(
    (await page.request.get("/api/v1/staff/leads/imports/template")).status(),
  ).toBe(403);
  expect(
    (
      await page.request.post("/api/v1/staff/leads/imports/preview", {
        headers: { Origin: origin },
        data: {
          csv: "name,phone,purpose,source\r\nDenied,0501234567,sale,call\r\n",
        },
      })
    ).status(),
  ).toBe(403);
  await page.goto("/crm/leads/import");
  await expect(page.getByLabel("CSV file", { exact: true })).toHaveCount(0);
  await page.context().clearCookies();
  await signIn(page, "admin");
  const prefix = uniqueLabel("admin");
  await page.goto("/crm/leads/import");
  await preview(page, csvFile(prefix));
  await acknowledgeDuplicateWarnings(page);
  await page
    .getByRole("button", { name: "Import 3 leads", exact: true })
    .click();
  await complete(page);
  expect((await inventory(page, prefix, "unassigned")).total).toBe(3);
  await page.context().clearCookies();
  await signIn(page, "agent");
  expect((await inventory(page, prefix, "mine")).total).toBe(0);
});

test("file diagnostics and actor binding protect confirmation; lead recovery does not overwrite property recovery", async ({
  page,
}) => {
  const actor = await signIn(page, "manager");
  const propertyKey = `agency:csv-import:properties:${encodeURIComponent(actor.id)}`;
  const propertyPending = {
    submissionId: randomUUID(),
    digest: "a".repeat(64),
    schemaVersion: 1,
  };
  await page.goto("/crm/leads/import");
  await page.evaluate(
    ({ key, value }) => sessionStorage.setItem(key, JSON.stringify(value)),
    { key: propertyKey, value: propertyPending },
  );
  await page.getByLabel("CSV file", { exact: true }).setInputFiles({
    name: "invalid.csv",
    mimeType: "text/csv",
    buffer: Buffer.from([255]),
  });
  await page.getByRole("button", { name: "Preview CSV", exact: true }).click();
  await expect(page.locator("#csv-file-error")).toHaveText(
    "Choose a valid UTF-8 CSV file.",
  );
  await expect(page.getByLabel("CSV file", { exact: true })).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  const prefix = uniqueLabel("actor");
  const file = csvFile(prefix);
  await preview(page, file);
  await acknowledgeDuplicateWarnings(page);
  await expect(
    page.getByRole("button", { name: "Import 3 leads", exact: true }),
  ).toBeEnabled();
  await page.context().clearCookies();
  await signIn(page, "admin");
  await page
    .getByRole("button", { name: "Import 3 leads", exact: true })
    .click();
  await expect(page.getByText(/staff session changed/i)).toBeVisible();
  expect((await inventory(page, prefix)).total).toBe(0);
  expect(
    await page.evaluate(
      (key) => JSON.parse(sessionStorage.getItem(key)!),
      propertyKey,
    ),
  ).toEqual(propertyPending);
  await page.reload();
  await preview(page, file);
  await acknowledgeDuplicateWarnings(page);
  await page
    .getByRole("button", { name: "Import 3 leads", exact: true })
    .dblclick();
  await complete(page);
  expect((await inventory(page, prefix)).total).toBe(3);
  expect(
    await page.evaluate(
      (key) => JSON.parse(sessionStorage.getItem(key)!),
      propertyKey,
    ),
  ).toEqual(propertyPending);
});

test("blocked recovery storage requires acknowledgement and retains safe in-memory retries", async ({
  page,
}) => {
  await signIn(page, "manager");
  await page.addInitScript(() => {
    const get = Storage.prototype.getItem;
    const set = Storage.prototype.setItem;
    const remove = Storage.prototype.removeItem;
    const blocked = (key: string) => {
      if (key.startsWith("agency:csv-import:leads:"))
        throw new DOMException("Blocked", "SecurityError");
    };
    Storage.prototype.getItem = function (key) {
      blocked(key);
      return get.call(this, key);
    };
    Storage.prototype.setItem = function (key, value) {
      blocked(key);
      return set.call(this, key, value);
    };
    Storage.prototype.removeItem = function (key) {
      blocked(key);
      return remove.call(this, key);
    };
  });
  await page.goto("/crm/leads/import");
  await expect(page.getByText(/Reload recovery is unavailable/i)).toBeVisible();
  const prefix = uniqueLabel("storage");
  await preview(page, csvFile(prefix));
  await acknowledgeDuplicateWarnings(page);
  await page
    .getByRole("button", { name: "Import 3 leads", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("heading", { name: "Start another import?", exact: true }),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  expect((await inventory(page, prefix)).total).toBe(0);
  let dropped = false;
  await page.route("**/crm/leads/import", async (route) => {
    if (
      !dropped &&
      route.request().method() === "POST" &&
      route.request().headers()["next-action"]
    ) {
      dropped = true;
      const delivered = await route.fetch();
      await delivered.body();
      await route.abort("failed");
    } else await route.continue();
  });
  await page
    .getByRole("button", { name: "Import 3 leads", exact: true })
    .click();
  await dialog
    .getByRole("button", { name: "I understand, start new batch", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Retry confirmation", exact: true }),
  ).toBeVisible();
  const before = await inventory(page, prefix);
  expect(before.total).toBe(3);
  await page.unroute("**/crm/leads/import");
  await page
    .getByRole("button", { name: "Retry confirmation", exact: true })
    .click();
  await complete(page);
  const after = await inventory(page, prefix);
  expect(after.items.map((lead) => lead.id).sort()).toEqual(
    before.items.map((lead) => lead.id).sort(),
  );
});
