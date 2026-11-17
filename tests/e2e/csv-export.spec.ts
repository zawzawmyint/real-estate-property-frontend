import { signInDataToolsStaff } from "../fixtures/data-tools-staff";
import { createReviewedLead } from "../fixtures/create-lead";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { expect, test, type Download, type Page } from "@playwright/test";

test.setTimeout(180_000);

async function signIn(page: Page, role: "admin" | "manager" | "agent") {
  return signInDataToolsStaff(page, "csv-export", role);
}

// Read the downloaded format independently of the production CSV writer.
function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [],
    cell = "",
    quoted = false;
  text = text.replace(/^\uFEFF/, "");
  for (let index = 0; index < text.length; index++) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        cell += '"';
        index++;
      } else quoted = !quoted;
    } else if (!quoted && character === ",") {
      row.push(cell);
      cell = "";
    } else if (!quoted && character === "\n") {
      row.push(cell.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      cell = "";
    } else cell += character;
  }
  expect(quoted).toBe(false);
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

async function downloadedCsv(
  download: Download,
  entity: "leads" | "properties",
) {
  expect(download.suggestedFilename()).toMatch(
    new RegExp(`^${entity}-\\d{4}-\\d{2}-\\d{2}\\.csv$`),
  );
  const file = await download.path();
  expect(file).toBeTruthy();
  const bytes = await readFile(file!);
  expect([...bytes.subarray(0, 3)]).toEqual([239, 187, 191]);
  expect(bytes.length).toBeLessThanOrEqual(10_485_760);
  const text = bytes.toString("utf8");
  expect(text.endsWith("\r\n")).toBe(true);
  const rows = parseCsv(text);
  expect(rows.length).toBeGreaterThan(0);
  return rows as [string[], ...string[][]];
}

async function exportCsv(page: Page, entity: "leads" | "properties") {
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV", exact: true }).click();
  return downloadedCsv(await pending, entity);
}

test("all staff download all matching pages with role-scoped lead and owner access", async ({
  browser,
}, info) => {
  const origin = info.project.use.baseURL ?? "http://localhost:3100";
  const pages = await Promise.all([
    browser.newPage({ baseURL: origin }),
    browser.newPage({ baseURL: origin }),
    browser.newPage({ baseURL: origin }),
  ]);
  const [admin, manager, agent] = pages;
  if (info.project.name === "mobile")
    await Promise.all(
      pages.map((page) => page.setViewportSize({ width: 320, height: 740 })),
    );
  const prefix = `CSV ${randomUUID().slice(0, 12)}`;
  const headers = { Origin: origin };
  try {
    const [, , actor] = await Promise.all([
      signIn(admin, "admin"),
      signIn(manager, "manager"),
      signIn(agent, "agent"),
    ]);
    const leadIds: string[] = [],
      propertyIds: string[] = [];
    for (let index = 0; index < 25; index++) {
      const lead = await createReviewedLead(admin.request, {
        headers,
        data: {
          submissionId: randomUUID(),
          name: `${prefix} buyer ${index}`,
          phone: "+971 50 123 4567",
          purpose: "sale",
          source: "call",
          budgetFils: 12345,
          assignedAgentId: actor.id,
        },
      });
      expect(lead.status(), await lead.text()).toBe(201);
      leadIds.push((await lead.json()).id as string);
      const property = await admin.request.post("/api/v1/staff/properties", {
        headers,
        data: {
          title: `${prefix} home ${index}`,
          purpose: "sale",
          type: "apartment",
          priceFils: 23456,
          bedrooms: 0,
          bathrooms: 1,
          areaSqft: "100.50",
          ownerName: "CSV private owner",
          ownerPhone: "+971501234567",
        },
      });
      expect(property.status(), await property.text()).toBe(201);
      propertyIds.push((await property.json()).id as string);
    }
    const unassigned = await createReviewedLead(admin.request, {
      headers,
      data: {
        submissionId: randomUUID(),
        name: `${prefix} unassigned`,
        email: "fictional-csv@example.com",
        purpose: "sale",
        source: "call",
      },
    });
    expect(unassigned.status()).toBe(201);
    const unassignedId = (await unassigned.json()).id as string;
    for (const [index, page] of pages.entries()) {
      const leadQuery = new URLSearchParams({
        q: prefix,
        sort: "oldest",
        page: "2",
        ...(index === 2 ? {} : { view: "all" }),
      });
      await page.goto(`/crm/leads?${leadQuery}`);
      await expect(
        page.getByRole("button", { name: "Export CSV", exact: true }),
      ).toBeEnabled();
      const before = page.url();
      const [leadHeader, ...leads] = await exportCsv(page, "leads");
      expect(page.url()).toBe(before);
      expect(leadHeader).toContain("budget_aed");
      expect(leads.map((row) => row[0]).sort()).toEqual(
        (index === 2 ? leadIds : [...leadIds, unassignedId]).sort(),
      );
      const assigned = leads.find((row) => row[0] === leadIds[0])!;
      expect(assigned[leadHeader.indexOf("budget_aed")]).toBe("123.45");
      expect(assigned[leadHeader.indexOf("phone")]).toBe("'+971 50 123 4567");
      const firstPage = await page.request.get(
        `/api/v1/staff/leads?${new URLSearchParams({ q: prefix, sort: "oldest", ...(index === 2 ? {} : { view: "all" }) })}`,
      );
      const expectedFirst = (await firstPage.json()).items.map(
        (item: { id: string }) => item.id,
      );
      expect(leads.slice(0, expectedFirst.length).map((row) => row[0])).toEqual(
        expectedFirst,
      );

      await page.goto(
        `/crm/properties?${new URLSearchParams({ q: prefix, sort: "price_asc", page: "2" })}`,
      );
      const [propertyHeader, ...properties] = await exportCsv(
        page,
        "properties",
      );
      expect(properties.map((row) => row[0]).sort()).toEqual(
        propertyIds.sort(),
      );
      const firstProperty = properties[0]!;
      expect(firstProperty[propertyHeader.indexOf("price_aed")]).toBe("234.56");
      expect(firstProperty[propertyHeader.indexOf("bedrooms")]).toBe("0");
      expect(firstProperty[propertyHeader.indexOf("area_sqft")]).toBe("100.50");
      expect(propertyHeader.includes("owner_name")).toBe(index !== 2);
      expect(propertyHeader.includes("owner_phone")).toBe(index !== 2);
      if (index === 2)
        expect(properties.flat()).not.toContain("CSV private owner");
      else
        expect(firstProperty[propertyHeader.indexOf("owner_name")]).toBe(
          "CSV private owner",
        );
      // Applying already-applied filters must not leave export disabled.
      const apply = page.getByRole("button", { name: "Apply", exact: true });
      await apply.click();
      await expect(page).toHaveURL(/page=1/);
      await expect(
        page.getByRole("button", { name: "Export CSV", exact: true }),
      ).toBeEnabled();
      await apply.click();
      await expect(
        page.getByRole("button", { name: "Export CSV", exact: true }),
      ).toBeEnabled();
      await expect(apply).toBeEnabled();
      if (info.project.name === "mobile")
        await page.setViewportSize({ width: 320, height: 740 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: info.outputPath(`csv-${index}-properties.png`),
        fullPage: true,
      });
    }
  } finally {
    await Promise.all(pages.map((page) => page.close()));
  }
});

