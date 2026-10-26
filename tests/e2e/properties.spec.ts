import { randomUUID } from "node:crypto";
import { deflateSync } from "node:zlib";
import { expect, test, type Page, type Cookie } from "@playwright/test";

test.setTimeout(90_000);

const origin = "http://localhost:3100";
const headers = { Origin: origin };
const roleCookies = new Map<string, Cookie[]>();

// A real, generated PNG fixture: no external assets or production seed records.
function photoBuffer(targetSize?: number) {
  function chunk(type: string, bytes: Buffer) {
    const name = Buffer.from(type);
    const data = Buffer.concat([name, bytes]);
    let crc = 0xffffffff;

    for (const byte of data) {
      crc ^= byte;

      for (let bit = 0; bit < 8; bit++)
        crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }

    const size = Buffer.alloc(4);

    size.writeUInt32BE(bytes.length);

    const checksum = Buffer.alloc(4);

    checksum.writeUInt32BE((crc ^ 0xffffffff) >>> 0);

    return Buffer.concat([size, data, checksum]);
  }

  const ihdr = Buffer.alloc(13);

  ihdr.writeUInt32BE(96, 0);
  ihdr.writeUInt32BE(64, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;

  const pixels = Buffer.alloc(64 * (96 * 3 + 1));

  for (let y = 0; y < 64; y++)
    for (let x = 0; x < 96; x++) {
      const offset = y * 289 + 1 + x * 3;

      pixels[offset] = 112 + Math.floor(x / 2);
      pixels[offset + 1] = 70 + y;
      pixels[offset + 2] = 76 + Math.floor(x / 3);
    }

  const chunks = [
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(pixels)),
  ];
  const end = chunk("IEND", Buffer.alloc(0));

  if (targetSize) {
    const padding = targetSize - Buffer.concat(chunks).length - end.length - 12;

    if (padding < 0) throw new Error("PNG target size is too small");

    // Valid ancillary/private chunk before IEND, rather than trailing junk.
    chunks.push(chunk("npAd", Buffer.alloc(padding)));
  }

  return Buffer.concat([...chunks, end]);
}

async function holdBackend(
  page: Page,
  rule: {
    method: "GET" | "POST";
    path: string;
    query?: Record<string, string>;
    title?: string;
    status?: 503;
  },
) {
  const control = "http://127.0.0.1:4312/_e2e/rules";
  const registered = await page.request.post(control, { data: rule });

  expect(registered.status(), await registered.text()).toBe(201);

  const { id } = (await registered.json()) as { id: string };

  return {
    async hits() {
      const response = await page.request.get(`${control}/${id}`);

      expect(response.status()).toBe(200);

      return ((await response.json()) as { hits: number }).hits;
    },

    async release() {
      const response = await page.request.post(`${control}/${id}/release`);

      expect(response.status()).toBe(200);
    },

    async dispose() {
      // DELETE also releases in-flight requests when an assertion fails.
      await page.request.delete(`${control}/${id}`);
    },
  };
}

async function signIn(page: Page, role = "admin") {
  const cookies = roleCookies.get(role);

  if (cookies) {
    await page.context().addCookies(cookies);
    return;
  }

  const password = process.env.STAFF_E2E_PASSWORD;

  if (!password) throw new Error("STAFF_E2E_PASSWORD is required");

  const response = await page.request.post("/api/v1/auth/sign-in/email", {
    headers,
    data: {
      email: `e2e-property-${test.info().project.name}-${role}@example.com`,
      password,
      rememberMe: true,
    },
  });

  expect(response.status(), await response.text()).toBe(200);
  roleCookies.set(role, await page.context().cookies());
}

async function createProperty(page: Page, photoCount = 1) {
  const title = `E2E home ${randomUUID().slice(0, 8)}`;
  const response = await page.request.post("/api/v1/staff/properties", {
    headers,
    data: {
      title,
      purpose: "sale",
      type: "apartment",
      description: "A bright, carefully presented home with room to unwind.",
      priceFils: 245000000,
      city: "Dubai",
      community: title,
      bedrooms: 0,
      bathrooms: 1,
      areaSqft: "1186.00",
      ownerName: "Private owner E2E",
      ownerPhone: "+971 50 123 4567",
      featured: true,
    },
  });

  expect(response.status(), await response.text()).toBe(201);

  const property = (await response.json()) as { id: string; title: string };

  for (let index = 0; index < photoCount; index++) {
    const upload = await page.request.post(
      `/api/v1/staff/properties/${property.id}/photos`,
      {
        headers: { ...headers, "Content-Type": "image/png" },
        data: photoBuffer(),
      },
    );

    expect(upload.status(), await upload.text()).toBe(201);
  }

  return property;
}

