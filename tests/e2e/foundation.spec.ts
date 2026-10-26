import { expect, test } from "@playwright/test";

test("public footer provides staff sign-in and direct CRM access remains protected", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "A place for your next chapter." }),
  ).toBeVisible();
  await expect(page.getByRole("main")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("public.png"),
    fullPage: true,
  });
  if ((page.viewportSize()?.width ?? 1280) < 768)
    await page.getByRole("button", { name: "Menu", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "Agency workspace" }),
  ).toHaveCount(0);
  await expect(
    page.locator('header a[href="/crm"], header a[href="/login"]'),
  ).toHaveCount(0);
  if ((page.viewportSize()?.width ?? 1280) < 768)
    await page.keyboard.press("Escape");
  const staffSignIn = page.getByRole("contentinfo").getByRole("link", {
    name: "Staff sign-in",
    exact: true,
  });
  await expect(staffSignIn).toHaveAttribute("href", "/login");
  await staffSignIn.click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("heading", { name: "Sign in to your workspace" }),
  ).toBeVisible();
  await page.goto("/crm");
  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("heading", { name: "Sign in to your workspace" }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => getComputedStyle(document.body).fontFamily),
  ).toMatch(/poppins/i);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("login.png"),
    fullPage: true,
  });
});

test("public navigation keeps purpose selection current and mobile menus restore focus", async ({
  page,
}, testInfo) => {
  await page.goto("/properties?purpose=sale");
  const mobile = (page.viewportSize()?.width ?? 1280) < 768;
  const menu = page.getByRole("button", { name: "Menu", exact: true });

  if (mobile) {
    await menu.click();
    await expect(
      page.getByRole("dialog", { name: "Explore Avenor" }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu).toBeFocused();
    await menu.click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "Close", exact: true }).focus();
    await page.keyboard.press("Tab");
    await expect(
      dialog.getByRole("link", { name: "Buy", exact: true }),
    ).toBeFocused();
  }

  const navigation = page.getByRole("navigation", { name: "Main navigation" });
  const buy = navigation.getByRole("link", { name: "Buy", exact: true });
  const rent = navigation.getByRole("link", { name: "Rent", exact: true });
  await expect(buy).toHaveText("Buy");
  await expect(rent).toHaveText("Rent");
  await expect(buy).toHaveAttribute("aria-current", "page");
  await page.screenshot({
    path: testInfo.outputPath("public-header-visible-labels.png"),
    caret: "initial",
  });
  await rent.click();
  await expect(page).toHaveURL(/purpose=rent/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  if (mobile) await menu.click();
  await expect(
    navigation.getByRole("link", { name: "Rent", exact: true }),
  ).toHaveAttribute("aria-current", "page");

  if (mobile) {
    await page.setViewportSize({ width: 1024, height: 800 });
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  }
});

test("public native select chevron stays centered and keeps native keyboard selection", async ({
  page,
}, testInfo) => {
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const type = page
      .getByRole("form", { name: "Find a property" })
      .getByLabel("Property type", { exact: true });
    const chevron = type
      .locator("xpath=..")
      .locator('[data-slot="select-chevron"]');

    await expect(chevron.locator('[data-icon="chevron-down"]')).toBeVisible();
    const [selectBox, chevronBox] = await Promise.all([
      type.boundingBox(),
      chevron.boundingBox(),
    ]);
    expect(selectBox).not.toBeNull();
    expect(chevronBox).not.toBeNull();
    expect(
      Math.abs(
        selectBox!.y +
          selectBox!.height / 2 -
          (chevronBox!.y + chevronBox!.height / 2),
      ),
    ).toBeLessThanOrEqual(1);
    await type.focus();
    await page.keyboard.press("ArrowDown");
    await expect(type).toHaveValue("apartment");
    await page.screenshot({
      path: testInfo.outputPath(`public-select-alignment-${width}.png`),
      caret: "initial",
    });
  }
});

test("browser proxy reaches the real Express API", async ({ request }) => {
  const response = await request.get("/api/v1/health");

  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({
    status: "ok",
    service: "real-estate-api",
  });
});

test("public header reflows across supported widths and enlarged layout", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "desktop",
    "One viewport sweep is sufficient.",
  );
  await page.goto("/");

  await page.evaluate(() => document.fonts.ready);
  expect(
    await page.evaluate(() => getComputedStyle(document.body).fontFamily),
  ).toMatch(/poppins/i);
  expect(
    await page
      .getByRole("heading", { name: "A place for your next chapter." })
      .evaluate((element) => getComputedStyle(element).fontFamily),
  ).toMatch(/lora/i);

  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    if (width >= 1024) {
      const gap = await page.evaluate(() => {
        const heading = document.querySelector("#home-heading")!;
        const image = heading.closest("section")!.querySelector("img");
        if (!image) return null;
        const text = document.createRange();
        text.selectNodeContents(heading);
        const right = Math.max(
          ...Array.from(text.getClientRects(), (rect) => rect.right),
        );
        return image.getBoundingClientRect().left - right;
      });
      if (gap !== null) expect(gap).toBeGreaterThanOrEqual(24);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(
      page
        .getByRole("banner")
        .getByRole("link", { name: "Avenor Properties home" }),
    ).toBeVisible();
    if (width < 768) {
      await page.getByRole("button", { name: "Menu", exact: true }).click();
      await expect(
        page
          .getByRole("dialog")
          .getByRole("link", { name: "Rent", exact: true }),
      ).toBeVisible();
      await expect(page.getByRole("dialog")).toHaveCSS("opacity", "1");
      await expect(page.getByRole("dialog")).toHaveCSS(
        "width",
        `${Math.min(320, width - 32)}px`,
      );
      await page.screenshot({
        animations: "disabled",
        path: testInfo.outputPath(`public-menu-${width}.png`),
      });
      await page.keyboard.press("Escape");
    }
    await page.screenshot({ path: testInfo.outputPath(`public-${width}.png`) });
  }

  await page.evaluate(() => {
    document.documentElement.style.zoom = "2";
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("public-layout-200-percent.png"),
  });
});

test("missing pages offer a route home", async ({ page }) => {
  const response = await page.goto("/missing-page");

  expect(response?.status()).toBe(404);
  await expect(page.getByRole("link", { name: "Return home" })).toBeVisible();
});
