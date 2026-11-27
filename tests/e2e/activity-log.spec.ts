import { writeFile } from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import { chromium, expect, test, type Page } from "@playwright/test";
import { signInDataToolsStaff } from "../fixtures/data-tools-staff";

test.skip(
  process.env.STAFF_E2E_DASHBOARD_ONLY === "1",
  "Uses the standard disposable staff fixture.",
);
test.setTimeout(120_000);
const path = "/crm/activity-log";
const propertyPath = "/api/v1/staff/properties";
const options = (data?: object) => ({
  headers: { Origin: "http://localhost:3100" },
  data,
});
const signIn = (page: Page, role: "manager" | "admin" | "agent") =>
  signInDataToolsStaff(page, "activity-log", role);
const range = () =>
  new URLSearchParams({
    from: new Date(Date.now() - 3600000).toISOString(),
    to: new Date(Date.now() + 3600000).toISOString(),
  });

test("admin and manager investigate an Admin write, redaction, retained deletion and live access loss", async ({
  page,
}) => {
  const admin = await signIn(page, "admin");
  const title = "Audit browser " + randomUUID();
  const ownerName = "Confidential " + randomUUID();
  const response = await page.request.post(
    propertyPath,
    options({
      title,
      purpose: "sale",
      ownerName,
      priceFils: 123456789,
      areaSqft: "1186.25",
      city: "2025-12-01T00:00:00Z",
    }),
  );
  expect(response.status()).toBe(201);
  const { id } = await response.json();
  const query = range();
  query.set("entityType", "property");
  query.set("entityId", id);
  await page.goto(path + "?" + query);
  await expect(page.getByRole("link", { name: title })).toBeVisible();
  await signIn(page, "manager");
  await page.goto(path + "?" + query);
  await expect(page.getByText(/Changes recorded from/)).toBeVisible();
  await page.getByLabel("Search historical actors").fill(admin.name);
  const picker = page.getByLabel("Historical staff actor");
  await expect(picker.locator("option", { hasText: admin.name })).toHaveCount(
    1,
  );
  await picker.selectOption(admin.id);
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page).toHaveURL(new RegExp("actorId=" + admin.id));
  await page.getByRole("button", { name: "Show changes" }).click();
  await expect(
    page.getByText(/After: AED 1,234,567.89/).filter({ visible: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Value hidden", { exact: true }).filter({ visible: true }),
  ).toBeVisible();
  await expect(
    page.getByText(/After: 1,186.25 sqft/).filter({ visible: true }),
  ).toBeVisible();
  await expect(
    page.getByText(/After: 2025-12-01T00:00:00Z/).filter({ visible: true }),
  ).toBeVisible();
  expect(await page.locator("body").innerText()).not.toContain(ownerName);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await signIn(page, "admin");
  expect(
    (
      await page.request.patch(
        propertyPath + "/" + id,
        options({ publishingState: "archived" }),
      )
    ).status(),
  ).toBe(200);
  expect(
    (await page.request.delete(propertyPath + "/" + id, options())).status(),
  ).toBe(204);
  await signIn(page, "manager");
  await page.goto(path + "?" + query);
  await expect(
    page
      .getByText("Record unavailable", { exact: true })
      .filter({ visible: true }),
  ).toHaveCount(3);
  await expect(page.getByRole("link", { name: title })).toHaveCount(0);
  query.set("pageSize", "1");
  await page.goto(path + "?" + query);
  const next = page.getByRole("link", { name: "Go to next page" });
  await next.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/page=2/);
  await expect(page.getByText("Showing 2–2 of 3")).toBeVisible();
  const refresh = page.getByRole("button", { name: "Refresh", exact: true });
  await refresh.click();
  await expect(page.getByText("Showing 2–2 of 3")).toBeVisible();
  await page.getByLabel("Record ID").fill(randomUUID());
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(
    page.getByText("No recorded changes match these filters."),
  ).toBeVisible();
  await expect(page.getByText(/Changes recorded from/)).toBeVisible();
  await page.goto(path + "?entityId=invalid");
  await expect(page.getByRole("link", { name: "Reset filters" })).toBeVisible();
  await page.getByRole("link", { name: "Reset filters" }).click();
  await expect(
    page.getByRole("region", { name: "Recorded activity" }),
  ).toBeVisible();
  expect(
    (await page.request.post("/api/v1/auth/sign-out", options({}))).status(),
  ).toBe(200);
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(
    page.getByRole("region", { name: "Recorded activity" }),
  ).toHaveCount(0);
  await expect(page).toHaveURL(/\/login/);
});