async function patch(page: Page, id: string, data: object) {
  const result = await page.request.patch(`/api/v1/staff/properties/${id}`, {
    headers,
    data,
  });

  expect(result.status(), await result.text()).toBe(200);

  return result;
}

test("staff creates a draft in the real form and sees saved data after reload", async ({
  page,
}, testInfo) => {
  await signIn(page);
  await page.goto("/crm/properties/new");

  const title = `Form draft ${randomUUID().slice(0, 8)}`;
  const browserWrites: string[] = [];

  page.on("request", (request) => {
    if (
      new URL(request.url()).pathname.startsWith("/api/v1/staff/properties") &&
      ["POST", "PATCH", "DELETE"].includes(request.method())
    )
      browserWrites.push(`${request.method()} ${request.url()}`);
  });
  await page.getByLabel("Title", { exact: true }).fill(title);

  const createAction = page.waitForRequest(
    (request) =>
      request.method() === "POST" && Boolean(request.headers()["next-action"]),
  );

  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  expect(new URL((await createAction).url()).pathname).toBe(
    "/crm/properties/new",
  );
  await expect(page).toHaveURL(/\/crm\/properties\/[\w-]+\/edit$/);
  await expect(page.getByLabel("Title", { exact: true })).toHaveValue(title);
  await page.reload();
  await expect(page.getByLabel("Title", { exact: true })).toHaveValue(title);
  await page
    .getByLabel("Property type", { exact: true })
    .selectOption("apartment");
  await page
    .getByLabel("Description", { exact: true })
    .fill("A bright fictional home for the property form browser test.");
  await page.getByLabel("Price (AED)", { exact: true }).fill("1234567.89");
  await page.getByLabel("City", { exact: true }).fill("Dubai");
  await page
    .getByLabel("Community", { exact: true })
    .fill("Browser test community");
  await page.getByLabel("Bedrooms", { exact: true }).fill("0");
  await page.getByLabel("Bathrooms", { exact: true }).fill("1");
  await page.getByLabel("Area (sqft)", { exact: true }).fill("745.25");
  await page
    .getByLabel("Owner name", { exact: true })
    .fill("Private form owner");
  await page
    .getByLabel("Owner phone", { exact: true })
    .fill("+971 50 123 4567");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.getByText("Changes saved.", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Add photos", { exact: true })).toBeEnabled();
  await page.getByLabel("Add photos", { exact: true }).setInputFiles({
    name: "demo.png",
    mimeType: "image/png",
    buffer: photoBuffer(),
  });

  const id = page.url().split("/").at(-2)!;

  await expect
    .poll(
      async () =>
        (
          (
            await (
              await page.request.get(`/api/v1/staff/properties/${id}`)
            ).json()
          ).photos as unknown[]
        ).length,
    )
    .toBe(1);
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(
    page.getByText("Property published.", { exact: true }),
  ).toBeVisible();
  await expect(page.locator("form").first()).toHaveAttribute(
    "aria-busy",
    "false",
  );
  await expect
    .poll(async () =>
      (await page.request.get(`/api/v1/properties/${id}`)).status(),
    )
    .toBe(200);

  const saved = await (
    await page.request.get(`/api/v1/properties/${id}`)
  ).json();

  expect(saved.priceFils).toBe(123456789);
  expect(saved.areaSqft).toBe("745.25");
  expect(saved.bedrooms).toBe(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("property-draft.png"),
    fullPage: true,
  });
  expect(browserWrites).toEqual([]);
});

