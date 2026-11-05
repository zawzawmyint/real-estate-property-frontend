import { chromium, expect, test, type Cookie } from "@playwright/test";

const sessions = new Map<string, Cookie[]>();

test.beforeEach(async ({ page }) => {
  const project = test.info().project.name;
  const cookies = sessions.get(project);
  if (cookies) {
    await page.context().addCookies(cookies);
    return;
  }
  const response = await page.request.post("/api/v1/auth/sign-in/email", {
    headers: { Origin: "http://localhost:3100" },
    data: {
      email: `e2e-property-${test.info().project.name}-manager@example.com`,
      password: process.env.STAFF_E2E_PASSWORD,
      rememberMe: true,
    },
  });
  expect(response.status(), await response.text()).toBe(200);
  sessions.set(project, await page.context().cookies());
});

test("collapsed filters retain drafts and Apply submits the complete query", async ({
  page,
}) => {
  await page.goto("/crm/properties?page=2&pageSize=5");
  const toggle = page.getByRole("button", { name: "Filters", exact: true });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(
    page.getByLabel("Publishing state", { exact: true }),
  ).toBeHidden();
  await expect(
    page.getByText("Manage your agency’s property inventory."),
  ).toBeVisible();
  await toggle.click();
  await page
    .getByLabel("Publishing state", { exact: true })
    .selectOption("published");
  await page.getByLabel("Purpose", { exact: true }).selectOption("sale");
  await toggle.click();
  await expect(toggle).toBeFocused();
  await page.getByLabel("Sort by", { exact: true }).selectOption("price_asc");
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(page).toHaveURL(/publishingState=published/);
  const query = new URL(page.url()).searchParams;
  expect(query.get("purpose")).toBe("sale");
  expect(query.get("page")).toBe("1");
  expect(query.get("pageSize")).toBe("5");
  expect(query.get("sort")).toBe("price_asc");
  await expect(
    page.getByRole("button", { name: "Filters · 2", exact: true }),
  ).toBeVisible();
});

test("chips use applied state, discard drafts on removal and restore history", async ({
  page,
}) => {
  await page.goto(
    "/crm/properties?q=Dubai&publishingState=published&sort=price_desc&pageSize=5",
  );
  await page
    .getByLabel("Search inventory", { exact: true })
    .fill("unsaved text");
  await page
    .getByRole("button", { name: "Remove Publishing: Published", exact: true })
    .click();
  await expect(page).not.toHaveURL(/publishingState/);
  await expect(
    page.getByLabel("Search inventory", { exact: true }),
  ).toHaveValue("Dubai");
  await expect(
    page.getByLabel("Search inventory", { exact: true }),
  ).toBeFocused();
  expect(new URL(page.url()).searchParams.get("sort")).toBe("price_desc");
  expect(new URL(page.url()).searchParams.get("pageSize")).toBe("5");
  await page.goBack();
  await expect(
    page.getByRole("button", {
      name: "Remove Publishing: Published",
      exact: true,
    }),
  ).toBeVisible();
  await page.goForward();
  await expect(
    page.getByRole("button", {
      name: "Remove Publishing: Published",
      exact: true,
    }),
  ).toHaveCount(0);
  await page.getByRole("link", { name: "Clear all", exact: true }).click();
  await expect(page).toHaveURL(/\/crm\/properties$/);
  await expect(
    page.getByRole("link", { name: "Clear all", exact: true }),
  ).toHaveCount(0);
  await page
    .getByLabel("Search inventory", { exact: true })
    .fill("no-such-property-toolbar");
  await page.getByLabel("Search inventory", { exact: true }).press("Enter");
  await expect(page).toHaveURL(/q=no-such-property-toolbar/);
  await expect(
    page.getByText("No matching properties", { exact: true }),
  ).toBeVisible();
});

