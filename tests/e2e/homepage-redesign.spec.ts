import { expect, test, type Page } from "@playwright/test";
import { capturePublicPage } from "../fixtures/public-capture";

const control = "http://127.0.0.1:4312/_e2e/rules";
const featuredQuery = { featured: "true", pageSize: "3", sort: "newest" };

async function featuredRule(
  page: Page,
  outcome: { featuredCount: number } | { status: 503 },
) {
  const response = await page.request.post(control, {
    data: {
      method: "GET",
      path: "/api/v1/properties",
      query: featuredQuery,
      ...outcome,
    },
  });
  expect(response.status(), await response.text()).toBe(201);
  const { id } = (await response.json()) as { id: string };
  expect((await page.request.post(`${control}/${id}/release`)).ok()).toBe(true);
  return async () => {
    await page.request.delete(`${control}/${id}`);
  };
}

test("desktop arrival exposes the complete search in the first viewport", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Find your place in Dubai.",
  );
  const form = page.getByRole("form", { name: "Find a property" });
  const controls = [
    form.getByText("Buy", { exact: true }),
    form.getByText("Rent", { exact: true }),
    form.getByLabel("Location", { exact: true }),
    form.getByLabel("Property type", { exact: true }),
    form.getByLabel("Min. price (AED)", { exact: true }),
    form.getByLabel("Max. price (AED)", { exact: true }),
    form.getByRole("button", { name: "Search properties", exact: true }),
  ];
  for (const element of controls) {
    await expect(element).toBeVisible();
    const bounds = await element.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.y).toBeGreaterThanOrEqual(0);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(900);
  }
  await page.screenshot({
    path: testInfo.outputPath("home-first-viewport.png"),
  });
  await capturePublicPage(page, testInfo.outputPath("home-full-1440.png"));
});

test("mobile arrival stacks copy, photo and search with an editable Budget group", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const heading = page.getByRole("heading", { level: 1 });
  const heroPhoto = page.getByRole("main").locator('img[src$="/hero.webp"]');
  const form = page.getByRole("form", { name: "Find a property" });
  const copyBounds = await heading.boundingBox();
  const photoBounds = await heroPhoto.boundingBox();
  const formBounds = await form.boundingBox();
  expect(copyBounds).not.toBeNull();
  expect(photoBounds).not.toBeNull();
  expect(formBounds).not.toBeNull();
  expect(copyBounds!.y + copyBounds!.height).toBeLessThanOrEqual(
    photoBounds!.y,
  );
  expect(photoBounds!.y + photoBounds!.height).toBeLessThanOrEqual(
    formBounds!.y,
  );

  const budget = form.getByRole("group", { name: "Budget (AED)", exact: true });
  const minimum = budget.getByLabel("Min. price (AED)", { exact: true });
  const maximum = budget.getByLabel("Max. price (AED)", { exact: true });
  await minimum.fill("2500.25");
  await maximum.fill("5000.50");
  await expect(minimum).toHaveValue("2500.25");
  await expect(maximum).toHaveValue("5000.50");
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await capturePublicPage(page, testInfo.outputPath("home-full-390.png"));
});

for (const [label, purpose] of [
  ["Buy", "sale"],
  ["Rent", "rent"],
] as const) {
  test(`${label} search preserves location, type and independent AED price bounds`, async ({
    page,
  }) => {
    await page.goto("/");
    const form = page.getByRole("form", { name: "Find a property" });
    await expect(
      form.getByRole("radio", { name: "Buy", exact: true }),
    ).toBeChecked();
    await form.getByText(label, { exact: true }).click();
    await form.getByLabel("Location", { exact: true }).fill("Dubai Marina");
    await form
      .getByLabel("Property type", { exact: true })
      .selectOption("apartment");
    await form.getByLabel("Min. price (AED)", { exact: true }).fill("1000.25");
    await form
      .getByLabel("Max. price (AED)", { exact: true })
      .fill("2500000.50");
    await expect(form).toContainText(
      "Buy prices are total. Rent prices are per year.",
    );
    await form
      .getByRole("button", { name: "Search properties", exact: true })
      .click();
    await expect(page).toHaveURL(/\/properties\?/);
    const query = new URL(page.url()).searchParams;
    expect(query.get("purpose")).toBe(purpose);
    expect(query.get("location")).toBe("Dubai Marina");
    expect(query.get("type")).toBe("apartment");
    expect(query.get("minPriceFils")).toBe("100025");
    expect(query.get("maxPriceFils")).toBe("250000050");
    expect(query.get("page") ?? "1").toBe("1");
    await expect(
      page.getByRole("heading", { name: "Homes to make your own." }),
    ).toBeVisible();
  });
}