test("publishing exposes only public data and archive removes fresh URLs with real 404", async ({
  page,
}, testInfo) => {
  await signIn(page);

  const property = await createProperty(page, 2);
  let response = await page.request.get(`/api/v1/properties/${property.id}`);

  expect(response.status()).toBe(404);
  await page.goto(`/crm/properties/${property.id}/edit`);
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(
    page.getByText("Property published.", { exact: true }),
  ).toBeVisible();
  await expect(page.locator("form").first()).toHaveAttribute(
    "aria-busy",
    "false",
  );
  await expect
    .poll(async () =>
      (await page.request.get(`/api/v1/properties/${property.id}`)).status(),
    )
    .toBe(200);
  response = await page.request.get(`/api/v1/properties/${property.id}`);

  const publicData = await response.json();

  expect(publicData).not.toHaveProperty("ownerName");
  expect(publicData).not.toHaveProperty("ownerPhone");
  expect(publicData).not.toHaveProperty("publishingState");
  expect(publicData).not.toHaveProperty("featured");

  const navigation = await page.goto(`/properties/${property.id}`);

  expect(navigation?.status()).toBe(200);
  await expect(
    page.getByRole("heading", { name: property.title, exact: true }),
  ).toBeVisible();
  expect(await page.content()).not.toContain("Private owner E2E");
  expect(await page.content()).not.toContain("+971 50 123 4567");

  const image = page.getByRole("main").locator("img").first();

  await expect
    .poll(() =>
      image.evaluate(
        (element: HTMLImageElement) =>
          element.complete && element.naturalWidth > 0,
      ),
    )
    .toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("property-detail.png"),
    fullPage: true,
  });
  await page.goto(`/crm/properties/${property.id}/edit`);
  await page.getByRole("button", { name: "Archive", exact: true }).click();
  await expect
    .poll(async () =>
      (await page.request.get(`/api/v1/properties/${property.id}`)).status(),
    )
    .toBe(404);

  const archived = await page.goto(`/properties/${property.id}`);

  expect(archived?.status()).toBe(404);
  await expect(page.getByRole("link", { name: "Return home" })).toBeVisible();
  await patch(page, property.id, { publishingState: "draft" });
  await patch(page, property.id, { publishingState: "published" });
  await patch(page, property.id, { availability: "sold" });
  expect(
    (await page.request.get(`/api/v1/properties/${property.id}`)).status(),
  ).toBe(404);
  await patch(page, property.id, { publishingState: "archived" });
  expect(
    (
      await page.request.delete(`/api/v1/staff/properties/${property.id}`, {
        headers,
      })
    ).status(),
  ).toBe(204);
});

for (const role of ["admin", "manager"]) {
  test(`${role} uses separate CRM details, edit and public listing pages`, async ({
    page,
  }, testInfo) => {
    await signIn(page, role);
    const property = await createProperty(page);
    await patch(page, property.id, { publishingState: "published" });
    await page.goto(`/crm/properties?q=${encodeURIComponent(property.title)}`);
    await page
      .getByRole("link", { name: "View details", exact: true })
      .filter({ visible: true })
      .click();
    await expect(page).toHaveURL(`${origin}/crm/properties/${property.id}`);
    await expect(
      page.getByRole("heading", {
        name: "Property details",
        exact: true,
        level: 1,
      }),
    ).toBeVisible();
    await expect(page.getByRole("main")).toContainText("Private owner E2E");
    await expect(
      page.getByRole("main").locator("input, textarea, select"),
    ).toHaveCount(0);
    await expect(page.getByRole("main")).toContainText("Studio");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath("crm-property-details.png"),
      fullPage: true,
    });
    await page
      .getByRole("link", { name: "Edit property", exact: true })
      .click();
    await expect(page).toHaveURL(
      `${origin}/crm/properties/${property.id}/edit`,
    );
    await expect(page.getByLabel("Title", { exact: true })).toHaveValue(
      property.title,
    );
    await page
      .getByRole("link", { name: "Back to details", exact: true })
      .click();
    await page
      .getByRole("link", { name: "View public listing", exact: true })
      .click();
    await expect(page).toHaveURL(`${origin}/properties/${property.id}`);
    await expect(
      page.getByRole("heading", { name: property.title, exact: true }),
    ).toBeVisible();
    expect(await page.content()).not.toContain("Private owner E2E");
  });
}