test("compact desktop header and narrow controls remain usable", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1440, height: 1024 });
  await page.goto("/crm/properties");
  const toolbar = page.getByRole("group", {
    name: "Inventory search and filters",
  });
  const heading = await page
    .getByRole("heading", { name: "Properties", exact: true })
    .boundingBox();
  const box = await toolbar.boundingBox();
  expect(box!.y + box!.height - heading!.y).toBeLessThanOrEqual(180);
  await page.screenshot({
    path: info.outputPath("inventory-desktop.png"),
    fullPage: true,
  });
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    const toggle = page.getByRole("button", { name: "Filters", exact: true });
    const sort = page.getByLabel("Sort by", { exact: true });
    const filterBox = await toggle.boundingBox();
    const sortBox = await sort.boundingBox();
    expect(Math.abs(filterBox!.y - sortBox!.y)).toBeLessThanOrEqual(2);
    expect(filterBox!.x).toBeLessThan(sortBox!.x);
    await page.getByLabel("Search inventory", { exact: true }).focus();
    await page.keyboard.press("Tab");
    await expect(toggle).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(sort).toBeFocused();
    await expect(
      page.getByRole("button", { name: "Apply", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Filters", exact: true }).click();
    await expect(
      page.getByLabel("Availability", { exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.getByRole("button", { name: "Filters", exact: true }).click();
    await page.screenshot({
      path: info.outputPath(`inventory-${width}.png`),
      fullPage: true,
    });
  }
});

test("pagination, invalid URLs and Agent inventory permissions remain intact", async ({
  page,
}) => {
  await page.goto("/crm/properties?publishingState=published&pageSize=2");
  await page
    .getByRole("link", { name: "Go to next page", exact: true })
    .click();
  await expect(page).toHaveURL(/page=2/);
  expect(new URL(page.url()).searchParams.get("publishingState")).toBe(
    "published",
  );
  await page.goto("/crm/properties?publishingState=invalid");
  await expect(
    page.getByText("These inventory filters are invalid.", { exact: false }),
  ).toBeVisible();
  await page.context().clearCookies();
  const response = await page.request.post("/api/v1/auth/sign-in/email", {
    headers: { Origin: "http://localhost:3100" },
    data: {
      email: `e2e-property-${test.info().project.name}-agent@example.com`,
      password: process.env.STAFF_E2E_PASSWORD,
      rememberMe: true,
    },
  });
  expect(response.status(), await response.text()).toBe(200);
  await page.goto("/crm/properties");
  await expect(
    page.getByRole("link", { name: "Add property", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Edit", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Apply", exact: true }),
  ).toBeEnabled();
});

test("public routes and another CRM screen retain their own controls", async ({
  page,
}) => {
  for (const route of ["/", "/properties", "/agents", "/contact"]) {
    const response = await page.goto(route, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    const heading = page.locator("h1");
    await expect(heading).toHaveCount(1);
    await expect(heading).toBeVisible();
    await expect(
      page.getByRole("group", { name: "Inventory search and filters" }),
    ).toHaveCount(0);
  }
  await page.goto("/crm/tasks", { waitUntil: "commit" });
  await expect(
    page.getByRole("heading", { name: "Tasks", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Task status", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("group", { name: "Inventory search and filters" }),
  ).toHaveCount(0);
});

test("inventory controls reflow at native 200 percent browser zoom", async ({
  page,
}, info) => {
  test.skip(
    info.project.name !== "desktop" || !process.env.PUBLIC_BROWSER_EXECUTABLE,
    "Native zoom requires an opt-in full Chrome/Chromium executable via PUBLIC_BROWSER_EXECUTABLE.",
  );
  const context = await chromium.launchPersistentContext("", {
    ...(process.env.PUBLIC_BROWSER_EXECUTABLE
      ? { executablePath: process.env.PUBLIC_BROWSER_EXECUTABLE }
      : { channel: "chromium" }),
    headless: true,
    viewport: null,
    deviceScaleFactor: undefined,
    isMobile: undefined,
    args: ["--window-size=1440,1024"],
  });
  try {
    await context.addCookies(await page.context().cookies());
    const zoomPage = await context.newPage();
    await zoomPage.goto("http://localhost:3100/crm/properties");
    const baseline = await zoomPage.evaluate(() => ({
      width: innerWidth,
      ratio: devicePixelRatio,
    }));
    const settings = await context.newPage();
    await settings.goto("chrome://settings/appearance");
    await settings.locator("#zoomLevel").selectOption("2");
    await expect(settings.locator("#zoomLevel")).toHaveValue("2");
    await settings.close();
    await zoomPage.reload();
    await expect
      .poll(() => zoomPage.evaluate(() => devicePixelRatio))
      .toBe(baseline.ratio * 2);
    await expect
      .poll(() => zoomPage.evaluate(() => innerWidth))
      .toBeLessThanOrEqual(baseline.width / 2 + 1);
    await expect(
      zoomPage.getByRole("button", { name: "Apply", exact: true }),
    ).toBeVisible();
    await zoomPage
      .getByRole("button", { name: "Filters", exact: true })
      .click();
    await expect(
      zoomPage.getByLabel("Availability", { exact: true }),
    ).toBeVisible();
    expect(
      await zoomPage.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await zoomPage.screenshot({
      path: info.outputPath("inventory-native-zoom.png"),
      fullPage: true,
    });
  } finally {
    await context.close();
  }
});