test("type and community shortcuts open sale-filtered existing results", async ({
  page,
}) => {
  const shortcuts = [
    ["A home for every way of living", "Apartments", "type", "apartment"],
    ["A home for every way of living", "Villas", "type", "villa"],
    ["A home for every way of living", "Townhouses", "type", "townhouse"],
    ["A home for every way of living", "Penthouses", "type", "penthouse"],
    [
      "Explore Dubai, neighbourhood by neighbourhood.",
      "Dubai Marina",
      "location",
      "Dubai Marina",
    ],
    [
      "Explore Dubai, neighbourhood by neighbourhood.",
      "Downtown Dubai",
      "location",
      "Downtown Dubai",
    ],
    [
      "Explore Dubai, neighbourhood by neighbourhood.",
      "Palm Jumeirah",
      "location",
      "Palm Jumeirah",
    ],
  ] as const;
  test.setTimeout(60_000);
  for (const [regionName, label, key, value] of shortcuts) {
    await page.goto("/");
    const region = page.getByRole("region", { name: regionName, exact: true });
    await expect(region).toContainText(/sale/i);
    const link = region.getByRole("link", { name: new RegExp(label, "i") });
    await link.click();
    await expect(page).toHaveURL(/\/properties\?/);
    const url = new URL(page.url());
    expect(url.pathname).toBe("/properties");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      purpose: "sale",
      [key]: value,
    });
    await expect(
      page.getByRole("heading", { name: "Homes to make your own." }),
    ).toBeVisible();
  }
});

test("public header and closing footer retain navigation across public routes", async ({
  page,
}, testInfo) => {
  const destinations = [
    ["Buy", "/properties?purpose=sale"],
    ["Rent", "/properties?purpose=rent"],
    ["Our agents", "/agents"],
    ["Contact", "/contact"],
  ] as const;
  for (const route of ["/", "/properties", "/agents", "/contact"]) {
    await page.goto(route);
    const header = page.getByRole("banner");
    if (testInfo.project.name === "desktop") {
      for (const [name, href] of destinations)
        await expect(
          header.getByRole("link", { name, exact: true }),
        ).toHaveAttribute("href", href);
    }
    const footer = page.getByRole("contentinfo");
    await expect(
      footer.getByText("Let’s find your next chapter.", { exact: true }),
    ).toBeVisible();
    for (const [name, href] of destinations)
      await expect(
        footer.getByRole("link", { name, exact: true }),
      ).toHaveAttribute("href", href);
    await expect(
      footer.getByRole("link", { name: "Staff sign-in", exact: true }),
    ).toHaveAttribute("href", "/login");
    await expect(
      footer.getByRole("link", { name: "Contact us", exact: true }),
    ).toHaveAttribute("href", "/contact");
    await expect(footer).toContainText(String(new Date().getFullYear()));
  }
});

test("decorative photo failures retain readable search and community navigation", async ({
  page,
}) => {
  await page.route("**/images/homepage/**", (route) => route.abort());
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Find your place in Dubai.",
  );
  await expect(
    page.getByRole("button", { name: "Search properties", exact: true }),
  ).toBeEnabled();
  await page
    .getByRole("region", {
      name: "Explore Dubai, neighbourhood by neighbourhood.",
      exact: true,
    })
    .getByRole("link", { name: /homes for sale in Dubai Marina/i })
    .click();
  await expect(page).toHaveURL(/\/properties\?/);
  expect(Object.fromEntries(new URL(page.url()).searchParams)).toEqual({
    purpose: "sale",
    location: "Dubai Marina",
  });
});