test("CRM property details require a session and missing properties return 404", async ({
  page,
}) => {
  const missing = randomUUID();
  await page.goto(`/crm/properties/${missing}`);
  await expect(page).toHaveURL(/\/login$/);
  await signIn(page);
  expect(
    (await page.request.get(`/api/v1/staff/properties/${missing}`)).status(),
  ).toBe(404);
  await page.goto(`/crm/properties/${missing}`);
  await expect(
    page.getByRole("heading", {
      name: "This page couldn’t be found",
      exact: true,
    }),
  ).toBeVisible();
});

test("Agent sees read-only property details without owner contacts and cannot mutate", async ({
  page,
}) => {
  await signIn(page);

  const property = await createProperty(page);

  await signIn(page, "agent");

  const detail = await page.request.get(
    `/api/v1/staff/properties/${property.id}`,
  );

  expect(detail.status()).toBe(200);

  const data = await detail.json();

  expect(data).not.toHaveProperty("ownerName");
  expect(data).not.toHaveProperty("ownerPhone");
  await page.goto(`/crm/properties/${property.id}/edit`);
  await expect(page).toHaveURL(`${origin}/crm/properties/${property.id}`);
  await expect(
    page.getByRole("heading", {
      name: "Property details",
      exact: true,
      level: 1,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Edit property", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Publish", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByLabel("Owner name", { exact: true })).toHaveCount(0);
  expect(await page.content()).not.toContain("Private owner E2E");
  expect(
    (
      await page.request.patch(`/api/v1/staff/properties/${property.id}`, {
        headers,
        data: { title: "Forbidden edit" },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await page.request.post(
        `/api/v1/staff/properties/${property.id}/photos`,
        {
          headers: { ...headers, "Content-Type": "image/png" },
          data: photoBuffer(),
        },
      )
    ).status(),
  ).toBe(403);
});

test("Manager archives and restores while only Admin can confirm permanent deletion", async ({
  page,
}) => {
  await signIn(page, "manager");

  const property = await createProperty(page);

  await page.goto(`/crm/properties/${property.id}/edit`);
  await page
    .getByLabel("Description", { exact: true })
    .fill("An unsaved description stays editable.");
  await page.getByRole("button", { name: "Archive", exact: true }).click();
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "Save your changes before changing" }),
  ).toBeVisible();
  await expect(page.getByLabel("Description", { exact: true })).toHaveValue(
    "An unsaved description stays editable.",
  );
  expect(
    (
      await (
        await page.request.get(`/api/v1/staff/properties/${property.id}`)
      ).json()
    ).publishingState,
  ).toBe("draft");
  await page.reload();
  await page.getByRole("button", { name: "Archive", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Restore to draft", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByRole("button", { name: "Delete property", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Restore to draft", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Archive", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Archive", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Restore to draft", exact: true }),
  ).toBeEnabled();
  await signIn(page);
  await page.reload();
  await page
    .getByRole("button", { name: "Delete property", exact: true })
    .click();

  const confirmation = page.getByRole("alertdialog");

  await expect(confirmation).toContainText(property.title);
  let releaseDelete!: () => void;
  const deleteHeld = new Promise<void>((resolve) => {
    releaseDelete = resolve;
  });
  await page.route(`**/crm/properties/${property.id}/edit`, async (route) => {
    if (
      route.request().method() === "POST" &&
      route.request().headers()["next-action"]
    )
      await deleteHeld;
    await route.continue();
  });
  try {
    await confirmation
      .getByRole("button", { name: "Permanently delete", exact: true })
      .click();
    const deleting = confirmation.getByRole("button", {
      name: "Deleting property…",
      exact: true,
    });
    await expect(deleting).toBeDisabled();
    await expect(deleting).toHaveAttribute("aria-busy", "true");
    await expect(deleting.locator('[data-slot="spinner"]')).toBeVisible();
    await expect(confirmation.getByRole("status")).toHaveText(
      "Deleting property…",
    );
  } finally {
    releaseDelete();
  }
  await expect(page).toHaveURL(/\/crm\/properties$/);
  expect(
    (
      await page.request.get(`/api/v1/staff/properties/${property.id}`)
    ).status(),
  ).toBe(404);
});

test("public filtered listings survive reload and gallery works by keyboard", async ({
  page,
}, testInfo) => {
  await signIn(page);

  const property = await createProperty(page, 12);

  await patch(page, property.id, { publishingState: "published" });

  const url = `/properties?purpose=sale&location=${encodeURIComponent(property.title)}&minBedrooms=0&sort=price_asc`;

  await page.goto(url);
  await expect(
    page.getByRole("link", { name: `View ${property.title}`, exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("link", { name: `View ${property.title}`, exact: true }),
  ).toBeVisible();
  expect(await page.content()).not.toContain("Private owner E2E");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("property-listings.png"),
    fullPage: true,
  });
  await page
    .getByRole("link", { name: `View ${property.title}`, exact: true })
    .click();

  const openGallery = page.getByRole("button", { name: /view all.*photos/i });

  await openGallery.click();

  const dialog = page.getByRole("dialog");

  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: /next/i }).click();
  await expect(dialog).toContainText(/2\s*(of|\/)\s*12/i);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(openGallery).toBeFocused();
});

