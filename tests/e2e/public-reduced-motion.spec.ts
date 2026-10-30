import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }, testInfo) => {
  // One desktop browser sweeps explicit widths, including real pointer hover.
  test.skip(testInfo.project.name !== "desktop");
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("reduced motion removes gallery and backdrop animations at mobile and desktop widths", async ({
  page,
}) => {
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/properties?purpose=sale");
    await page.getByTestId("property-card").first().getByRole("link").click();
    const trigger = page.getByRole("button", { name: "Open cover photo" });
    await trigger.click();

    const gallery = page.getByRole("dialog");
    await expect(gallery).toBeVisible();
    await expect(gallery).toHaveCSS("animation-name", "none");
    await expect(page.locator('[data-slot="dialog-overlay"]')).toHaveCSS(
      "animation-name",
      "none",
    );
    await page.keyboard.press("Escape");
    await expect(gallery).toHaveCount(0);
    await expect(trigger).toBeFocused();
  }
});

test("reduced motion opens the mobile property filter sheet without transitions", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/properties?purpose=sale");
  const trigger = page.getByRole("button", { name: "Filters", exact: true });
  await trigger.click();

  const filters = page.getByRole("dialog", { name: "Filter properties" });
  await expect(filters).toBeVisible();
  await expect(filters).toHaveCSS("transition-duration", "0s");
  await expect(page.locator('[data-slot="sheet-overlay"]')).toHaveCSS(
    "transition-duration",
    "0s",
  );
  await expect(filters.getByLabel("Location", { exact: true })).toBeEditable();
  await page.keyboard.press("Escape");
  await expect(filters).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("reduced motion keeps a property cover still when its card is hovered", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/properties?purpose=sale");
  const card = page.getByTestId("property-card").first();
  const image = card.locator('[data-slot="property-image"]');
  await expect(image).toBeVisible();
  await page.mouse.move(0, 0);
  const initialScale = await image.evaluate(
    (element) => getComputedStyle(element).scale,
  );
  const initialTransform = await image.evaluate(
    (element) => getComputedStyle(element).transform,
  );

  await card.hover();

  await expect(image).toHaveCSS("transition-duration", "0s");
  await expect(image).toHaveCSS("scale", initialScale);
  await expect(image).toHaveCSS("transform", initialTransform);
});