test.describe("controlled featured collection", () => {
  test.describe.configure({ mode: "serial" });
  test.beforeEach(({}, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop" || testInfo.config.workers !== 1,
      "Shared featured controls require the documented single-worker run.",
    );
  });

  test("pending featured homes reserve the collection geometry until real cards arrive", async ({
    page,
  }) => {
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      const response = await page.request.post(control, {
        data: {
          method: "GET",
          path: "/api/v1/properties",
          query: featuredQuery,
        },
      });
      expect(response.status()).toBe(201);
      const { id } = (await response.json()) as { id: string };
      try {
        await page.goto("/", { waitUntil: "commit" });
        const loading = page.getByRole("status", {
          name: "Loading properties",
          exact: true,
        });
        await expect(loading).toBeVisible();
        await page.evaluate(() => document.fonts.ready);
        const featured = page.getByRole("region", {
          name: "Homes worth discovering.",
          exact: true,
        });
        const before = await featured.evaluate((element) => {
          const rect = element.getBoundingClientRect();
          return { top: rect.top + scrollY, height: rect.height };
        });
        const leadSkeleton = loading.locator(".home-property-photo").first();
        await expect(leadSkeleton).toBeVisible();
        expect((await leadSkeleton.boundingBox())!.height).toBeGreaterThan(100);
        await expect(
          page.getByRole("button", { name: "Search properties", exact: true }),
        ).toBeEnabled();
        expect(before.height).toBeGreaterThan(500);
        expect((await page.request.post(`${control}/${id}/release`)).ok()).toBe(
          true,
        );
        await expect(loading).toHaveCount(0);
        await expect(featured.getByTestId("property-card")).toHaveCount(3);
        const after = await featured.evaluate((element) => {
          const rect = element.getBoundingClientRect();
          return { top: rect.top + scrollY, height: rect.height };
        });
        expect(
          Math.abs(after.top - before.top),
          `${width}px collection start`,
        ).toBeLessThanOrEqual(1);
        // Text lengths vary, but loading must reserve nearly the whole collection.
        expect(
          before.height,
          `${width}px reserved height`,
        ).toBeGreaterThanOrEqual(after.height * 0.9);
        expect(
          Math.abs(after.height - before.height),
          `${width}px loading reflow`,
        ).toBeLessThanOrEqual(120);
      } finally {
        await page.request.delete(`${control}/${id}`);
      }
    }
  });

  for (const count of [0, 1, 2, 3]) {
    test(`${count} featured homes render real unique records without overflow`, async ({
      page,
    }, testInfo) => {
      const response = await page.request.get(
        "/api/v1/properties?featured=true&pageSize=3&sort=newest",
      );
      expect(response.ok()).toBe(true);
      const collection = (await response.json()) as {
        items: { id: string; title: string }[];
      };
      expect(collection.items).toHaveLength(3);
      const dispose = await featuredRule(page, { featuredCount: count });
      try {
        await page.goto("/");
        const cards = page.getByTestId("property-card");
        if (count === 0) {
          await expect(
            page.getByRole("heading", {
              name: "No featured homes right now.",
              exact: true,
            }),
          ).toBeVisible();
        } else {
          await expect(
            page.getByRole("heading", {
              name: "Homes worth discovering.",
              exact: true,
            }),
          ).toBeVisible();
        }
        await expect(cards).toHaveCount(count);
        for (const property of collection.items.slice(0, count))
          await expect(
            cards.getByRole("link", {
              name: `View ${property.title}`,
              exact: true,
            }),
          ).toHaveAttribute("href", `/properties/${property.id}`);
        expect(
          await cards
            .getByRole("link")
            .evaluateAll(
              (links) =>
                new Set(links.map((link) => link.getAttribute("href"))).size,
            ),
        ).toBe(count);
        for (const width of [320, 390, 768, 1024, 1440]) {
          await page.setViewportSize({ width, height: 900 });
          const unusedSpace = await cards.evaluateAll((elements) =>
            elements.map((card) => {
              const details = card.querySelector('[data-slot="card-content"]')!;
              return Math.abs(
                card.getBoundingClientRect().bottom -
                  details.getBoundingClientRect().bottom,
              );
            }),
          );
          for (const space of unusedSpace)
            expect(space, `${count} homes at ${width}px`).toBeLessThanOrEqual(
              2,
            );
          expect(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
            `${count} homes at ${width}px`,
          ).toBe(true);
        }
        await page.screenshot({
          path: testInfo.outputPath(`featured-${count}.png`),
          fullPage: true,
        });
      } finally {
        await dispose();
      }
    });
  }

  test("featured failure retains the independent hero and usable search then retries", async ({
    page,
  }) => {
    const dispose = await featuredRule(page, { status: 503 });
    try {
      await page.goto("/");
      await expect(page.getByRole("main").getByRole("alert")).toContainText(
        "We couldn’t load featured homes.",
      );
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        "Find your place in Dubai.",
      );
      const heroImage = page.getByRole("main").locator("img").first();
      await expect
        .poll(() =>
          heroImage.evaluate(
            (image: HTMLImageElement) =>
              image.complete && image.naturalWidth > 0,
          ),
        )
        .toBe(true);
      await expect(
        page.getByRole("button", { name: "Search properties", exact: true }),
      ).toBeEnabled();
      await dispose();
      await page
        .getByRole("button", { name: "Try again", exact: true })
        .click();
      await expect(page.getByTestId("property-card")).toHaveCount(3);
      await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0);
    } finally {
      await dispose();
    }
  });
});