test("import summaries link to all created records in the same batch", async ({
  page,
}) => {
  await signIn(page, "manager");
  const submissionId = randomUUID();
  const titles = ["Import A " + submissionId, "Import B " + submissionId];
  const csv =
    "title,purpose\n" + titles.map((title) => title + ",sale").join("\n");
  const imports = propertyPath + "/imports/";
  const preview = await page.request.post(
    imports + "preview",
    options({ csv }),
  );
  expect(preview.status()).toBe(200);
  const committed = await page.request.post(
    imports + "commit",
    options({
      csv,
      submissionId,
      schemaVersion: 1,
      digest: (await preview.json()).digest,
    }),
  );
  expect(committed.status()).toBe(201);
  const { propertyIds } = await committed.json();
  const query = range();
  query.set("entityType", "property");
  query.set("entityId", propertyIds[0]);
  await page.goto(path + "?" + query);
  await page.getByRole("link", { name: "View import activity" }).click();
  await expect(page).toHaveURL(/importId=/);
  for (const title of titles)
    await expect(page.getByRole("link", { name: title })).toBeVisible();
  await expect(
    page
      .getByText("2 records created", { exact: true })
      .filter({ visible: true }),
  ).toBeVisible();
});

test("agent cannot read activity log or historical staff but can open own lead timeline", async ({
  page,
}) => {
  await signIn(page, "agent");
  const lead = await page.request.post(
    "/api/v1/staff/leads",
    options({
      submissionId: randomUUID(),
      name: "Timeline " + randomUUID(),
      email: randomUUID() + "@example.test",
      purpose: "sale",
      source: "walk_in",
    }),
  );
  expect(lead.status()).toBe(201);
  const { id } = await lead.json();
  const timeline = await page.request.get(`/api/v1/staff/leads/${id}/activity`);
  expect(timeline.status()).toBe(200);
  expect((await timeline.json()).total).toBe(1);
  for (const endpoint of [
    "/api/v1/staff/audit-log?" + range(),
    "/api/v1/staff/audit-log/actors",
  ])
    expect((await page.request.get(endpoint)).status()).toBe(403);
  await page.goto(path);
  await expect(page.getByText(/Access denied/i).first()).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Recorded activity" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Activity log", exact: true }),
  ).toHaveCount(0);
});

