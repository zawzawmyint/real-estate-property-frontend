import { randomUUID, createHmac } from "node:crypto";
import { expect, test, type Page, type Cookie } from "@playwright/test";

test.setTimeout(90_000);
const origin = "http://localhost:3100";
const headers = { Origin: origin };
const sessions = new Map<
  string,
  { cookies: Cookie[]; user: { id: string; name: string } }
>();
async function login(page: Page, role = "manager") {
  const key = `${test.info().project.name}-${role}`;
  const cached = sessions.get(key);
  await page.context().clearCookies();
  if (cached) {
    await page.context().addCookies(cached.cookies);
    return cached.user;
  }
  const response = await page.request.post("/api/v1/auth/sign-in/email", {
    headers,
    data: {
      email: `e2e-contact-${key}@example.com`,
      password: process.env.STAFF_E2E_PASSWORD,
      rememberMe: true,
    },
  });
  expect(response.status(), await response.text()).toBe(200);
  const user = (
    await (await page.request.get("/api/v1/auth/get-session")).json()
  ).user;
  sessions.set(key, { cookies: await page.context().cookies(), user });
  return user;
}
function uniqueName() {
  return `Contact ${randomUUID()
    .slice(0, 8)
    .replace(/\d/g, (digit) => String.fromCharCode(103 + Number(digit)))}`;
}
async function fill(page: Page, name: string) {
  await page.getByLabel("Full name", { exact: true }).fill(name);
  await page.getByLabel("I'm looking to", { exact: true }).selectOption("rent");
  await page
    .getByLabel("Email", { exact: true })
    .fill("fictional-contact@example.com");
  await page
    .getByLabel("Message", { exact: true })
    .fill("I am looking for a fictional two-bedroom apartment.");
}
test.beforeEach(async ({ page }) => {
  const unique = randomUUID().replaceAll("-", "");
  await page.setExtraHTTPHeaders({
    "x-e2e-client-ip": `2001:db8::${unique.slice(0, 4)}:${unique.slice(4, 8)}`,
  });
});

test("contact enquiry is recorded once, assigned and visible only to its agent", async ({
  page,
}, info) => {
  const agent = await login(page, "agent");
  await page.context().clearCookies();
  await page.goto("/contact");
  const name = uniqueName();
  await fill(page, name);
  await page.getByRole("button", { name: "Send enquiry", exact: true }).click();
  await expect(
    page.getByText("Your enquiry has been received.", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath("enquiry-receipt.png"),
    fullPage: true,
  });
  await login(page);
  const listing = await page.request.get(
    `/api/v1/staff/leads?view=unassigned&q=${encodeURIComponent(name)}`,
  );
  const result = await listing.json();
  expect(result.total).toBe(1);
  const lead = result.items[0];
  expect(lead).toMatchObject({
    name,
    source: "website",
    stage: "new",
    purpose: "rent",
    property: null,
    assignedAgent: null,
  });
  const detail = await (
    await page.request.get(`/api/v1/staff/leads/${lead.id}`)
  ).json();
  expect(detail.originalMessage).toBe(
    "I am looking for a fictional two-bedroom apartment.",
  );
  const assigned = await page.request.patch(
    `/api/v1/staff/leads/${lead.id}/assignment`,
    {
      headers,
      data: { expectedVersion: lead.version, assignedAgentId: agent.id },
    },
  );
  expect(assigned.status()).toBe(200);
  await login(page, "agent");
  await page.goto(`/crm/leads/${lead.id}`);
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
});

test("contact validates required intent/contact/message and focuses feedback", async ({
  page,
}, info) => {
  await page.goto("/contact");
  await expect(
    page.getByRole("button", { name: "Send enquiry", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Send enquiry", exact: true }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Check the highlighted fields" }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "Check the highlighted fields" })
      .locator(".."),
  ).toBeFocused();
  await expect(page.getByLabel("Full name", { exact: true })).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await expect(
    page.getByLabel("I'm looking to", { exact: true }),
  ).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByLabel("Message", { exact: true })).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await page.screenshot({
    path: info.outputPath("enquiry-validation.png"),
    fullPage: true,
  });
});