test("pending action draft save prevents duplicate writes and retains input on service error", async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await signIn(page);
  await page.goto("/crm/properties/new");

  const title = `Preserve draft ${randomUUID()}`;

  await page.getByLabel("Title", { exact: true }).fill(title);

  const backend = await holdBackend(page, {
    method: "POST",
    path: "/api/v1/staff/properties",
    title,
    status: 503,
  });
  let actions = 0;
  let directWrites = 0;

  page.on("request", (request) => {
    if (request.method() !== "POST") return;
    if (request.headers()["next-action"]) actions++;
    if (new URL(request.url()).pathname === "/api/v1/staff/properties")
      directWrites++;
  });

  try {
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await expect.poll(() => backend.hits()).toBe(1);
    const saving = page.getByRole("button", { name: "Saving…", exact: true });

    await expect(saving).toBeDisabled();
    await expect(saving.locator('[data-slot="spinner"]')).toBeVisible();
    await expect(saving.locator('[data-slot="spinner"]')).toHaveCSS(
      "animation-name",
      "none",
    );
    await page.screenshot({
      path: testInfo.outputPath("crm-saving-spinner.png"),
      fullPage: true,
    });
    await page.getByLabel("Title", { exact: true }).press("Enter");
    await backend.release();
    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: "The property service is unavailable." }),
    ).toBeVisible();
    await expect(page.getByLabel("Title", { exact: true })).toHaveValue(title);
    await expect(page).toHaveURL(/\/crm\/properties\/new$/);
    expect(await backend.hits()).toBe(1);
    expect(actions).toBe(1);
    expect(directWrites).toBe(0);
  } finally {
    await backend.dispose();
  }
});

