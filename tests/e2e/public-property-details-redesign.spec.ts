import { randomUUID } from "node:crypto";
import { expect, test, type Locator } from "@playwright/test";

async function bounds(locator: Locator) {
  await expect(locator).toBeVisible();
  const rectangle = await locator.boundingBox();
  if (!rectangle) throw new Error("Expected a visible layout element");
  return rectangle;
}

for (const purpose of ["sale", "rent"]) {
  test(`${purpose} details expose supported facts and photo overlays without a nested inquiry scrollbar`, async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop",
      "Explicit viewport coverage.",
    );
    const listed = await page.request.get(
      `/api/v1/properties?purpose=${purpose}&pageSize=1`,
    );
    expect(listed.ok()).toBe(true);
    const { items } = await listed.json();
    const response = await page.request.get(
      `/api/v1/properties/${items[0].id}`,
    );
    expect(response.ok()).toBe(true);
    const property = await response.json();
    await page.goto(`/properties/${property.id}`);
    const gallery = page.getByRole("region", { name: "Property photos" });
    await expect(
      gallery.getByText(purpose === "rent" ? "For rent" : "For sale", {
        exact: true,
      }),
    ).toBeVisible();
    const photos = gallery.getByRole("button", { name: /View all .*photos?/ });
    await expect(photos.locator('[data-icon="camera"]')).toBeVisible();
    await expect(photos).toHaveCSS("color", "rgb(250, 248, 245)");
    const details = page.getByRole("region", {
      name: "Property details",
      exact: true,
    });
    await expect(details).toContainText(property.type);
    await expect(details).toContainText(
      `${property.community}, ${property.city}`,
    );
    await expect(details.locator("dt")).toHaveText([
      "Property type",
      "Bathrooms",
      "Location",
      "Property size",
      "Bedrooms",
    ]);
    await expect(details.locator("dd")).toHaveText([
      property.type,
      String(property.bathrooms),
      `${property.community}, ${property.city}`,
      `${Number(property.areaSqft).toLocaleString("en-AE", { maximumFractionDigits: 2 })} sqft`,
      property.bedrooms === 0 ? "Studio" : `${property.bedrooms} beds`,
    ]);
    await expect(details).not.toContainText("Furnishing");
    const about = page.getByRole("region", { name: "About this home" });
    expect((await bounds(details)).y).toBeGreaterThan((await bounds(about)).y);
    await expect(
      page.locator(".property-detail-facts [data-slot=icon]"),
    ).toHaveCount(3);
    const inquiry = page.getByRole("complementary", {
      name: "Enquire about this property",
    });
    for (const width of [1480, 390, 640]) {
      await page.setViewportSize({ width, height: 810 });
      const first = await bounds(details.locator("dl > div").nth(0));
      const second = await bounds(details.locator("dl > div").nth(1));
      if (width >= 640) {
        expect(Math.abs(first.y - second.y)).toBeLessThanOrEqual(1);
        expect(second.x).toBeGreaterThan(first.x + first.width);
      } else {
        expect(second.y).toBeGreaterThanOrEqual(first.y + first.height);
      }
      const size = await inquiry.evaluate((el) => ({
        client: el.clientHeight,
        scroll: el.scrollHeight,
        overflow: getComputedStyle(el).overflowY,
      }));
      expect(size.scroll).toBeLessThanOrEqual(size.client + 1);
      expect(size.overflow).toBe("visible");
      const submit = inquiry.getByRole("button", {
        name: "Send inquiry",
        exact: true,
      });
      await submit.scrollIntoViewIfNeeded();
      await expect(submit).toBeInViewport();
      expect(await inquiry.evaluate((el) => el.scrollTop)).toBe(0);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width + 1);
    }
  });
}

test("inquiry validation keeps errors linked to visible fields without submitting", async ({
  page,
}) => {
  const response = await page.request.get("/api/v1/properties?pageSize=1");
  expect(response.ok()).toBe(true);
  const { items } = (await response.json()) as { items: { id: string }[] };
  await page.goto(`/properties/${items[0]!.id}`);
  const inquiry = page.getByRole("complementary", {
    name: "Enquire about this property",
  });
  let writes = 0;
  page.on("request", (request) => {
    if (request.method() === "POST") writes++;
  });
  const submit = inquiry.getByRole("button", {
    name: "Send inquiry",
    exact: true,
  });
  await expect(submit).toBeEnabled();
  await submit.click();
  const summary = inquiry
    .getByRole("alert")
    .filter({ hasText: "Check the highlighted fields." });
  await expect(summary).toContainText("Check the highlighted fields.");
  await expect(inquiry.getByLabel("Name", { exact: true })).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await summary.getByRole("link", { name: "Enter a name." }).click();
  await expect(inquiry.getByLabel("Name", { exact: true })).toBeFocused();
  await expect(
    summary.getByRole("link", {
      name: "Enter a phone number or email address.",
    }),
  ).toBeVisible();
  expect(writes).toBe(0);
});

