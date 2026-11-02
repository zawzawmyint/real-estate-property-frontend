import { expect, test } from "@playwright/test";
import { capturePublicPage } from "../fixtures/public-capture";

test("listings use horizontal rows, outlined navigation and a single sort", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/properties?purpose=sale&pageSize=4");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Properties for sale",
  );
  await expect(
    page.getByRole("navigation", { name: "Breadcrumb" }),
  ).toBeVisible();
  await expect(page.getByLabel("Sort by", { exact: true })).toHaveCount(1);
  const cards = page.getByTestId("property-card");
  await expect(cards.first()).toBeVisible();
  await expect(cards.first().getByRole("link")).toHaveAccessibleName(
    /^View property: .+/,
  );
  const geometry = await cards.evaluateAll((elements) =>
    elements.map((card) => {
      const photo = card.querySelector('[data-slot="property-image"]')!;
      const content = card.querySelector('[data-slot="card-content"]')!;
      const link = card.querySelector("a")!;
      const photoBox = photo.getBoundingClientRect();
      const contentBox = content.getBoundingClientRect();
      const actionStyle = getComputedStyle(link);
      return {
        left: card.getBoundingClientRect().left,
        top: card.getBoundingClientRect().top,
        bottom: card.getBoundingClientRect().bottom,
        photoRight: photoBox.right,
        contentLeft: contentBox.left,
        photoTop: photoBox.top,
        contentTop: contentBox.top,
        border: parseFloat(actionStyle.borderTopWidth),
        background: actionStyle.backgroundColor,
        links: card.querySelectorAll("a").length,
        action: link.textContent,
      };
    }),
  );
  for (const [index, row] of geometry.entries()) {
    expect(row.contentLeft).toBeGreaterThanOrEqual(row.photoRight);
    expect(Math.abs(row.contentTop - row.photoTop)).toBeLessThanOrEqual(2);
    expect(row.border).toBeGreaterThanOrEqual(1);
    expect(["rgba(0, 0, 0, 0)", "transparent"]).toContain(row.background);
    expect(row.links).toBe(1);
    expect(row.action).toContain("View property");
    if (index) {
      expect(row.top).toBeGreaterThan(geometry[index - 1]!.bottom);
      expect(row.left).toBe(geometry[0]!.left);
    }
  }
  await capturePublicPage(page, testInfo.outputPath("listings-1440.png"));
});

test("listings search aligns two desktop rows and preserves independent AED bounds", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/properties?purpose=rent&sort=price_desc&page=2");
  const form = page.getByRole("form", { name: "Filter properties" });
  await expect(
    form.getByRole("button", { name: "Apply filters" }),
  ).toBeEnabled();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Properties for rent",
  );
  await expect(form.getByRole("group", { name: "Budget (AED)" })).toBeVisible();
  const boxes = await Promise.all(
    [
      "Location",
      "Property type",
      "Min. price (AED)",
      "Max. price (AED)",
      "Minimum bedrooms",
    ].map((label) => form.getByLabel(label, { exact: true }).boundingBox()),
  );
  for (const box of boxes) expect(box!.height).toBe(48);
  expect(boxes[0]!.y).toBe(boxes[1]!.y);
  expect(boxes[2]!.y).toBeGreaterThan(boxes[0]!.y + 48);
  expect(boxes[2]!.y).toBe(boxes[3]!.y);
  expect(boxes[3]!.y).toBe(boxes[4]!.y);
  await form.getByLabel("Min. price (AED)", { exact: true }).fill("1000.25");
  await form.getByLabel("Max. price (AED)", { exact: true }).fill("200000.50");
  await form.getByLabel("Minimum bedrooms", { exact: true }).selectOption("2");
  await form.getByRole("button", { name: "Apply filters" }).click();
  await expect(page).toHaveURL(/minPriceFils=100025/);
  const query = new URL(page.url()).searchParams;
  expect(query.get("maxPriceFils")).toBe("20000050");
  expect(query.get("minBedrooms")).toBe("2");
  expect(query.get("purpose")).toBe("rent");
  expect(query.get("sort")).toBe("price_desc");
  expect(query.get("page")).toBe("1");
  await page.getByLabel("Sort by", { exact: true }).selectOption("price_asc");
  await expect(page).toHaveURL(/sort=price_asc/);
  const sorted = new URL(page.url()).searchParams;
  expect(sorted.get("minPriceFils")).toBe("100025");
  expect(sorted.get("maxPriceFils")).toBe("20000050");
  expect(sorted.get("minBedrooms")).toBe("2");
  expect(sorted.get("purpose")).toBe("rent");
  expect(sorted.get("page")).toBe("1");
  await page.goBack();
  await expect(page).toHaveURL(/sort=price_desc/);
});

test("listing cards stack and stay within narrow and zoom-equivalent viewports", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  for (const width of [320, 390, 640, 768, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/properties?purpose=sale&pageSize=2");
    const card = page.getByTestId("property-card").first();
    await expect(card).toBeVisible();
    const positions = await card.evaluate((element) => {
      const image = element.querySelector('[data-slot="property-image"]')!;
      const content = element.querySelector('[data-slot="card-content"]')!;
      return {
        image: image.getBoundingClientRect().toJSON(),
        content: content.getBoundingClientRect().toJSON(),
      };
    });
    if (width < 768)
      expect(positions.content.top).toBeGreaterThanOrEqual(
        positions.image.bottom,
      );
    else
      expect(positions.content.left).toBeGreaterThanOrEqual(
        positions.image.right,
      );
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    await expect(card.getByRole("link")).toBeVisible();
    if (width === 320)
      await capturePublicPage(page, testInfo.outputPath("listings-320.png"));
  }
});