test("a pasted phone-only enquiry stores a normalized contact number", async ({
  page,
}) => {
  await page.goto("/contact");
  const name = uniqueName();
  await fill(page, name);
  await page.getByLabel("Email", { exact: true }).fill("");
  await page
    .getByLabel("Phone", { exact: true })
    .fill(`${" ".repeat(25)}+971\u00a050\u202f123\u20074567   `);
  await expect(page.getByLabel("Phone", { exact: true })).toHaveValue(
    `${" ".repeat(25)}+971\u00a050\u202f123\u20074567   `,
  );
  await page.getByRole("button", { name: "Send enquiry", exact: true }).click();
  await expect(
    page.getByText("Your enquiry has been received.", { exact: true }),
  ).toBeVisible();
  await login(page);
  const result = await (
    await page.request.get(
      `/api/v1/staff/leads?view=unassigned&q=${encodeURIComponent(name)}`,
    )
  ).json();
  expect(result.total).toBe(1);
  expect(result.items[0]).toMatchObject({
    name,
    phone: "+971 50 123 4567",
    email: null,
    stage: "new",
    source: "website",
    assignedAgent: null,
    property: null,
  });
});

test("catalog outages keep the enquiry usable with an explicit unknown-mode caution", async ({
  page,
}, info) => {
  test.skip(
    info.project.name !== "desktop" || info.config.workers !== 1,
    "A shared agency-catalog fault requires a single-worker desktop run.",
  );
  const control = "http://127.0.0.1:4312/_e2e/rules";
  const registered = await page.request.post(control, {
    data: { method: "GET", path: "/api/v1/public/agency", status: 503 },
  });
  expect(registered.status()).toBe(201);
  const { id } = await registered.json();
  try {
    await page.request.post(`${control}/${id}/release`);
    await page.goto("/contact");
    await expect(
      page.getByText(/Agency details and demo status could not be confirmed/),
    ).toBeVisible();
    await expect(
      page.getByText(/before sharing personal contact information/),
    ).toBeVisible();
    await expect(
      page.getByText(
        /If you are testing a demonstration, use fictional details/,
      ),
    ).toBeVisible();
    await expect(
      page.getByText(
        "Your details will be used to respond to this property enquiry.",
        { exact: true },
      ),
    ).toHaveCount(0);
    await expect(
      page.getByText(
        /Submitting this form records the contact details and message you enter/,
      ),
    ).toBeVisible();
    await expect(page.getByText(/so we can reply/)).toHaveCount(0);
    await fill(page, uniqueName());
    await page
      .getByRole("button", { name: "Send enquiry", exact: true })
      .click();
    await expect(
      page.getByText("Your enquiry has been received.", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText(/follow-up cannot be confirmed/)).toBeVisible();
    await page.screenshot({
      path: info.outputPath("unknown-mode-receipt.png"),
      fullPage: true,
    });
    await page.request.delete(`${control}/${id}`);
    await page.getByRole("button", { name: "Try again", exact: true }).click();
    await expect(page.getByText(/Demo agency\./)).toBeVisible();
    await expect(
      page.getByText(/demo status could not be confirmed/),
    ).toHaveCount(0);
    await expect(
      page.getByText("Your enquiry has been received.", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Send another enquiry", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Send enquiry", exact: true }),
    ).toHaveCount(0);
    await page
      .getByRole("button", { name: "Send another enquiry", exact: true })
      .click();
    await expect(page.getByLabel("Full name", { exact: true })).toHaveValue("");
  } finally {
    await page.request.delete(`${control}/${id}`);
  }
});

test("lost contact response retries its original receipt without creating another lead", async ({
  page,
}) => {
  await page.goto("/contact");
  const name = uniqueName();
  await fill(page, name);
  let dropped = false;
  await page.route("**/contact**", async (route) => {
    if (
      !dropped &&
      route.request().method() === "POST" &&
      route.request().headers()["next-action"]
    ) {
      dropped = true;
      await route.fetch();
      await route.abort("failed");
    } else await route.continue();
  });
  await page.getByRole("button", { name: "Send enquiry", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Retry same enquiry", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Full name", { exact: true })).toHaveValue(name);
  await expect(page.getByLabel("Full name", { exact: true })).toBeDisabled();
  await page
    .getByRole("button", { name: "Retry same enquiry", exact: true })
    .click();
  await expect(
    page.getByText("Your enquiry has been received.", { exact: true }),
  ).toBeVisible();
  await login(page);
  const result = await (
    await page.request.get(
      `/api/v1/staff/leads?view=all&q=${encodeURIComponent(name)}`,
    )
  ).json();
  expect(result.total).toBe(1);
});

