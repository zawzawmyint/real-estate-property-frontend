import { signInDataToolsStaff } from "../fixtures/data-tools-staff";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";

test.setTimeout(120_000);
const headers = [
  "title",
  "purpose",
  "type",
  "description",
  "price_aed",
  "city",
  "community",
  "bedrooms",
  "bathrooms",
  "area_sqft",
  "owner_name",
  "owner_phone",
];

function csvFile(prefix: string, invalid = false) {
  const rows = [
    [
      `${prefix} first`,
      "sale",
      "apartment",
      "First line\nSecond line",
      "123456.78",
      "Dubai",
      "Marina",
      "0",
      "1",
      "100.50",
      "Fictional, owner",
      "+971501234567",
    ],
    [
      `${prefix} second`,
      "rent",
      "villa",
      "",
      invalid ? "not-a-price" : "90000.00",
      "Dubai",
      "Hills",
      "3",
      "2",
      "1500.00",
      "Fictional owner",
      "0501234567",
    ],
  ];
  const cell = (value: string) => `"${value.replaceAll('"', '""')}"`;
  return {
    name: "properties.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      "\uFEFF" +
        [headers, ...rows].map((row) => row.map(cell).join(",")).join("\r\n") +
        "\r\n",
    ),
  };
}

async function signIn(page: Page, role: "admin" | "manager" | "agent") {
  return signInDataToolsStaff(page, "property-import", role);
}

async function inventory(page: Page, prefix: string) {
  const response = await page.request.get(
    `/api/v1/staff/properties?${new URLSearchParams({ q: prefix, pageSize: "48" })}`,
  );
  expect(response.status()).toBe(200);
  return (await response.json()) as {
    total: number;
    items: {
      id: string;
      title: string;
      publishingState: string;
      availability: string;
      featured: boolean;
      isDemo: boolean;
      priceFils: number;
      bedrooms: number;
    }[];
  };
}

async function preview(page: Page, file: ReturnType<typeof csvFile>) {
  await page.getByLabel("CSV file", { exact: true }).setInputFiles(file);
  await page.getByRole("button", { name: "Preview CSV", exact: true }).click();
}

test("manager template, whole-batch rejection, changed-file preview and draft creation", async ({
  page,
}, info) => {
  await signIn(page, "manager");
  await page.setViewportSize({
    width: info.project.name === "mobile" ? 320 : 1532,
    height: 806,
  });
  await page.goto("/crm/properties");
  await page.getByRole("link", { name: "Import CSV", exact: true }).click();
  await expect(page).toHaveURL(/\/crm\/properties\/import$/);
  const download = page.waitForEvent("download");
  await page.getByRole("link", { name: /template/i }).click();
  const template = await download;
  expect(template.suggestedFilename()).toBe("property-import-template.csv");
  const file = await template.path();
  expect((await readFile(file!, "utf8")).replace(/^\uFEFF/, "").trim()).toBe(
    headers.join(","),
  );

  const bad = `Import bad ${randomUUID().slice(0, 10)}`;
  await preview(page, csvFile(bad, true));
  await expect(
    page.getByRole("button", { name: "Preview CSV", exact: true }),
  ).toBeEnabled();
  const invalidConfirm = page.getByRole("button", {
    name: /^Import \d+ drafts?$/,
  });
  if (await invalidConfirm.count()) await expect(invalidConfirm).toBeDisabled();
  expect((await inventory(page, bad)).total).toBe(0);
  await page.screenshot({
    path: info.outputPath("import-invalid.png"),
    fullPage: true,
  });

  const good = `Import good ${randomUUID().slice(0, 10)}`;
  const selected = csvFile(good);
  await preview(page, selected);
  const confirm = page.getByRole("button", {
    name: "Import 2 drafts",
    exact: true,
  });
  await expect(confirm).toBeEnabled();
  await page
    .getByLabel("CSV file", { exact: true })
    .setInputFiles(csvFile(`${good} changed`));
  if (await confirm.count()) await expect(confirm).toBeDisabled();
  await preview(page, selected);
  await expect(confirm).toBeEnabled();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: info.outputPath("import-preview.png"),
    fullPage: true,
  });
  await confirm.press("Enter");
  await expect(
    page.getByRole("heading", { name: "Import complete", exact: true }),
  ).toBeVisible();
  const result = await inventory(page, good);
  expect(result.total).toBe(2);
  for (const property of result.items) {
    expect(property.publishingState).toBe("draft");
    expect(property.availability).toBe("available");
    expect(property.featured).toBe(false);
    expect(property.isDemo).toBe(false);
  }
  const first = result.items.find((property) =>
    property.title.endsWith("first"),
  )!;
  expect(first.priceFils).toBe(12_345_678);
  expect(first.bedrooms).toBe(0);
  await page.screenshot({
    path: info.outputPath("import-complete.png"),
    fullPage: true,
  });
});