test("CRM property controls retain visible labels and centered select chevrons", async ({
  page,
}, testInfo) => {
  await signIn(page);
  await page.goto("/crm/properties");
  const addProperty = page.getByRole("link", {
    name: "Add property",
    exact: true,
  });
  const search = page.getByRole("button", { name: "Search", exact: true });
  const clear = page.getByRole("link", {
    name: "Clear filters",
    exact: true,
  });
  const sort = page.getByLabel("Sort by", { exact: true });
  const chevron = sort
    .locator("xpath=..")
    .locator('[data-slot="select-chevron"]');

  await expect(addProperty).toHaveText("Add property");
  await expect(addProperty).toHaveAttribute("href", "/crm/properties/new");
  await expect(
    page.getByRole("button", { name: "Add property", exact: true }),
  ).toHaveCount(0);
  await expect(search).toHaveText("Search");
  await expect(clear).toHaveText("Clear filters");
  await expect(chevron.locator('[data-icon="chevron-down"]')).toBeVisible();
  const [selectBox, chevronBox] = await Promise.all([
    sort.boundingBox(),
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
  await page.screenshot({
    path: testInfo.outputPath("crm-action-clarity.png"),
    fullPage: true,
    caret: "initial",
  });
});

test("authenticated inventory streams heading and filters before results and resets loading on filter navigation", async ({
  page,
}) => {
  await signIn(page);

  const property = await createProperty(page, 0);
  const initial = await holdBackend(page, {
    method: "GET",
    path: "/api/v1/staff/properties",
    query: { q: property.title, publishingState: "draft" },
  });

  try {
    await page.goto(
      `/crm/properties?q=${encodeURIComponent(property.title)}&publishingState=draft`,
      { waitUntil: "commit" },
    );
    await expect.poll(() => initial.hits()).toBe(1);
    await expect(
      page.getByRole("heading", { name: "Properties", exact: true }),
    ).toBeVisible();
    await expect(page.getByLabel("Search inventory")).toBeVisible();
    await expect(page.locator('a[href="/crm/properties/new"]')).toBeVisible();
    const initialLoading = page.getByRole("status", {
      name: "Loading inventory",
    });

    await expect(initialLoading).toBeVisible();
    await expect(
      initialLoading.locator('[data-slot="building-loader"]'),
    ).toHaveCount(1);
    await expect(
      page.getByRole("link", { name: property.title, exact: true }),
    ).toHaveCount(0);
    await initial.release();
    await expect(
      page.getByRole("status", { name: "Loading inventory" }),
    ).toHaveCount(0);
    await expect(
      page
        .getByRole("link", { name: property.title, exact: true })
        .filter({ visible: true }),
    ).toBeVisible();
    await expect(
      page.getByText("1 property matching your filters", { exact: true }),
    ).toBeVisible();
  } finally {
    await initial.dispose();
  }

  const filtered = await holdBackend(page, {
    method: "GET",
    path: "/api/v1/staff/properties",
    query: { q: property.title, publishingState: "published" },
  });

  try {
    await page
      .getByLabel("Publishing state", { exact: true })
      .selectOption("published");
    await page.getByRole("button", { name: "Search", exact: true }).click();
    const searching = page.getByRole("button", {
      name: "Searching…",
      exact: true,
    });
    await expect(searching).toBeDisabled();
    await expect(searching.locator('[data-slot="spinner"]')).toBeVisible();
    // Navigation replaces the filter component, so its local pending button
    // can disappear before the held server read completes. Check Suspense.
    await expect.poll(() => filtered.hits()).toBe(1);
    await expect(
      page.getByRole("status", { name: "Loading inventory" }),
    ).toBeVisible();
    await expect(page.getByLabel("Search inventory")).toHaveValue(
      property.title,
    );
    await expect(
      page.getByRole("heading", { name: "Properties", exact: true }),
    ).toBeVisible();
    await filtered.release();
    await expect(
      page.getByRole("status", { name: "Loading inventory" }),
    ).toHaveCount(0);
    await expect(
      page.getByText("No matching properties", { exact: true }),
    ).toBeVisible();
    await expect(page).toHaveURL(/publishingState=published/);
    await expect(page).toHaveURL(/page=1/);
    await page.reload();
    await expect(
      page.getByLabel("Publishing state", { exact: true }),
    ).toHaveValue("published");
    await expect(
      page.getByText("No matching properties", { exact: true }),
    ).toBeVisible();
  } finally {
    await filtered.dispose();
  }
});

test("CRM retry recovers a failed server read after the backend returns", async ({
  page,
}) => {
  await signIn(page);
  const property = await createProperty(page, 0);
  const outage = await holdBackend(page, {
    method: "GET",
    path: "/api/v1/staff/properties",
    query: { q: property.title },
    status: 503,
  });

  try {
    await outage.release();
    await page.goto(`/crm/properties?q=${encodeURIComponent(property.title)}`);
    await expect(
      page.getByRole("heading", { name: "Properties are unavailable" }),
    ).toBeVisible();
  } finally {
    await outage.dispose();
  }

  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Properties", exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("link", { name: property.title, exact: true })
      .filter({ visible: true }),
  ).toBeVisible();
});

test("UUID-shaped invalid property IDs show not found instead of an outage", async ({
  page,
}) => {
  const response = await page.goto(
    "/properties/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  );
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: "This home is no longer available" }),
  ).toBeVisible();
  await expect(
    page.getByText("The property service is temporarily unavailable."),
  ).toHaveCount(0);
});

