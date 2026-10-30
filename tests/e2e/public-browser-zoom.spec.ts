import { chromium, expect, test } from "@playwright/test";
import { capturePublicPage } from "../fixtures/public-capture";

test("public pages reflow at real 200 percent browser zoom", async ({}, info) => {
  test.skip(info.project.name !== "desktop", "One native browser zoom sweep.");
  test.setTimeout(120_000);

  // The empty profile path creates a temporary browser profile, never the
  // user's profile. Full Chromium is required for its native Appearance UI.
  const executablePath = process.env.PUBLIC_BROWSER_EXECUTABLE;
  const context = await chromium.launchPersistentContext("", {
    ...(executablePath ? { executablePath } : { channel: "chromium" }),
    headless: true,
    viewport: null,
    deviceScaleFactor: undefined,
    isMobile: undefined,
    args: ["--window-size=1280,1000"],
    timeout: 15_000,
  });

  try {
    context.setDefaultTimeout(10_000);
    context.setDefaultNavigationTimeout(15_000);
    const page = await context.newPage();
    const response = await context.request.get(
      "http://localhost:3100/api/v1/properties?pageSize=1",
    );
    expect(response.status()).toBe(200);
    const collection = (await response.json()) as { items: { id: string }[] };
    const property = collection.items[0];
    if (!property) throw new Error("A seeded public property is required");

    const routes = [
      ["home", "/"],
      ["properties", "/properties"],
      ["property", `/properties/${property.id}`],
      ["contact", "/contact"],
      ["agents", "/agents"],
      ["agent", "/agents/daniel-brooks"],
    ] as const;

    await page.goto("http://localhost:3100/");
    const baseline = await page.evaluate(() => ({
      width: innerWidth,
      ratio: devicePixelRatio,
    }));
    // The requested native window size includes platform-specific borders.
    // Resize the isolated window so its content viewport is exactly 1280px.
    const cdp = await context.newCDPSession(page);
    const { windowId, bounds } = await cdp.send("Browser.getWindowForTarget");
    if (bounds.width === undefined)
      throw new Error("Native browser window width is unavailable");
    await cdp.send("Browser.setWindowBounds", {
      windowId,
      bounds: { width: bounds.width + 1280 - baseline.width },
    });
    await expect.poll(() => page.evaluate(() => innerWidth)).toBe(1280);

    const settings = await context.newPage();
    await settings.goto("chrome://settings/appearance");
    await settings.locator("#zoomLevel").selectOption("2");
    await expect(settings.locator("#zoomLevel")).toHaveValue("2");
    await settings.close();

    for (const [name, path] of routes) {
      await page.goto(`http://localhost:3100${path}`);
      await expect.poll(() => page.evaluate(() => innerWidth)).toBe(640);
      expect(await page.evaluate(() => devicePixelRatio)).toBe(
        baseline.ratio * 2,
      );
      expect(
        await page.evaluate(
          () => getComputedStyle(document.documentElement).zoom,
        ),
      ).toBe("1");
      await expect(page.locator("main h1")).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        path,
      ).toBe(true);
      const menu = page.getByRole("button", { name: "Menu", exact: true });
      await menu.click();
      await expect(
        page.getByRole("dialog").getByRole("link", { name: "Our agents" }),
      ).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expect(menu).toBeFocused();
      await capturePublicPage(
        page,
        info.outputPath(`public-${name}-browser-zoom-200.png`),
      );
    }
  } finally {
    await context.close();
  }
});
