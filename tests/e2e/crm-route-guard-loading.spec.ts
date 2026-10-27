import { createHash, randomUUID } from "node:crypto";
import { expect, test, type Page, type Cookie } from "@playwright/test";

// Reuse one manager session per project and keep session holds isolated from
// each other, without consuming the navigation tests' sign-in limiter budget.
test.describe.configure({ mode: "default" });

const control = "http://127.0.0.1:4312/_e2e/rules";
const cookies = new Map<string, Cookie[]>();

async function sessionDigest(page: Page) {
  const cookie = (await page.context().cookies()).find(
    (entry) => entry.name === "agency.session",
  )!;
  return createHash("sha256")
    .update(decodeURIComponent(cookie.value))
    .digest("hex");
}

async function signIn(page: Page) {
  const project = test.info().project.name;
  if (cookies.has(project)) {
    await page.context().addCookies(cookies.get(project)!);
    return;
  }
  const response = await page.request.post("/api/v1/auth/sign-in/email", {
    headers: { Origin: "http://localhost:3100" },
    data: {
      email: `e2e-property-${project}-manager@example.com`,
      password: process.env.STAFF_E2E_PASSWORD,
      rememberMe: true,
    },
  });
  expect(response.ok()).toBe(true);
  cookies.set(project, await page.context().cookies());
}

test("records warm session and full-route timings separately", async ({
  page,
}, info) => {
  await signIn(page);
  const samples: Record<string, number[]> = {};
  for (const url of [
    "/api/v1/auth/get-session",
    "/crm/properties",
    "/crm/leads",
  ]) {
    samples[url] = [];
    for (let index = 0; index < 4; index++) {
      const started = performance.now();
      const response = await page.request.get(url);
      await response.body();
      expect(response.ok()).toBe(true);
      samples[url].push(Math.round(performance.now() - started));
    }
  }
  await info.attach("request-timings-ms", {
    body: JSON.stringify(samples),
    contentType: "application/json",
  });
  console.log("Request timings in ms (first sample then warm):", samples);
});