for (const status of [404, 429]) {
  test(`inquiry ${status} feedback preserves contact values and exposes the recovery action`, async ({
    page,
  }) => {
    const response = await page.request.get("/api/v1/properties?pageSize=1");
    expect(response.ok()).toBe(true);
    const { items } = (await response.json()) as { items: { id: string }[] };
    const propertyId = items[0]!.id;
    const name = `Fictional inquiry ${randomUUID()}`;
    const control = "http://127.0.0.1:4312/_e2e/rules";
    const registered = await page.request.post(control, {
      data: {
        method: "POST",
        path: `/api/v1/public/properties/${propertyId}/inquiries`,
        name,
        status,
      },
    });
    expect(registered.status(), await registered.text()).toBe(201);
    const { id } = (await registered.json()) as { id: string };
    try {
      const released = await page.request.post(`${control}/${id}/release`);
      expect(released.ok()).toBe(true);
      await page.goto(`/properties/${propertyId}`);
      const inquiry = page.getByRole("complementary", {
        name: "Enquire about this property",
      });
      await inquiry.getByLabel("Name", { exact: true }).fill(name);
      await inquiry
        .getByLabel("Email", { exact: true })
        .fill("fictional-gallery@example.com");
      await inquiry
        .getByLabel("Message (optional)", { exact: true })
        .fill("Fictional inquiry for status presentation coverage.");
      const submit = inquiry.getByRole("button", {
        name: "Send inquiry",
        exact: true,
      });
      await submit.click();
      const feedback = inquiry.getByRole("alert");
      if (status === 404) {
        await expect(feedback).toContainText(
          "This property is no longer accepting inquiries",
        );
        await expect(
          feedback.getByRole("link", { name: "Browse listings" }),
        ).toHaveAttribute("href", "/properties?purpose=sale");
        await expect(submit).toBeDisabled();
      } else {
        await expect(feedback).toContainText("Too many inquiries.");
        await expect(submit).toBeEnabled();
        await submit.click();
        await expect(feedback).toContainText("Please retry after");
        await expect(feedback).toContainText("Dubai time.");
      }
      await expect(inquiry.getByLabel("Name", { exact: true })).toHaveValue(
        name,
      );
      await expect(inquiry.getByLabel("Email", { exact: true })).toHaveValue(
        "fictional-gallery@example.com",
      );
      const hits = await page.request.get(`${control}/${id}`);
      expect((await hits.json()).hits).toBe(1);
      await feedback.scrollIntoViewIfNeeded();
      await expect(feedback).toBeInViewport();
    } finally {
      await page.request.delete(`${control}/${id}`);
    }
  });
}

test("detail composition gives the cover prominence and keeps inquiry controls reachable", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Explicit viewport coverage.");
  const response = await page.request.get("/api/v1/properties?pageSize=12");
  expect(response.ok()).toBe(true);
  const { items } = (await response.json()) as { items: { id: string }[] };
  expect(items.length).toBeGreaterThan(0);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`/properties/${items[0]!.id}`);

  const gallery = page.getByRole("region", { name: "Property photos" });
  const cover = await bounds(
    gallery.getByRole("button", { name: "Open cover photo" }),
  );
  const supporting = gallery.getByRole("button", {
    name: "Open photo 2",
    exact: true,
  });
  if (await supporting.count()) {
    const support = await bounds(supporting);
    expect(cover.width).toBeGreaterThan(support.width * 1.5);
    expect(support.x).toBeGreaterThan(cover.x + cover.width);
  }
  const title = page.getByRole("heading", { level: 1 });
  const heading = await bounds(title);
  expect(heading.y).toBeGreaterThan(cover.y + cover.height);
  const inquiry = page.getByRole("complementary", {
    name: "Enquire about this property",
  });
  const about = await bounds(
    page.getByRole("heading", { name: "About this home" }),
  );
  const card = await bounds(inquiry);
  expect(card.x).toBeGreaterThan(about.x + about.width);

  for (const width of [320, 390, 640, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(inquiry.getByLabel("Name", { exact: true })).toBeEnabled();
    const submit = inquiry.getByRole("button", {
      name: "Send inquiry",
      exact: true,
    });
    await submit.scrollIntoViewIfNeeded();
    const action = await bounds(submit);
    expect(action.height).toBeGreaterThanOrEqual(44);
    expect(action.y).toBeGreaterThanOrEqual(0);
    expect(action.y + action.height).toBeLessThanOrEqual(901);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width + 1);
    if (width < 1024) {
      const content = await bounds(page.locator("article"));
      const stacked = await bounds(inquiry);
      expect(stacked.y).toBeGreaterThanOrEqual(content.y + content.height);
    }
    await page.screenshot({
      path: testInfo.outputPath(`property-detail-${width}.png`),
      fullPage: true,
    });
  }
});