test("activity log reflows at narrow widths and native 200 percent zoom", async ({
  page,
  baseURL,
}, info) => {
  test.skip(info.project.name !== "desktop", "One native desktop sweep.");
  const manager = await signIn(page, "manager");
  const result = await page.request.post(
    propertyPath,
    options({
      title: "Responsive property " + randomUUID(),
      purpose: "sale",
      priceFils: 123456789,
      areaSqft: "1186.25",
      city: "2025-12-01T00:00:00Z",
      ownerName: "Confidential fixture owner",
    }),
  );
  expect(result.status()).toBe(201);
  const query = range();
  query.set("entityType", "property");
  query.set("entityId", (await result.json()).id);
  const url = path + "?" + query;
  await page.goto(url);
  await expect(
    page
      .getByLabel("Historical staff actor")
      .locator("option", { hasText: manager.name }),
  ).toHaveCount(1);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 960 });
    await expect(
      page.getByRole("button", { name: "Show changes" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (width === 1440) {
      await page.getByRole("button", { name: "Show changes" }).click();
      await expect(
        page.getByText(/After: 1,186.25 sqft/).filter({ visible: true }),
      ).toBeVisible();
    }
    await page.screenshot({
      path: info.outputPath("activity-" + width + ".png"),
      fullPage: true,
    });
  }
  const executablePath = process.env.PUBLIC_BROWSER_EXECUTABLE;
  const context = await chromium.launchPersistentContext("", {
    ...(executablePath ? { executablePath } : { channel: "chromium" }),
    baseURL,
    headless: true,
    viewport: null,
    deviceScaleFactor: undefined,
    isMobile: undefined,
    args: ["--window-size=1280,1000"],
  });
  try {
    await context.addCookies(await page.context().cookies());
    const zoomPage = await context.newPage();
    await zoomPage.goto(url);
    const baseline = await zoomPage.evaluate(() => ({
      width: innerWidth,
      ratio: devicePixelRatio,
    }));
    const settings = await context.newPage();
    await settings.goto("chrome://settings/appearance");
    await settings.locator("#zoomLevel").selectOption("2");
    await settings.close();
    await zoomPage.reload();
    await expect
      .poll(() => zoomPage.evaluate(() => devicePixelRatio))
      .toBe(baseline.ratio * 2);
    expect(await zoomPage.evaluate(() => innerWidth)).toBeLessThanOrEqual(
      Math.ceil(baseline.width / 2),
    );
    await zoomPage.getByRole("button", { name: "Show changes" }).click();
    expect(
      await zoomPage.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const cdp = await context.newCDPSession(zoomPage);
    const screenshot = await cdp.send("Page.captureScreenshot", {
      format: "png",
    });
    await writeFile(
      info.outputPath("activity-native-200.png"),
      Buffer.from(screenshot.data, "base64"),
    );
  } finally {
    await context.close();
  }
});

test("a failed log read keeps filters through retry and a protected 403 clears results and actors", async ({
  page,
}) => {
  const manager = await signIn(page, "manager");
  const title = "Recoverable read " + randomUUID();
  const created = await page.request.post(
    propertyPath,
    options({ title, purpose: "rent" }),
  );
  expect(created.status()).toBe(201);
  const { id } = await created.json();
  const query = range();
  query.set("entityType", "property");
  query.set("entityId", id);
  const url = path + "?" + query;
  await page.goto(url);
  await expect(page.getByRole("link", { name: title })).toBeVisible();
  const expectedUrl = page.url();
  const session = (await page.context().cookies()).find(
    (cookie) => cookie.name === "agency.session",
  );
  if (!session) throw new Error("Missing signed staff fixture session");
  const control = "http://127.0.0.1:4312/_e2e/rules";
  const rule = await page.request.post(control, {
    data: {
      method: "GET",
      path: "/api/v1/staff/audit-log",
      query: { entityId: id },
      status: 503,
      sessionDigest: createHash("sha256")
        .update(decodeURIComponent(session.value))
        .digest("hex"),
    },
  });
  expect(rule.status()).toBe(201);
  const ruleUrl = control + "/" + (await rule.json()).id;
  const refresh = page.getByRole("button", { name: "Refresh", exact: true });
  try {
    expect((await page.request.post(ruleUrl + "/release")).status()).toBe(200);
    await refresh.click();
    await expect(page.getByText(/Activity log unavailable/)).toBeVisible();
    await expect(page.getByRole("link", { name: title })).toHaveCount(0);
    await expect(page.getByLabel("Record ID")).toHaveValue(id);
    await expect(page).toHaveURL(expectedUrl);
  } finally {
    await page.request.delete(ruleUrl);
  }
  await refresh.click();
  await expect(page.getByRole("link", { name: title })).toBeVisible();
  await expect(page).toHaveURL(expectedUrl);
  const actor = page.getByLabel("Historical staff actor");
  await expect(actor.locator("option", { hasText: manager.name })).toHaveCount(
    1,
  );
  await page.route("**/api/v1/staff/audit-log/actors?**", (route) =>
    route.fulfill({
      status: 403,
      contentType: "application/json",
      body: JSON.stringify({ error: { code: "FORBIDDEN" } }),
    }),
  );
  await page
    .getByLabel("Search historical actors")
    .fill("denied-" + randomUUID());
  await expect(page.getByText(/Access denied/)).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Recorded activity" }),
  ).toHaveCount(0);
  await expect(actor).toHaveCount(0);
  await expect(page.getByText(title, { exact: true })).toHaveCount(0);
});