test("public pages and demo portraits remain usable across the required widths", async ({
  page,
}, info) => {
  for (const path of ["/contact", "/agents", "/agents/amira-hassan"]) {
    await page.goto(path);
    await expect(page.locator("main h1")).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );
    await page.evaluate(() => document.fonts.ready);
    if (path.startsWith("/agents")) {
      const portraits = page.locator('main img[alt^="Portrait of"]');
      await expect(portraits).toHaveCount(path === "/agents" ? 3 : 1);
      for (const portrait of await portraits.all()) {
        await portrait.scrollIntoViewIfNeeded();
        await expect
          .poll(() =>
            portrait.evaluate(
              (image: HTMLImageElement) =>
                image.complete && image.naturalWidth > 0,
            ),
          )
          .toBe(true);
      }
      await page.evaluate(() => window.scrollTo(0, 0));
    }
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: info.outputPath(
          `${path.replaceAll("/", "-").slice(1)}-${width}.png`,
        ),
        fullPage: true,
      });
    }
  }
  await page.goto("/agents/unknown-person");
  await expect(
    page.getByRole("heading", {
      name: "This profile isn’t available.",
      exact: true,
    }),
  ).toBeVisible();
  const response = await page.request.get("/agents/unknown-person");
  expect(response.status()).toBe(404);
});