test("CRM missing photos use shared fallback without expanding inventory thumbnails", async ({
  page,
}, testInfo) => {
  await signIn(page);
  const property = await createProperty(page);
  await page.route("**/media/**", (route) => route.abort());

  await page.goto(`/crm/properties/${property.id}`);
  await expect(
    page.getByRole("img", {
      name: `${property.title}, photo 1. Photo unavailable`,
      exact: true,
    }),
  ).toBeVisible();
  await page.goto(`/crm/properties/${property.id}/edit`);
  await expect(
    page.getByRole("img", {
      name: `${property.title}, photo 1. Photo unavailable`,
      exact: true,
    }),
  ).toBeVisible();
  await page.goto(`/crm/properties?q=${encodeURIComponent(property.title)}`);
  const thumbnail = page
    .locator('[data-slot="property-image"]')
    .filter({ visible: true })
    .first();
  await expect(thumbnail.locator('[data-state="unavailable"]')).toBeVisible();
  const bounds = await thumbnail.boundingBox();
  expect(bounds?.height).toBe(64);
  expect(bounds?.width).toBe(80);
  await expect(thumbnail.getByRole("img")).toHaveCount(0);
  await page.screenshot({
    path: testInfo.outputPath("crm-photo-fallback.png"),
    fullPage: true,
  });
});

test("photo action accepts a valid 5 MiB PNG and rejects an oversized selection", async ({
  page,
}) => {
  await signIn(page);

  const property = await createProperty(page, 0);

  await page.goto(`/crm/properties/${property.id}/edit`);

  let directWrites = 0;
  let actionRequests = 0;

  page.on("request", (request) => {
    if (request.method() !== "POST") return;
    if (request.headers()["next-action"]) actionRequests++;
    if (new URL(request.url()).pathname.startsWith("/api/v1/staff/properties"))
      directWrites++;
  });

  const upload = page.getByLabel("Add photos", { exact: true });

  await expect(upload).toBeEnabled();

  let releaseUpload!: () => void;
  const uploadReleased = new Promise<void>((resolve) => {
    releaseUpload = resolve;
  });
  let signalUploadStarted!: () => void;
  const uploadStarted = new Promise<void>((resolve) => {
    signalUploadStarted = resolve;
  });

  await page.route(`**/crm/properties/${property.id}/edit`, async (route) => {
    const request = route.request();

    if (request.method() === "POST" && request.headers()["next-action"]) {
      signalUploadStarted();
      await uploadReleased;
    }

    await route.continue();
  });

  const maximumPhoto = photoBuffer(5_242_880);

  expect(maximumPhoto.length).toBe(5_242_880);
  try {
    await upload.setInputFiles({
      name: "maximum.png",
      mimeType: "image/png",
      buffer: maximumPhoto,
    });
    await uploadStarted;
    const uploading = page
      .getByRole("status")
      .filter({ hasText: "Uploading photo 1 of 1…" });

    await expect(uploading).toBeVisible();
    await expect(uploading.locator('[data-slot="spinner"]')).toBeVisible();
    await expect(upload).toBeDisabled();
    releaseUpload();
    await expect(
      page.getByRole("status").filter({ hasText: "1 photo uploaded." }),
    ).toBeVisible();
    await expect(upload).toBeEnabled();
    expect(actionRequests).toBe(1);
    expect(directWrites).toBe(0);
  } finally {
    releaseUpload();
    await page.unroute(`**/crm/properties/${property.id}/edit`);
  }

  const saved = await (
    await page.request.get(`/api/v1/staff/properties/${property.id}`)
  ).json();

  expect(saved.photos).toHaveLength(1);
  await expect(
    page.getByRole("img", { name: `${property.title}, photo 1` }),
  ).toBeVisible();
  await upload.setInputFiles({
    name: "oversized.png",
    mimeType: "image/png",
    buffer: photoBuffer(5_242_881),
  });
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "Use JPEG, PNG or WebP images up to 5 MiB each." }),
  ).toBeVisible();
  expect(actionRequests).toBe(1);
  expect(directWrites).toBe(0);

  const unchanged = await (
    await page.request.get(`/api/v1/staff/properties/${property.id}`)
  ).json();

  expect(unchanged.photos).toHaveLength(1);
});
