import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";

test("mobile filters retain progress and close after navigation commits", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile");
  await page.goto("/properties?purpose=sale");
  await page.getByRole("button", { name: "Filters", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Filter properties" });
  const location = `Mobile filter ${randomUUID()}`;
  await dialog.getByLabel("Location", { exact: true }).fill(location);
  let release!: () => void;
  let started!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  const requested = new Promise<void>((resolve) => {
    started = resolve;
  });
  await page.route("**/properties?**", async (route) => {
    if (
      new URL(route.request().url()).searchParams.get("location") ===
        location &&
      route.request().headers().rsc === "1"
    ) {
      started();
      await held;
    }
    await route.continue();
  });
  try {
    await dialog
      .getByRole("button", { name: "Apply filters", exact: true })
      .click();
    await requested;
    const searching = dialog.getByRole("button", {
      name: "Searching…",
      exact: true,
    });
    await expect(searching).toBeDisabled();
    await expect(searching.locator('[data-slot="spinner"]')).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath("mobile-filter-loading.png"),
      fullPage: true,
    });
    release();
    await expect(page).toHaveURL(
      new RegExp(encodeURIComponent(location).replaceAll("%20", "\\+")),
    );
    await expect(dialog).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "No homes found" }),
    ).toBeVisible();
  } finally {
    release();
  }
});

test("navigation keeps spinner feedback visible until the destination commits", async ({
  page,
}) => {
  await page.goto("/");
  let release!: () => void;
  let started!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  const requested = new Promise<void>((resolve) => {
    started = resolve;
  });
  await page.route("**/properties?**", async (route) => {
    const url = new URL(route.request().url());
    if (
      url.searchParams.get("purpose") === "rent" &&
      route.request().headers().rsc === "1"
    ) {
      started();
      await held;
    }
    await route.continue();
  });
  try {
    const mobile = (page.viewportSize()?.width ?? 1280) < 768;
    if (mobile)
      await page.getByRole("button", { name: "Menu", exact: true }).click();
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "Rent", exact: true })
      .click();
    await requested;
    const status = page
      .getByRole("status")
      .filter({ hasText: "Opening page…" });
    await expect(status.locator('[data-slot="spinner"]')).toBeVisible();
    if (mobile)
      await expect(
        page.getByRole("dialog", { name: "Explore Avenor" }),
      ).toBeVisible();
    release();
    await expect(page).toHaveURL(/purpose=rent/);
    await expect(status).toHaveCount(0);
    await expect(page.getByRole("dialog")).toHaveCount(0);
  } finally {
    release();
  }
});

test("homepage search and public results stay usable while their server reads are held", async ({
  page,
}, testInfo) => {
  // The homepage has a shared featured query. One worker tests both viewports
  // sequentially so desktop/mobile rules never contend for the same request.
  test.skip(testInfo.project.name !== "desktop");
  const control = "http://127.0.0.1:4312/_e2e/rules";
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    const response = await page.request.post(control, {
      data: {
        method: "GET",
        path: "/api/v1/properties",
        query: { featured: "true" },
      },
    });
    expect(response.status()).toBe(201);
    const { id } = await response.json();
    try {
      await page.goto("/", { waitUntil: "commit" });
      await expect(
        page.getByRole("heading", { name: "A place for your next chapter." }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Search properties", exact: true }),
      ).toBeEnabled();
      const hero = page
        .getByRole("status")
        .filter({ hasText: "Loading featured home…" });
      await expect(hero.locator('[data-slot="building-loader"]')).toHaveCount(
        1,
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
      ).toBe(false);
      await page.screenshot({
        path: testInfo.outputPath(`homepage-loading-${width}.png`),
        fullPage: true,
        caret: "initial",
      });
      await page.request.post(`${control}/${id}/release`);
      await expect(hero).toHaveCount(0);
    } finally {
      await page.request.delete(`${control}/${id}`);
    }

    const location = `Loading ${randomUUID()}`;
    const result = await page.request.post(control, {
      data: { method: "GET", path: "/api/v1/properties", query: { location } },
    });
    expect(result.status()).toBe(201);
    const { id: searchId } = await result.json();
    try {
      const form = page.getByRole("form", { name: "Find a property" });
      await form.getByLabel("Location", { exact: true }).fill(location);
      await form
        .getByRole("button", { name: "Search properties", exact: true })
        .click();
      await expect
        .poll(async () => {
          const hit = await page.request.get(`${control}/${searchId}`);
          expect(hit.status()).toBe(200);
          return (await hit.json()).hits as number;
        })
        .toBeGreaterThan(0);
      await expect(
        page.getByRole("heading", { name: "Homes to make your own." }),
      ).toBeVisible();
      const loading = page.getByRole("status", { name: "Loading properties" });
      await expect(loading).toBeVisible();
      await expect(
        loading.locator('[data-slot="building-loader"]'),
      ).toHaveCount(1);
      await page.screenshot({
        path: testInfo.outputPath(`public-search-loading-${width}.png`),
        fullPage: true,
        caret: "initial",
      });
      await page.request.post(`${control}/${searchId}/release`);
      await expect(loading).toHaveCount(0);
      await expect(
        page.getByRole("heading", { name: "No homes found" }),
      ).toBeVisible();
    } finally {
      await page.request.delete(`${control}/${searchId}`);
    }
  }
});
