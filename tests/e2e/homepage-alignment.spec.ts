import { expect, test } from "@playwright/test";
import { capturePublicPage } from "../fixtures/public-capture";

test("homepage search controls and editorial cards align at desktop widths", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  for (const width of [1480, 1196, 1024]) {
    await page.setViewportSize({ width, height: 808 });
    await page.goto("/");
    const form = page.getByRole("form", { name: "Find a property" });
    await expect(
      form.getByRole("button", { name: "Search properties" }),
    ).toBeEnabled();
    const geometry = await form.evaluate((element) => {
      const fields = Array.from(
        element.querySelectorAll<HTMLInputElement | HTMLSelectElement>(
          "input:not([type=radio]), select",
        ),
      );
      const button = element.querySelector("button[type=submit]")!;
      const bounds = [...fields, button].map((field) =>
        field.getBoundingClientRect(),
      );
      const tabs = element
        .querySelector("fieldset fieldset")!
        .getBoundingClientRect();
      return {
        tops: bounds.map((box) => box.top),
        heights: bounds.map((box) => box.height),
        tabBottom: tabs.bottom,
      };
    });
    expect(
      Math.max(...geometry.tops) - Math.min(...geometry.tops),
    ).toBeLessThanOrEqual(2);
    expect(
      Math.max(...geometry.heights) - Math.min(...geometry.heights),
    ).toBeLessThanOrEqual(2);
    expect(geometry.tabBottom).toBeLessThan(Math.min(...geometry.tops));

    const cards = page.getByTestId("property-card");
    await expect(cards).toHaveCount(3);
    const positions = await cards.evaluateAll((elements) =>
      elements.map((card) => {
        const content = card.querySelector('[data-slot="card-content"]')!;
        const image = card.querySelector('[data-slot="property-image"]')!;
        const title = content.querySelector("h3")!;
        const price = content.querySelector("p")!;
        return {
          cardBottom: card.getBoundingClientRect().bottom,
          contentBottom: content.getBoundingClientRect().bottom,
          imageBottom: image.getBoundingClientRect().bottom,
          titleBottom: title.getBoundingClientRect().bottom,
          priceTop: price.getBoundingClientRect().top,
        };
      }),
    );
    expect(
      Math.abs(positions[0]!.contentBottom - positions[2]!.contentBottom),
    ).toBeLessThanOrEqual(2);
    for (const card of positions.slice(1))
      expect(card.priceTop).toBeGreaterThanOrEqual(card.titleBottom);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    if (width === 1480)
      await capturePublicPage(
        page,
        testInfo.outputPath("homepage-aligned-1480.png"),
      );
  }
});