test("export errors retain filters, never download error bodies, and allow explicit retry", async ({
  page,
}, info) => {
  await signIn(page, "manager");
  const prefix = `CSV empty ${randomUUID()}`;
  await page.goto(
    `/crm/leads?${new URLSearchParams({ view: "all", q: prefix })}`,
  );
  const downloads: Download[] = [];
  page.on("download", (download) => downloads.push(download));
  const endpoint = "**/api/v1/staff/leads/export?**";
  for (const status of [401, 403, 422, 503]) {
    await page.route(endpoint, (route) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify({
          error: {
            code: status === 422 ? "EXPORT_LIMIT_EXCEEDED" : "TEST_ERROR",
            message: "Untrusted internal details",
          },
        }),
      }),
    );
    const before = page.url();
    await page.getByRole("button", { name: "Export CSV", exact: true }).click();
    await expect(
      page.locator('[data-slot="alert"][role="alert"]'),
    ).toBeVisible();
    if (status === 422)
      await expect(
        page.locator('[data-slot="alert"][role="alert"]'),
      ).toContainText(
        "Too many results to export. Narrow your filters and try again.",
      );
    await expect(
      page.locator('[data-slot="alert"][role="alert"]'),
    ).not.toContainText("Untrusted internal details");
    expect(page.url()).toBe(before);
    expect(downloads).toHaveLength(0);
    await page.unroute(endpoint);
  }
  await page.route(endpoint, (route) =>
    route.fulfill({
      status: 200,
      contentType: "text/html",
      body: "<h1>Sign in</h1>",
    }),
  );
  await page.getByRole("button", { name: "Export CSV", exact: true }).click();
  await expect(page.locator('[data-slot="alert"][role="alert"]')).toBeVisible();
  expect(downloads).toHaveLength(0);
  await page.unroute(endpoint);
  await page.route(endpoint, (route) => route.abort("failed"));
  await page.getByRole("button", { name: "Export CSV", exact: true }).click();
  await expect(page.locator('[data-slot="alert"][role="alert"]')).toBeVisible();
  expect(downloads).toHaveLength(0);
  await page.screenshot({
    path: info.outputPath("csv-download-error.png"),
    fullPage: true,
  });
  await page.unroute(endpoint);
  const rows = await exportCsv(page, "leads");
  expect(rows).toHaveLength(1);
  await expect(
    page.getByRole("status").filter({ hasText: "Download started." }),
  ).toHaveText("Download started.");
});

