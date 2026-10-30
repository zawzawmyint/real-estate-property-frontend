import { expect, type Page } from "@playwright/test";
import { writeFile } from "node:fs/promises";

export async function capturePublicPage(page: Page, path: string) {
  // Full-page screenshots do not scroll lazy images into view themselves.
  // Capture the loaded public presentation rather than offscreen placeholders.
  for (const image of await page.locator("main img:visible").all()) {
    await image.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        image.evaluate(
          (element: HTMLImageElement) =>
            element.complete && element.naturalWidth > 0,
        ),
      )
      .toBe(true);
  }
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    return document.fonts.ready;
  });
  if (page.viewportSize() === null) {
    // Native browser zoom is outside Playwright's viewport emulation. Its
    // screenshot clip uses CSS pixels and can cut the physical surface in half.
    const session = await page.context().newCDPSession(page);
    try {
      const { contentSize } = await session.send("Page.getLayoutMetrics");
      const { data } = await session.send("Page.captureScreenshot", {
        format: "png",
        captureBeyondViewport: true,
        clip: { ...contentSize, scale: 1 },
      });
      const bytes = Buffer.from(data, "base64");
      const physicalWidth = await page.evaluate(() =>
        Math.round(innerWidth * devicePixelRatio),
      );
      expect(bytes.readUInt32BE(16)).toBe(physicalWidth);
      await writeFile(path, bytes);
    } finally {
      await session.detach();
    }
    return;
  }
  await page.screenshot({
    path,
    fullPage: true,
    animations: "disabled",
    caret: "initial",
  });
}
