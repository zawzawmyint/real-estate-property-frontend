import { randomUUID } from "node:crypto";
import { expect, test, type Locator } from "@playwright/test";

const headers = { Origin: "http://localhost:3100" };

async function expectReadableText(locator: Locator, width: number) {
  await expect(locator).toBeVisible();
  const bounds = await locator.evaluate((element) => {
    const rectangle = element.getBoundingClientRect();

    return {
      left: rectangle.left,
      right: rectangle.right,
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
    };
  });

  expect.soft(bounds.left).toBeGreaterThanOrEqual(0);
  expect.soft(bounds.right).toBeLessThanOrEqual(width + 1);
  // Vertical line clamping on cards is intentional; clipped horizontal text is not.
  expect.soft(bounds.scrollWidth).toBeLessThanOrEqual(bounds.clientWidth + 1);
}

test("maximum-length property text stays readable on mobile and at zoom-equivalent width", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "desktop",
    "One fixture covers each explicit viewport.",
  );
  test.setTimeout(180_000);

  const password = process.env.STAFF_E2E_PASSWORD;

  if (!password) throw new Error("STAFF_E2E_PASSWORD is required");

  const signIn = await page.request.post("/api/v1/auth/sign-in/email", {
    headers,
    data: {
      // Navigation coverage deliberately consumes that account's sign-in budget.
      email: "e2e-property-desktop-manager@example.com",
      password,
      rememberMe: true,
    },
  });

  expect(signIn.status(), await signIn.text()).toBe(200);

  const suffix = randomUUID().replaceAll("-", "");
  const title = `FictionalLongContent${suffix}`.padEnd(160, "T");
  const community = `FictionalCommunity${suffix}`.padEnd(120, "C");
  const city = `FictionalCity${suffix}`.padEnd(120, "D");
  const location = `${community}, ${city}`;
  let propertyId: string | undefined;

  try {
    const collection = await page.request.get("/api/v1/properties?pageSize=1");

    expect(collection.status(), await collection.text()).toBe(200);

    const { items } = (await collection.json()) as {
      items: { coverPhoto: { url: string } }[];
    };

    expect(
      items.length,
      "The disposable fixture has seeded public photos",
    ).toBe(1);

    const seededProperty = items[0];

    if (!seededProperty)
      throw new Error("A seeded public property is required");

    const cover = await page.request.get(seededProperty.coverPhoto.url);

    expect(cover.status()).toBe(200);

    const photo = await cover.body();
    const created = await page.request.post("/api/v1/staff/properties", {
      headers,
      data: {
        title,
        purpose: "sale",
        type: "apartment",
        description:
          "Fictional browser-test home for long-content layout acceptance.",
        priceFils: 245000000,
        city,
        community,
        bedrooms: 2,
        bathrooms: 2,
        areaSqft: "1186.00",
        ownerName: "Fictional layout fixture",
        ownerPhone: "+971 50 123 4567",
      },
    });

    expect(created.status(), await created.text()).toBe(201);
    propertyId = ((await created.json()) as { id: string }).id;

    const uploaded = await page.request.post(
      `/api/v1/staff/properties/${propertyId}/photos`,
      { headers: { ...headers, "Content-Type": "image/webp" }, data: photo },
    );

    expect(uploaded.status(), await uploaded.text()).toBe(201);

    const published = await page.request.patch(
      `/api/v1/staff/properties/${propertyId}`,
      { headers, data: { publishingState: "published" } },
    );

    expect(published.status(), await published.text()).toBe(200);

    // 640 CSS px exercises the reflow equivalent of 200% zoom at 1280px.
    for (const width of [320, 390, 640]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/properties/${propertyId}`);
      await expectReadableText(
        page.getByRole("heading", { name: title, exact: true, level: 1 }),
        width,
      );
      await expectReadableText(
        page.locator("article").getByText(location, { exact: true }),
        width,
      );
      const inquiry = page.getByRole("complementary", {
        name: "Enquire about this property",
      });

      await expectReadableText(
        inquiry.getByText(title, { exact: true }),
        width,
      );
      await expectReadableText(
        inquiry.getByText(location, { exact: true }),
        width,
      );
      await expect(
        inquiry.getByRole("button", { name: "Send inquiry", exact: true }),
      ).toBeEnabled();
      expect
        .soft(await page.evaluate(() => document.documentElement.scrollWidth))
        .toBeLessThanOrEqual(width + 1);
      await page.screenshot({
        caret: "initial",
        path: testInfo.outputPath(`long-property-detail-${width}.png`),
        fullPage: true,
      });

      await page.goto(
        `/properties?purpose=sale&location=${encodeURIComponent(community)}`,
      );
      const card = page.getByTestId("property-card").filter({
        has: page.getByRole("heading", { name: title, exact: true }),
      });

      await expect(card).toHaveCount(1);
      await expectReadableText(
        card.getByRole("heading", { name: title, exact: true }),
        width,
      );
      await expectReadableText(
        card.getByText(location, { exact: true }),
        width,
      );
      await expect(
        card.getByRole("link", { name: `View ${title}`, exact: true }),
      ).toBeVisible();
      expect
        .soft(await page.evaluate(() => document.documentElement.scrollWidth))
        .toBeLessThanOrEqual(width + 1);
      await page.screenshot({
        caret: "initial",
        path: testInfo.outputPath(`long-property-card-${width}.png`),
        fullPage: true,
      });
    }
  } finally {
    if (propertyId) {
      // Manager cannot hard-delete; archive removes this record from the public
      // catalog, and the run's disposable database owns final fixture disposal.
      const archived = await page.request.patch(
        `/api/v1/staff/properties/${propertyId}`,
        { headers, data: { publishingState: "archived" } },
      );

      expect(archived.status(), await archived.text()).toBe(200);
      const unavailable = await page.request.get(
        `/api/v1/properties/${propertyId}`,
      );

      expect(unavailable.status()).toBe(404);
    }
  }
});