for (const feature of ["properties", "leads"]) {
  test(`${feature} preserves static content and retries a session-service outage`, async ({
    page,
  }) => {
    await signIn(page);
    const response = await page.request.post(control, {
      data: {
        method: "GET",
        path: "/api/v1/auth/get-session",
        sessionDigest: await sessionDigest(page),
        status: 503,
      },
    });
    const { id } = await response.json();
    await page.request.post(`${control}/${id}/release`);
    try {
      await page.goto(`/crm/${feature}`);
      const main = page.getByRole("main");
      await expect(
        main.getByRole("heading", {
          name: feature === "properties" ? "Properties" : "Leads",
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        main.getByText("Session verification is unavailable."),
      ).toBeVisible();
      await expect(
        main.getByRole("link", {
          name: feature === "properties" ? "Add property" : "New lead",
          exact: true,
        }),
      ).toHaveCount(0);
      await expect(page).toHaveURL(new RegExp(`/crm/${feature}$`));
      await page.request.delete(`${control}/${id}`);
      await main
        .getByRole("button", { name: "Retry session check", exact: true })
        .click();
      await expect(
        main.getByRole("link", {
          name: feature === "properties" ? "Add property" : "New lead",
          exact: true,
        }),
      ).toBeVisible();
    } finally {
      await page.request.delete(`${control}/${id}`);
    }
  });

  test(`${feature} renders static structure while session verification is held`, async ({
    page,
  }, info) => {
    await signIn(page);
    const response = await page.request.post(control, {
      data: {
        method: "GET",
        path: "/api/v1/auth/get-session",
        sessionDigest: await sessionDigest(page),
      },
    });
    expect(response.status()).toBe(201);
    const { id } = await response.json();
    try {
      await page.goto(`/crm/${feature}`, { waitUntil: "commit" });
      await expect
        .poll(
          async () =>
            (await (await page.request.get(`${control}/${id}`)).json()).hits,
        )
        .toBeGreaterThan(0);
      await expect(
        page.getByRole("heading", {
          name: feature === "properties" ? "Properties" : "Leads",
          exact: true,
        }),
      ).toBeVisible({ timeout: 2000 });
      await expect(
        page.getByLabel(
          feature === "properties" ? "Search inventory" : "Search leads",
          { exact: true },
        ),
      ).toBeVisible({ timeout: 1000 });
      await expect(
        page.getByRole("link", {
          name: feature === "properties" ? "Add property" : "New lead",
          exact: true,
        }),
      ).toHaveCount(0);
      await expect(page.getByRole("table")).toHaveCount(0);
      await page.screenshot({
        path: info.outputPath(`${feature}-session-pending.png`),
        fullPage: true,
        caret: "initial",
      });
      await page.request.post(`${control}/${id}/release`);
      await expect(
        page.getByRole("link", {
          name: feature === "properties" ? "Add property" : "New lead",
          exact: true,
        }),
      ).toBeVisible();
    } finally {
      await page.request.delete(`${control}/${id}`);
    }
  });

  test(`${feature} keeps heading and filters during held result updates`, async ({
    page,
  }) => {
    await signIn(page);
    const q = `Guard results ${randomUUID()}`;
    const response = await page.request.post(control, {
      data: { method: "GET", path: `/api/v1/staff/${feature}`, query: { q } },
    });
    const { id } = await response.json();
    try {
      await page.goto(`/crm/${feature}?q=${encodeURIComponent(q)}`, {
        waitUntil: "commit",
      });
      await expect(
        page.getByRole("status", {
          name:
            feature === "properties" ? "Loading inventory" : "Loading leads",
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        page.getByLabel(
          feature === "properties" ? "Search inventory" : "Search leads",
          { exact: true },
        ),
      ).toBeEnabled();
      await expect(
        page.getByRole("heading", {
          name: feature === "properties" ? "Properties" : "Leads",
          exact: true,
        }),
      ).toBeVisible();
      await page.request.post(`${control}/${id}/release`);
      await expect(
        page.getByRole("status", {
          name:
            feature === "properties" ? "Loading inventory" : "Loading leads",
          exact: true,
        }),
      ).toHaveCount(0);
    } finally {
      await page.request.delete(`${control}/${id}`);
    }
  });
}

test("missing and forged cookies cannot open private direct routes", async ({
  page,
  context,
}) => {
  for (const path of ["/crm", "/crm/properties/new", "/crm/leads/new"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login$/);
  }
  await context.addCookies([
    {
      name: "agency.session",
      value: "forged-session",
      url: "http://localhost:3100",
    },
  ]);
  await page.goto("/crm/properties");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("table")).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Add property", exact: true }),
  ).toHaveCount(0);
});

test("Express rejects unauthenticated, forbidden and revoked-session requests", async ({
  page,
}, info) => {
  expect((await page.request.get("/api/v1/staff/properties")).status()).toBe(
    401,
  );
  const response = await page.request.post("/api/v1/auth/sign-in/email", {
    headers: { Origin: "http://localhost:3100" },
    data: {
      email: `e2e-property-${info.project.name}-agent@example.com`,
      password: process.env.STAFF_E2E_PASSWORD,
      rememberMe: true,
    },
  });
  expect(response.ok()).toBe(true);
  const sessionCookie = (await page.context().cookies()).find(
    (cookie) => cookie.name === "agency.session",
  )!.value;
  expect(
    (
      await page.request.post("/api/v1/staff/properties", {
        headers: { Origin: "http://localhost:3100" },
        data: { title: "Forbidden Agent create", purpose: "sale" },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await page.request.post("/api/v1/auth/sign-out", {
        headers: { Origin: "http://localhost:3100" },
      })
    ).ok(),
  ).toBe(true);
  expect(
    (
      await page.request.get("/api/v1/staff/properties", {
        headers: { Cookie: `agency.session=${sessionCookie}` },
      })
    ).status(),
  ).toBe(401);
});