test("one through five real gallery photos reflow without blank slots and retain keyboard navigation", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "desktop",
    "One disposable fixture covers all photo counts.",
  );
  test.setTimeout(180_000);
  const password = process.env.STAFF_E2E_PASSWORD;
  if (!password) throw new Error("STAFF_E2E_PASSWORD is required");
  const headers = { Origin: "http://localhost:3100" };
  const signIn = await page.request.post("/api/v1/auth/sign-in/email", {
    headers,
    data: {
      email: "e2e-gallery-manager@example.com",
      password,
      rememberMe: true,
    },
  });
  expect(signIn.status(), await signIn.text()).toBe(200);
  const collection = await page.request.get("/api/v1/properties?pageSize=1");
  expect(collection.ok()).toBe(true);
  const { items } = (await collection.json()) as {
    items: { coverPhoto: { url: string } }[];
  };
  const photoResponse = await page.request.get(items[0]!.coverPhoto.url);
  expect(photoResponse.ok()).toBe(true);
  const photo = await photoResponse.body();
  const title = `Gallery fixture ${randomUUID()}`;
  const created = await page.request.post("/api/v1/staff/properties", {
    headers,
    data: {
      title,
      purpose: "sale",
      type: "apartment",
      description:
        "A fictional gallery fixture for responsive layout verification.",
      priceFils: 245000000,
      city: "Dubai",
      community: "Gallery layout fixture",
      bedrooms: 2,
      bathrooms: 2,
      areaSqft: "1186.00",
      ownerName: "Fictional layout fixture",
      ownerPhone: "+971 50 123 4567",
    },
  });
  expect(created.status(), await created.text()).toBe(201);
  const { id } = (await created.json()) as { id: string };
  try {
    for (const count of [1, 2, 3, 4, 5]) {
      const uploaded = await page.request.post(
        `/api/v1/staff/properties/${id}/photos`,
        {
          headers: { ...headers, "Content-Type": "image/webp" },
          data: photo,
        },
      );
      expect(uploaded.status(), await uploaded.text()).toBe(201);
      if (count === 1) {
        const published = await page.request.patch(
          `/api/v1/staff/properties/${id}`,
          {
            headers,
            data: { publishingState: "published" },
          },
        );
        expect(published.status(), await published.text()).toBe(200);
      }
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`/properties/${id}`);
      const gallery = page.getByRole("region", { name: "Property photos" });
      const tiles = gallery.getByRole("button", {
        name: /^Open (cover photo|photo \d+)$/,
      });
      await expect(tiles).toHaveCount(count);
      const cover = await bounds(tiles.first());
      for (let tileIndex = 1; tileIndex < count; tileIndex++) {
        const support = await bounds(tiles.nth(tileIndex));
        expect(cover.width).toBeGreaterThan(support.width * 1.5);
        expect(support.y).toBeGreaterThanOrEqual(cover.y);
        expect(support.y + support.height).toBeLessThanOrEqual(
          cover.y + cover.height + 1,
        );
      }
      await page.screenshot({
        path: testInfo.outputPath(`gallery-${count}-photos.png`),
        fullPage: true,
      });
      const last = tiles.last();
      await last.click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await expect(
        dialog.getByText(`${count} / ${count}`, { exact: true }),
      ).toBeVisible();
      if (count > 1) {
        await page.keyboard.press("ArrowRight");
        await expect(
          dialog.getByText(`1 / ${count}`, { exact: true }),
        ).toBeVisible();
        await page.keyboard.press("ArrowLeft");
        await expect(
          dialog.getByText(`${count} / ${count}`, { exact: true }),
        ).toBeVisible();
      } else {
        await expect(
          dialog.getByRole("button", { name: "Next photo" }),
        ).toBeDisabled();
      }
      await page.keyboard.press("Escape");
      await expect(dialog).toHaveCount(0);
      await expect(last).toBeFocused();
      await page.setViewportSize({ width: 390, height: 844 });
      const open = gallery.getByRole("button", {
        name: `View all ${count} ${count === 1 ? "photo" : "photos"}`,
      });
      await open.click();
      await expect(
        dialog.getByText(`1 / ${count}`, { exact: true }),
      ).toBeVisible();
      for (let tab = 0; tab < 5; tab++) {
        await page.keyboard.press("Tab");
        // The dialog's focus guards wrap focus on the next animation frame.
        await expect
          .poll(() =>
            dialog.evaluate((element) =>
              element.contains(document.activeElement),
            ),
          )
          .toBe(true);
      }
      await page.keyboard.press("Escape");
      await expect(open).toBeFocused();
    }
  } finally {
    const archived = await page.request.patch(
      `/api/v1/staff/properties/${id}`,
      {
        headers,
        data: { publishingState: "archived" },
      },
    );
    expect(archived.status(), await archived.text()).toBe(200);
  }
});
