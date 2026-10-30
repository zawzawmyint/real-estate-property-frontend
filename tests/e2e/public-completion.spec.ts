import { expect, test } from "@playwright/test";
import { capturePublicPage } from "../fixtures/public-capture";

const control = "http://127.0.0.1:4312/_e2e/rules";

test("public routes remain readable across the supported viewport matrix", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "desktop",
    "One serial viewport sweep covers both layouts.",
  );
  test.setTimeout(120_000);
  const response = await page.request.get("/api/v1/properties?pageSize=1");
  expect(response.status()).toBe(200);
  const { items } = await response.json();
  expect(items.length).toBe(1);
  const routes = [
    ["home", "/"],
    ["properties", "/properties"],
    ["property", `/properties/${items[0].id}`],
    ["contact", "/contact"],
    ["agents", "/agents"],
    ["agent", "/agents/daniel-brooks"],
  ] as const;

  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const [name, route] of routes) {
    await page.goto(route);
    await page.evaluate(() => document.fonts.ready);
    await expect(
      page.getByRole("main").getByRole("heading", { level: 1 }),
    ).toBeVisible();
    for (const width of [320, 375, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${route} at ${width}px`,
      ).toBe(true);
      await expect(page.getByRole("main")).toBeVisible();
      if (
        width === 320 ||
        width === 390 ||
        (name === "home" && width === 1440)
      ) {
        await capturePublicPage(
          page,
          testInfo.outputPath(`public-${name}-${width}.png`),
        );
      }
    }
    await page.setViewportSize({ width: 1280, height: 1000 });
    await page.evaluate(() => {
      document.documentElement.style.zoom = "2";
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `${route} with 200% CSS enlargement (browser zoom checked separately)`,
    ).toBe(true);
    await capturePublicPage(
      page,
      testInfo.outputPath(`public-${name}-css-enlarged-200.png`),
    );
    await page.evaluate(() => {
      document.documentElement.style.zoom = "";
    });
  }
});

test("homepage guidance connects visitors with agents and contact", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  const guidance = page.getByRole("region", {
    name: "Good homes. Better guidance.",
  });
  await expect(guidance).toBeVisible();
  await expect(
    guidance.getByText(
      "Explore our property collection and meet the people who can help with your search.",
      { exact: true },
    ),
  ).toBeVisible();
  const agents = guidance.getByRole("link", { name: "Meet our agents" });
  const contact = guidance.getByRole("link", { name: "Contact us" });
  await expect(agents).toHaveAttribute("href", "/agents");
  await expect(contact).toHaveAttribute("href", "/contact");
  for (const link of [agents, contact]) {
    const bounds = await link.boundingBox();
    expect(bounds!.height).toBeGreaterThanOrEqual(44);
  }
  await guidance.screenshot({
    caret: "initial",
    path: testInfo.outputPath("home-guidance.png"),
  });
  await agents.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/agents$/);
  await expect(
    page.getByRole("heading", { name: /Meet the people behind/ }),
  ).toBeVisible();

  await page.goto("/");
  await page
    .getByRole("region", { name: "Good homes. Better guidance." })
    .getByRole("link", { name: "Contact us" })
    .click();
  await expect(page).toHaveURL(/\/contact$/);
});

test.describe("homepage featured states", () => {
  test.describe.configure({ mode: "serial" });
  test.beforeEach(({}, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop" || testInfo.config.workers !== 1,
      "Global featured rules require the documented single-worker acceptance run.",
    );
  });

  test("guidance and search remain usable while featured homes are pending", async ({
    page,
  }, testInfo) => {
    const response = await page.request.post(control, {
      data: {
        method: "GET",
        path: "/api/v1/properties",
        query: { featured: "true", pageSize: "3", sort: "newest" },
      },
    });
    expect(response.status()).toBe(201);
    const { id } = await response.json();
    try {
      await page.goto("/", { waitUntil: "commit" });
      await expect(
        page.getByRole("status", { name: "Loading properties", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Search properties", exact: true }),
      ).toBeEnabled();
      const guidance = page.getByRole("region", {
        name: "Good homes. Better guidance.",
      });
      await expect(guidance).toBeVisible();
      await expect(
        guidance.getByRole("link", { name: "Meet our agents" }),
      ).toBeVisible();
      await page.screenshot({
        caret: "initial",
        path: testInfo.outputPath("home-featured-pending.png"),
        fullPage: true,
      });
      await guidance.getByRole("link", { name: "Contact us" }).click();
      await expect(page).toHaveURL(/\/contact$/);
    } finally {
      await page.request.delete(`${control}/${id}`);
    }
  });

  test("zero featured homes offers browsing without request-failure feedback", async ({
    page,
  }, testInfo) => {
    const response = await page.request.post(control, {
      data: {
        method: "GET",
        path: "/api/v1/properties",
        query: { featured: "true", pageSize: "3", sort: "newest" },
        empty: true,
      },
    });
    expect(response.status()).toBe(201);
    const { id } = await response.json();
    try {
      await page.request.post(`${control}/${id}/release`);
      await page.goto("/");
      await expect(
        page.getByRole("heading", {
          name: "No featured homes right now.",
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        page.getByText("We couldn’t load featured homes.", { exact: false }),
      ).toHaveCount(0);
      await expect(
        page.getByRole("region", { name: "Good homes. Better guidance." }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Search properties", exact: true }),
      ).toBeEnabled();
      await expect(
        page.getByRole("link", { name: "Browse properties", exact: true }),
      ).toHaveAttribute("href", "/properties?purpose=sale");
      await page.screenshot({
        caret: "initial",
        path: testInfo.outputPath("home-featured-empty.png"),
        fullPage: true,
      });
      await page
        .getByRole("link", { name: "Browse properties", exact: true })
        .click();
      await expect(page).toHaveURL(/\/properties\?purpose=sale$/);
    } finally {
      await page.request.delete(`${control}/${id}`);
    }
  });

  test("failed featured reads preserve guidance and support explicit retry", async ({
    page,
  }, testInfo) => {
    const response = await page.request.post(control, {
      data: {
        method: "GET",
        path: "/api/v1/properties",
        query: { featured: "true", pageSize: "3", sort: "newest" },
        status: 503,
      },
    });
    expect(response.status()).toBe(201);
    const { id } = await response.json();
    try {
      await page.request.post(`${control}/${id}/release`);
      await page.goto("/");
      await expect(page.getByRole("main").getByRole("alert")).toContainText(
        "We couldn’t load featured homes.",
      );
      await expect(
        page.getByRole("heading", {
          name: "No featured homes right now.",
          exact: true,
        }),
      ).toHaveCount(0);
      await expect(
        page.getByRole("region", { name: "Good homes. Better guidance." }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Search properties", exact: true }),
      ).toBeEnabled();
      await page.screenshot({
        caret: "initial",
        path: testInfo.outputPath("home-featured-failed.png"),
        fullPage: true,
      });
      await page.request.delete(`${control}/${id}`);
      await page
        .getByRole("button", { name: "Try again", exact: true })
        .click();
      await expect(
        page.getByRole("heading", {
          name: "Homes worth discovering.",
          exact: true,
        }),
      ).toBeVisible();
      await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0);
    } finally {
      await page.request.delete(`${control}/${id}`);
    }
  });
});