test("lost confirmation response survives reload and same-file retry without another batch", async ({
  page,
}, info) => {
  await signIn(page, "manager");
  await page.goto("/crm/properties/import");
  const prefix = `Import retry ${randomUUID().slice(0, 10)}`;
  const file = csvFile(prefix);
  await preview(page, file);
  await expect(
    page.getByRole("button", { name: "Import 2 drafts", exact: true }),
  ).toBeEnabled();
  let dropped = false;
  await page.route("**/crm/properties/import", async (route) => {
    const request = route.request();
    if (
      !dropped &&
      request.method() === "POST" &&
      request.headers()["next-action"]
    ) {
      dropped = true;
      const delivered = await route.fetch();
      await delivered.body();
      await route.abort("failed");
    } else await route.continue();
  });
  await page
    .getByRole("button", { name: "Import 2 drafts", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Retry confirmation", exact: true }),
  ).toBeVisible();
  expect(dropped).toBe(true);
  const before = await inventory(page, prefix);
  expect(before.total).toBe(2);
  await page.screenshot({
    path: info.outputPath("import-uncertain.png"),
    fullPage: true,
  });
  await page.unroute("**/crm/properties/import");
  await page.reload();
  await preview(page, file);
  await page
    .getByRole("button", { name: /^(Retry confirmation|Import 2 drafts)$/ })
    .click();
  await expect(
    page.getByRole("heading", { name: "Import complete", exact: true }),
  ).toBeVisible();
  const after = await inventory(page, prefix);
  expect(after.total).toBe(2);
  expect(after.items.map((property) => property.id).sort()).toEqual(
    before.items.map((property) => property.id).sort(),
  );
});

test("Agent import access is denied and Admin can confirm a new draft batch", async ({
  page,
}) => {
  await signIn(page, "agent");
  await page.goto("/crm/properties");
  await expect(
    page.getByRole("button", { name: "Export CSV", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByRole("link", { name: "Import CSV", exact: true }),
  ).toHaveCount(0);
  const origin = test.info().project.use.baseURL ?? "http://localhost:3100";
  const denied = await page.request.post(
    "/api/v1/staff/properties/imports/preview",
    {
      headers: { Origin: origin },
      data: { csv: "title,purpose\r\nDenied,sale\r\n" },
    },
  );
  expect(denied.status()).toBe(403);
  await page.goto("/crm/properties/import");
  await expect(page.getByLabel("CSV file", { exact: true })).toHaveCount(0);
  await page.context().clearCookies();
  await signIn(page, "admin");
  await page.goto("/crm/properties/import");
  const prefix = `Import admin ${randomUUID().slice(0, 10)}`;
  await preview(page, csvFile(prefix));
  await page
    .getByRole("button", { name: "Import 2 drafts", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Import complete", exact: true }),
  ).toBeVisible();
  expect((await inventory(page, prefix)).total).toBe(2);
});

test("invalid file errors are associated and a stale actor tab cannot confirm", async ({
  page,
}) => {
  await signIn(page, "manager");
  await page.goto("/crm/properties/import");
  await page.getByLabel("CSV file", { exact: true }).setInputFiles({
    name: "invalid.csv",
    mimeType: "text/csv",
    buffer: Buffer.from([0xff, 0xfe]),
  });
  await page.getByRole("button", { name: "Preview CSV", exact: true }).click();
  await expect(page.locator("#csv-file-error")).toBeVisible();
  await expect(page.getByLabel("CSV file", { exact: true })).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  const prefix = `Import actor ${randomUUID().slice(0, 10)}`;
  await preview(page, csvFile(prefix));
  await expect(
    page.getByRole("button", { name: "Import 2 drafts", exact: true }),
  ).toBeEnabled();
  await page.context().clearCookies();
  await signIn(page, "admin");
  await page
    .getByRole("button", { name: "Import 2 drafts", exact: true })
    .click();
  await expect(page.getByText(/staff session changed/i)).toBeVisible();
  expect((await inventory(page, prefix)).total).toBe(0);
  await page.reload();
  await preview(page, csvFile(prefix));
  await page
    .getByRole("button", { name: "Import 2 drafts", exact: true })
    .dblclick();
  await expect(
    page.getByRole("heading", { name: "Import complete", exact: true }),
  ).toBeVisible();
  expect((await inventory(page, prefix)).total).toBe(2);
});