test("pending export blocks duplicate clicks and discards downloads after filter navigation", async ({
  page,
}, info) => {
  await signIn(page, "manager");
  const prefix = `CSV pending ${randomUUID()}`;
  await page.goto(
    `/crm/leads?${new URLSearchParams({ view: "all", q: prefix })}`,
  );
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  let requests = 0,
    downloads = 0;
  page.on("download", () => {
    downloads++;
  });
  await page.route("**/api/v1/staff/leads/export?**", async (route) => {
    requests++;
    await held;
    await route
      .fulfill({
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="leads-2026-11-11.csv"',
        },
        body: "\uFEFFlead_id,name,phone,email,purpose,budget_aed,source,stage,assigned_agent_id,assigned_agent_name,property_id,property_title,property_location,created_at_utc,updated_at_utc\r\n",
      })
      .catch(() => undefined);
  });
  try {
    const button = page.getByRole("button", {
      name: "Export CSV",
      exact: true,
    });
    await expect(button).toBeEnabled();
    await button.evaluate((element) => {
      (element as HTMLButtonElement).click();
      (element as HTMLButtonElement).click();
    });
    await expect.poll(() => requests).toBe(1);
    await expect(
      page.getByRole("button", { name: /Exporting/ }),
    ).toBeDisabled();
    await page.screenshot({
      path: info.outputPath("csv-download-pending.png"),
      fullPage: true,
    });
    const cancelled = page.waitForEvent("requestfailed", {
      timeout: 10_000,
      predicate: (request) =>
        new URL(request.url()).pathname === "/api/v1/staff/leads/export",
    });
    await page
      .getByRole("searchbox", { name: "Search leads", exact: true })
      .fill(`${prefix} changed`);
    await expect(page).toHaveURL(/changed/);
    release();
    await cancelled;
    await expect(
      page.getByRole("button", { name: "Export CSV", exact: true }),
    ).toBeEnabled();
    expect(downloads).toBe(0);
    expect(requests).toBe(1);
  } finally {
    release();
  }
});

test("equivalent property URLs preserve export through active-page and history navigation", async ({
  page,
}, info) => {
  await signIn(page, "manager");
  const title = `CSV canonical ${randomUUID()}`;
  const created = await page.request.post("/api/v1/staff/properties", {
    headers: { Origin: info.project.use.baseURL ?? "http://localhost:3100" },
    data: { title, purpose: "sale" },
  });
  expect(created.status()).toBe(201);
  await page.goto("/crm/properties");
  const button = page.getByRole("button", { name: "Export CSV", exact: true });
  await expect(button).toBeEnabled();
  await page.getByRole("link", { name: "Page 1", exact: true }).click();
  await expect(page).toHaveURL(/sort=updated_desc/);
  await expect(button).toBeEnabled();
  await page.goBack();
  await expect(page).toHaveURL(/\/crm\/properties$/);
  await expect(button).toBeEnabled();
  await page.goForward();
  await expect(page).toHaveURL(/sort=updated_desc/);
  await expect(button).toBeEnabled();
  const download = page.waitForEvent("download");
  await button.press("Enter");
  const [, ...rows] = await downloadedCsv(await download, "properties");
  expect(rows.length).toBeGreaterThan(0);

  await page.goto(
    `/crm/properties?sort=updated_desc&page=1&pageSize=12&q=${encodeURIComponent(title)}`,
  );
  await expect(button).toBeEnabled();
  await page.getByRole("link", { name: "Page 1", exact: true }).click();
  await expect(page).toHaveURL(/q=CSV\+canonical\+/);
  await expect(button).toBeEnabled();
  const propertyRows = await exportCsv(page, "properties");
  expect(propertyRows.some((row) => row.includes(title))).toBe(true);

  await page.goto("/crm/leads?view=all&q=Foo%20Bar&sort=newest&page=1");
  await expect(button).toBeEnabled();
  await page.getByRole("link", { name: "List", exact: true }).click();
  await expect(page).toHaveURL(/q=Foo\+Bar/);
  await expect(button).toBeEnabled();
  const leadRows = await exportCsv(page, "leads");
  expect(leadRows).toHaveLength(1);
});