test("filter validation associates errors and streamed reads preserve the page and focus", async ({
  page,
}) => {
  await signIn(page, "manager");
  await page.goto(path);
  const originalUrl = page.url();
  const importId = page.getByLabel("Import ID");
  const through = page.getByLabel("Through (Dubai)");
  const originalEnd = await through.inputValue();
  const apply = page.getByRole("button", {
    name: "Apply filters",
    exact: true,
  });

  await importId.fill("invalid-identifier");
  await apply.click();
  await expect(importId).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#audit-import-error")).toBeVisible();
  await expect(importId).toBeFocused();
  await expect(page).toHaveURL(originalUrl);

  await importId.fill("");
  await through.fill("");
  await apply.click();
  await expect(through).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#audit-end-error")).toBeVisible();
  await expect(through).toBeFocused();
  await expect(page).toHaveURL(originalUrl);

  await through.fill(originalEnd);
  await page.getByLabel("Record type").selectOption("property");
  const recordId = randomUUID();
  await page.getByLabel("Record ID").fill(recordId);
  const session = (await page.context().cookies()).find(
    (cookie) => cookie.name === "agency.session",
  );
  if (!session) throw new Error("Missing signed staff fixture session");
  const control = "http://127.0.0.1:4312/_e2e/rules";
  const response = await page.request.post(control, {
    data: {
      method: "GET",
      path: "/api/v1/staff/audit-log",
      query: { entityId: recordId },
      sessionDigest: createHash("sha256")
        .update(decodeURIComponent(session.value))
        .digest("hex"),
    },
  });
  expect(response.status()).toBe(201);
  const ruleUrl = control + "/" + (await response.json()).id;

  try {
    await apply.click();
    await expect
      .poll(async () => (await (await page.request.get(ruleUrl)).json()).hits)
      .toBe(1);
    await expect(
      page.getByRole("heading", { name: "Activity log" }),
    ).toBeVisible();
    await expect(page.getByLabel("Record ID")).toHaveValue(recordId);
    await expect(page.getByText("Loading recorded changes…")).toBeVisible();
    await expect(apply).toBeEnabled();
    await expect(apply).toBeFocused();
    expect((await page.request.post(ruleUrl + "/release")).status()).toBe(200);
    await expect(apply).toBeEnabled();
    await expect(apply).toBeFocused();
    await expect(
      page.getByText("No recorded changes match these filters."),
    ).toBeVisible();
  } finally {
    await page.request.delete(ruleUrl);
  }

  const refresh = page.getByRole("button", { name: "Refresh", exact: true });
  await refresh.click();
  await expect(refresh).toBeEnabled();
  await expect(refresh).toBeFocused();
  const reset = page.getByRole("button", {
    name: "Reset filters",
    exact: true,
  });
  await reset.click();
  await expect(reset).toBeEnabled();
  await expect(reset).toBeFocused();
  await expect(page.getByLabel("Record ID")).toHaveValue("");
});

test("a failed live session recheck conceals history until verification succeeds", async ({
  page,
}) => {
  await signIn(page, "manager");
  await page.goto(path);
  await expect(
    page.getByRole("region", { name: "Recorded activity" }),
  ).toBeVisible();
  const originalUrl = page.url();
  const sessionPath = "**/api/v1/auth/get-session";
  await page.route(sessionPath, (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: { code: "UNAVAILABLE" } }),
    }),
  );

  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  const retry = page.getByRole("button", {
    name: "Retry session check",
    exact: true,
  });
  await expect(retry).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Recorded activity" }),
  ).toHaveCount(0);
  await expect(page.getByLabel("Historical staff actor")).toHaveCount(0);
  await expect(page).toHaveURL(originalUrl);

  await page.unroute(sessionPath);
  await retry.click();
  await expect(
    page.getByRole("region", { name: "Recorded activity" }),
  ).toBeVisible();
  await expect(page.getByLabel("Historical staff actor")).toBeVisible();
  await expect(page).toHaveURL(originalUrl);
});
