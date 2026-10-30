import { expect, test } from "@playwright/test";

test("property photos use a quiet reserved placeholder while an image is delayed", async ({
  page,
}, testInfo) => {
  let release!: () => void;
  const ready = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/*", async (route) => {
    if (route.request().resourceType() !== "image") return route.continue();
    await ready;
    await route.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="64"><rect width="96" height="64" fill="#701f35"/></svg>',
    });
  });

  try {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const photo = page
      .getByTestId("property-card")
      .first()
      .locator('img[alt$="— cover photo"]');
    const frame = photo.locator("..");
    const placeholder = frame.locator(
      '[data-slot="property-image-placeholder"]',
    );
    await expect(placeholder).toHaveAttribute("data-state", "loading");
    await expect(
      placeholder.locator(
        '[data-slot="building-loader"], [data-slot="spinner"]',
      ),
    ).toHaveCount(0);
    expect(
      await placeholder.evaluate(
        (element) => element.getAnimations({ subtree: true }).length,
      ),
    ).toBe(0);
    await expect(
      page.getByRole("button", { name: "Search properties", exact: true }),
    ).toBeEnabled();
    await page.evaluate(() => document.fonts.ready);
    const before = await frame.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return {
        width: rect.width,
        height: rect.height,
        top: rect.top + scrollY,
      };
    });
    await frame.screenshot({
      path: testInfo.outputPath("quiet-photo-loading.png"),
    });
    release();
    await expect(placeholder).toHaveCount(0);
    await expect
      .poll(() =>
        photo.evaluate((image: HTMLImageElement) => image.naturalWidth),
      )
      .toBe(96);
    expect(
      await frame.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return {
          width: rect.width,
          height: rect.height,
          top: rect.top + scrollY,
        };
      }),
    ).toEqual(before);
  } finally {
    release();
  }
});

test("failed property photos show a static unavailable icon without a loader", async ({
  page,
}, testInfo) => {
  await page.route("**/*", async (route) => {
    if (route.request().resourceType() !== "image") return route.continue();
    await route.abort();
  });

  await page.goto("/", { waitUntil: "domcontentloaded" });
  const frame = page.locator('[data-slot="property-image"]').first();
  const placeholder = frame.locator('[data-slot="property-image-placeholder"]');

  await expect(placeholder).toHaveAttribute("data-state", "unavailable");
  await expect(
    placeholder.getByText("Photo unavailable", { exact: true }),
  ).toBeVisible();
  await expect(
    placeholder.locator('[data-slot="building-loader"], [data-slot="spinner"]'),
  ).toHaveCount(0);
  await expect(placeholder.locator('[data-icon="image"]')).toBeVisible();
  expect(
    await placeholder.evaluate(
      (element) => element.getAnimations({ subtree: true }).length,
    ),
  ).toBe(0);
  await placeholder.screenshot({
    path: testInfo.outputPath("static-photo-unavailable.png"),
  });
  await expect(frame.getByRole("img")).toHaveAccessibleName(
    /cover photo\. Photo unavailable$/,
  );
  await expect(
    page
      .getByTestId("property-card")
      .first()
      .locator('img[alt$="— cover photo"]'),
  ).toHaveCount(0);
});