test("public navigation reaches the directory, profile and contact page", async ({
  page,
}, info) => {
  await page.goto("/");
  if (info.project.name === "mobile")
    await page.getByRole("button", { name: "Menu", exact: true }).click();
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .filter({ visible: true })
    .getByRole("link", { name: "Our agents", exact: true })
    .click();
  await expect(page).toHaveURL(/\/agents$/);
  await page
    .getByRole("link", { name: /Amira Hassan/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/agents\/amira-hassan$/);
  await expect(
    page.getByRole("heading", { name: "Amira Hassan", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Send a property enquiry", exact: true })
    .click();
  await expect(page).toHaveURL(/\/contact$/);
  await expect(
    page.getByRole("button", { name: "Send enquiry", exact: true }),
  ).toBeVisible();
});

test("pending submission blocks duplicate writes and send-another resets the complete form", async ({
  page,
}) => {
  await page.goto("/contact");
  const name = uniqueName();
  await fill(page, name);
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  let writes = 0;
  await page.route("**/contact**", async (route) => {
    if (
      route.request().method() === "POST" &&
      route.request().headers()["next-action"]
    ) {
      writes++;
      await held;
    }
    await route.continue();
  });
  await page.getByRole("button", { name: "Send enquiry", exact: true }).click();
  try {
    await expect(
      page.getByRole("button", { name: "Sending enquiry…", exact: true }),
    ).toBeDisabled();
    await expect(page.getByLabel("Full name", { exact: true })).toBeDisabled();
    await page.locator("form").evaluate((form) => {
      (form as HTMLFormElement).requestSubmit();
      (form as HTMLFormElement).requestSubmit();
    });
    expect(writes).toBe(1);
  } finally {
    release();
  }
  await expect(
    page.getByText("Your enquiry has been received.", { exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Your enquiry has been received." }),
  ).toBeFocused();
  await page
    .getByRole("button", { name: "Send another enquiry", exact: true })
    .click();
  await expect(page.getByLabel("Full name", { exact: true })).toHaveValue("");
  await expect(page.getByLabel("Full name", { exact: true })).toBeFocused();
  await expect(page.getByLabel("I'm looking to", { exact: true })).toHaveValue(
    "",
  );
  await expect(page.getByLabel("Message", { exact: true })).toHaveValue("");
  await login(page);
  expect(
    (
      await (
        await page.request.get(
          `/api/v1/staff/leads?view=all&q=${encodeURIComponent(name)}`,
        )
      ).json()
    ).total,
  ).toBe(1);
});

test("editing an uncertain enquiry requires confirmation and creates a deliberate new receipt", async ({
  page,
}) => {
  await page.goto("/contact");
  const name = uniqueName();
  await fill(page, name);
  let dropped = false;
  await page.route("**/contact**", async (route) => {
    if (
      !dropped &&
      route.request().method() === "POST" &&
      route.request().headers()["next-action"]
    ) {
      dropped = true;
      await route.fetch();
      await route.abort("failed");
    } else await route.continue();
  });
  await page.getByRole("button", { name: "Send enquiry", exact: true }).click();
  await page
    .getByRole("button", { name: "Edit as a new enquiry", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("may already be saved");
  await page
    .getByRole("button", { name: "Keep original enquiry", exact: true })
    .click();
  await expect(page.getByLabel("Full name", { exact: true })).toBeDisabled();
  await page
    .getByRole("button", { name: "Edit as a new enquiry", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Edit as new enquiry", exact: true })
    .click();
  await expect(page.getByLabel("Full name", { exact: true })).toBeEnabled();
  await page
    .getByLabel("Message", { exact: true })
    .fill("A deliberate new fictional enquiry with different preferences.");
  await page.getByRole("button", { name: "Send enquiry", exact: true }).click();
  await expect(
    page.getByText("Your enquiry has been received.", { exact: true }),
  ).toBeVisible();
  await login(page);
  expect(
    (
      await (
        await page.request.get(
          `/api/v1/staff/leads?view=all&q=${encodeURIComponent(name)}`,
        )
      ).json()
    ).total,
  ).toBe(2);
});

test("rate-limit feedback preserves details and prevents another request during cooldown", async ({
  page,
}, info) => {
  const ip = `2001:db8::${info.project.name === "desktop" ? "100" : "200"}:${randomUUID().slice(0, 4)}`;
  await page.setExtraHTTPHeaders({ "x-e2e-client-ip": ip });
  const secret =
    process.env.INQUIRY_RELAY_SECRET ||
    "test-only-inquiry-relay-secret-for-browser-fixtures";
  const key = createHmac("sha256", secret).update(ip).digest("hex");
  const relayHeaders = {
    ...headers,
    "x-inquiry-client-key": key,
    "x-inquiry-relay-signature": createHmac("sha256", secret)
      .update(key)
      .digest("hex"),
  };
  for (let index = 0; index < 5; index++) {
    const response = await page.request.post("/api/v1/public/inquiries", {
      headers: relayHeaders,
      data: {
        submissionId: randomUUID(),
        name: `Quota fixture ${index}`,
        purpose: "sale",
        email: "quota@example.com",
        message: "Fictional quota setup.",
      },
    });
    expect(response.status(), await response.text()).toBe(201);
  }
  await page.goto("/contact");
  const name = uniqueName();
  await fill(page, name);
  await page.getByRole("button", { name: "Send enquiry", exact: true }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "enquiry limit" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Send enquiry", exact: true }),
  ).toBeDisabled();
  await expect(page.getByLabel("Full name", { exact: true })).toHaveValue(name);
  await expect(
    page.getByRole("status").filter({ hasText: "You can try again in" }),
  ).toBeVisible();
});

test("portrait failure retains the profile and a stable accessible image fallback", async ({
  page,
}, info) => {
  await page.route(/\/(?:_next\/image\?|images\/agents\/)/, (route) =>
    route.abort("failed"),
  );
  await page.goto("/agents/amira-hassan");
  await expect(
    page.getByRole("heading", { name: "Amira Hassan", exact: true }),
  ).toBeVisible();
  const fallback = page.getByRole("img", {
    name: "Amira Hassan. Portrait unavailable",
    exact: true,
  });
  await expect(fallback).toBeVisible();
  const box = await fallback.boundingBox();
  expect(box!.width / box!.height).toBeCloseTo(0.8, 1);
  await expect(
    page.getByRole("link", { name: "Send a property enquiry", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath("portrait-fallback.png"),
    fullPage: true,
  });
});

test("public pages support enlarged text and reduced motion without horizontal page overflow", async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const path of ["/contact", "/agents", "/agents/amira-hassan"]) {
    await page.setViewportSize({ width: 390, height: 1000 });
    await page.goto(path);
    await expect(page.locator("main h1")).toBeVisible();
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "200%";
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: info.outputPath(`large-text-${path.replaceAll("/", "-")}.png`),
      fullPage: true,
    });
  }
});

test("a profile service outage offers recovery instead of pretending the agent is missing", async ({
  page,
}, info) => {
  test.skip(
    info.project.name !== "desktop",
    "One isolated profile fault is sufficient for the shared server path.",
  );
  const control = "http://127.0.0.1:4312/_e2e/rules";
  const registered = await page.request.post(control, {
    data: {
      method: "GET",
      path: "/api/v1/public/agents/daniel-brooks",
      status: 503,
    },
  });
  expect(registered.status()).toBe(201);
  const { id } = await registered.json();
  try {
    await page.request.post(`${control}/${id}/release`);
    await page.goto("/agents/daniel-brooks");
    await expect(
      page.getByRole("heading", {
        name: "Agent profile unavailable",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "This profile isn’t available.",
        exact: true,
      }),
    ).toHaveCount(0);
    await page.request.delete(`${control}/${id}`);
    await page.getByRole("button", { name: "Try again", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Daniel Brooks", exact: true }),
    ).toBeVisible();
  } finally {
    await page.request.delete(`${control}/${id}`);
  }
});
