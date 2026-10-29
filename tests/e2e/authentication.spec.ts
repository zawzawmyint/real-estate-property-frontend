import { expect, test } from "@playwright/test";
import type { Page, TestInfo } from "@playwright/test";
import { staffRoles, type StaffRole } from "../../src/lib/auth/roles";

async function openStaffSidebar(page: Page) {
  const menu = page.getByRole("button", { name: "Menu", exact: true });
  const account = page.getByRole("button", {
    name: "Staff account",
    exact: true,
  });
  const identity = page.getByRole("region", {
    name: "Staff account",
    exact: true,
  });

  // Shell and account now stream separately. Wait for the appropriate hydrated
  // trigger instead of deciding from a transient shell/account visibility gap.
  await expect(async () => {
    if (await identity.isVisible()) return;
    const trigger =
      (page.viewportSize()?.width ?? 1280) < 1024 ? menu : account;
    await expect(trigger).toBeVisible({ timeout: 1000 });
    await expect(trigger).toBeEnabled({ timeout: 1000 });
    if ((await trigger.getAttribute("aria-expanded")) !== "true")
      await trigger.click({ timeout: 1000 });
    await expect(identity).toBeVisible({ timeout: 1500 });
  }).toPass({ timeout: 10_000 });
}

async function signIn(
  page: Page,
  role: StaffRole,
  testInfo?: TestInfo,
  email = `e2e-${role}@example.com`,
) {
  const password = process.env.STAFF_E2E_PASSWORD;

  if (!password)
    throw new Error(
      "STAFF_E2E_PASSWORD must match the isolated backend fixture process.",
    );

  await page.goto("/login");
  await expect(page.getByLabel("Email address")).toBeEnabled();

  if (testInfo)
    await page.screenshot({
      path: testInfo.outputPath("staff-login.png"),
      fullPage: true,
    });

  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/crm$/);
  await expect(
    page.getByRole("heading", {
      name: role === "agent" ? "My overview" : "Agency overview",
      exact: true,
    }),
  ).toBeVisible();

  if (testInfo)
    await page.screenshot({
      path: testInfo.outputPath("authenticated-crm.png"),
      fullPage: true,
    });
}

for (const role of staffRoles) {
  test(`${role} signs in through the real proxy, refreshes, and signs out`, async ({
    page,
    context,
  }, testInfo) => {
    // This journey includes sign-in, refresh, redirects, sign-out and back/direct
    // navigation guards. Keep per-assertion limits while budgeting the full flow.
    test.setTimeout(60_000);
    await signIn(page, role, testInfo);
    await openStaffSidebar(page);

    const label = role.charAt(0).toUpperCase() + role.slice(1);

    await expect(page.getByText(label, { exact: true })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Sign out", exact: true }),
    ).toBeVisible();

    const cookie = (await context.cookies()).find(
      (entry) => entry.name === "agency.session",
    );

    expect(cookie).toMatchObject({
      httpOnly: true,
      sameSite: "Lax",
      path: "/",
      secure: false,
    });
    expect(cookie!.expires * 1000 - Date.now()).toBeGreaterThan(28_700_000);
    expect(cookie!.expires * 1000 - Date.now()).toBeLessThanOrEqual(28_800_000);
    await page.reload();
    await openStaffSidebar(page);
    await expect(page.getByText(label, { exact: true })).toBeVisible();
    await page.goto("/login");
    await expect(page).toHaveURL(/\/crm$/);
    await openStaffSidebar(page);
    expect(
      await page.evaluate(() => ({
        local: localStorage.length,
        session: sessionStorage.length,
      })),
    ).toEqual({ local: 0, session: 0 });
    expect(await page.content()).not.toContain(cookie!.value);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole("heading", {
        name: "Sign in to your workspace",
        exact: true,
      }),
    ).toBeVisible();
    await page.goto("/crm");
    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole("heading", { name: /^(Agency|My) overview$/ }),
    ).toHaveCount(0);
  });
}

test("concurrent browser contexts retain distinct staff identities", async ({
  browser,
  baseURL,
}) => {
  const admin = await browser.newContext({ baseURL });
  const agent = await browser.newContext({ baseURL });

  try {
    const adminPage = await admin.newPage();
    const agentPage = await agent.newPage();

    await Promise.all([signIn(adminPage, "admin"), signIn(agentPage, "agent")]);
    await Promise.all([
      openStaffSidebar(adminPage),
      openStaffSidebar(agentPage),
    ]);
    await expect(adminPage.getByText("Admin", { exact: true })).toBeVisible();
    await expect(agentPage.getByText("Agent", { exact: true })).toBeVisible();
    await adminPage
      .getByRole("button", { name: "Sign out", exact: true })
      .click();
    await expect(adminPage).toHaveURL(/\/login$/);
    await agentPage.reload();
    await openStaffSidebar(agentPage);
    await expect(agentPage.getByText("Agent", { exact: true })).toBeVisible();
  } finally {
    await Promise.all([admin.close(), agent.close()]);
  }
});

test("pending sign-in prevents duplicates and outage errors permit retry", async ({
  page,
}) => {
  await page.goto("/login");

  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  let submissions = 0;

  await page.route("**/api/v1/auth/sign-in/email", async (route) => {
    submissions++;
    await held;
    await route.fulfill({
      status: 503,
      contentType: "text/html",
      body: "upstream unavailable",
    });
  });
  await page.getByLabel("Email address").fill("retry@example.com");
  await page.getByLabel("Password", { exact: true }).fill("unchanged password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Signing in…", exact: true }),
  ).toBeDisabled();
  await page.getByLabel("Password", { exact: true }).press("Enter");
  await expect.poll(() => submissions).toBe(1);
  release();
  await expect(page.locator("form").getByRole("alert")).toHaveText(
    "Sign-in is unavailable. Please try again.",
  );
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true }),
  ).toBeEnabled();
  await expect(page.getByLabel("Password", { exact: true })).toHaveValue("");
});

test("native 429 Retry-After pauses submission until retry is permitted", async ({
  page,
}) => {
  await page.goto("/login");
  await page.route("**/api/v1/auth/sign-in/email", (route) =>
    route.fulfill({
      status: 429,
      headers: { "Retry-After": "2" },
      contentType: "application/json",
      body: JSON.stringify({ code: "TOO_MANY_REQUESTS", message: "Try later" }),
    }),
  );
  await page.getByLabel("Email address").fill("retry@example.com");
  await page.getByLabel("Password", { exact: true }).fill("unchanged password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.locator("form").getByRole("alert")).toHaveText(
    "Too many sign-in attempts. Please wait before trying again.",
  );
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true }),
  ).toBeDisabled();
  await expect(page.getByRole("status")).toContainText("Try again in");
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true }),
  ).toBeEnabled({ timeout: 5_000 });
});

test("rapid submits validate once and stay pending through successful CRM navigation", async ({
  page,
}) => {
  const password = process.env.STAFF_E2E_PASSWORD;

  if (!password) throw new Error("STAFF_E2E_PASSWORD is required.");

  await page.goto("/login");

  const email = page.getByLabel("Email address");
  const secret = page.getByLabel("Password", { exact: true });

  await expect(email).toBeEnabled();

  let submissions = 0;
  let releaseSignIn!: () => void;
  const signInReady = new Promise<void>((resolve) => {
    releaseSignIn = resolve;
  });
  let releaseNavigation!: () => void;
  const navigationReady = new Promise<void>((resolve) => {
    releaseNavigation = resolve;
  });
  let navigationStarted = false;

  await page.route("**/api/v1/auth/sign-in/email", async (route) => {
    submissions++;
    await signInReady;
    await route.continue();
  });
  await page.route("**/crm**", async (route) => {
    navigationStarted = true;
    await navigationReady;
    await route.continue();
  });

  const rapidSubmit = () =>
    page.locator("form").evaluate((form: HTMLFormElement) => {
      for (let attempt = 0; attempt < 8; attempt++) form.requestSubmit();
    });

  try {
    await email.fill("invalid");
    await rapidSubmit();
    await expect(page.getByText("Enter a valid email address.")).toBeVisible();
    await expect(page.getByText("Enter your password.")).toBeVisible();
    await expect(email).toBeFocused();
    expect(submissions).toBe(0);
    await email.fill("e2e-transition@example.com");
    await secret.fill(password);
    await rapidSubmit();

    const pending = page.getByRole("button", {
      name: "Signing in…",
      exact: true,
    });

    await expect(pending).toBeDisabled();
    await expect.poll(() => submissions).toBe(1);
    await rapidSubmit();
    await secret.press("Enter");
    expect(submissions).toBe(1);
    releaseSignIn();
    await expect.poll(() => navigationStarted).toBe(true);
    await expect(pending).toBeDisabled();
    await expect(page.locator("form")).toHaveAttribute("aria-busy", "true");
    await expect(secret).toHaveValue("");
    await rapidSubmit();
    expect(submissions).toBe(1);
  } finally {
    releaseSignIn();
    releaseNavigation();
  }

  await expect(page).toHaveURL(/\/crm$/);
  await openStaffSidebar(page);
  await expect(page.getByText("Agent", { exact: true })).toBeVisible();
});

test("failed logout remains in the workspace with a retry action", async ({
  page,
}) => {
  await signIn(page, "manager");
  await openStaffSidebar(page);
  await page.route("**/api/v1/auth/sign-out", (route) =>
    route.fulfill({
      status: 503,
      contentType: "text/plain",
      body: "unavailable",
    }),
  );
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Staff account" }).getByRole("alert"),
  ).toHaveText("We couldn’t sign you out. Please try again.");
  await expect(page).toHaveURL(/\/crm$/);
  await expect(
    page.getByRole("button", { name: "Sign out", exact: true }),
  ).toBeEnabled();
  await page.unroute("**/api/v1/auth/sign-out");
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
});

test("CRM navigation handles narrow screens, focus return, nested routes and desktop resizing", async ({
  page,
}, testInfo) => {
  await signIn(
    page,
    "manager",
    undefined,
    `e2e-navigation-${testInfo.project.name}@example.com`,
  );
  const menu = page.getByRole("button", { name: "Menu", exact: true });
  const mobile = (page.viewportSize()?.width ?? 1280) < 1024;

  if (!mobile) {
    await page
      .getByRole("button", { name: "Expand sidebar", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Collapse sidebar", exact: true }),
    ).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("complementary")).toHaveCSS("width", "240px");
  }

  if (mobile) {
    await menu.click();
    await expect(
      page.getByRole("dialog", { name: "Agency workspace", exact: true }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu).toBeFocused();
    await menu.click();
  }

  const navigation = page.getByRole("navigation", {
    name: "Workspace navigation",
  });
  await expect(
    navigation.getByRole("link", { name: "Overview", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await navigation
    .getByRole("link", { name: "Properties", exact: true })
    .click();
  await expect(page).toHaveURL(/\/crm\/properties$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Properties", exact: true }),
  ).toBeVisible();

  if (mobile) await menu.click();
  await expect(
    navigation.getByRole("link", { name: "Properties", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  if (!mobile) {
    await expect(
      page.getByRole("button", { name: "Collapse sidebar", exact: true }),
    ).toHaveAttribute("aria-expanded", "true");
    await page.screenshot({
      path: testInfo.outputPath("crm-sidebar-expanded.png"),
    });
    await page
      .getByRole("button", { name: "Collapse sidebar", exact: true })
      .click();
    await expect(page.getByRole("complementary")).toHaveCSS("width", "88px");
  }
  if (mobile) {
    await expect(page.getByRole("dialog")).toHaveCSS("opacity", "1");
    await expect(page.getByRole("dialog")).toHaveCSS(
      "width",
      `${Math.min(320, (page.viewportSize()?.width ?? 390) - 32)}px`,
    );
    await page.screenshot({
      path: testInfo.outputPath("crm-menu-mobile.png"),
      animations: "disabled",
    });
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  }

  await page.screenshot({ path: testInfo.outputPath("crm-navigation.png") });
});

test("CRM account feedback remains usable with a long name at narrow widths", async ({
  page,
}, testInfo) => {
  await signIn(
    page,
    "manager",
    undefined,
    `e2e-navigation-${testInfo.project.name}@example.com`,
  );
  const name = "Alexandra Avenor Property Management and Customer Relations";
  await page.route("**/api/v1/auth/get-session*", async (route) => {
    const response = await route.fetch();
    const session = await response.json();
    session.user.name = name;
    await route.fulfill({ response, json: session });
  });
  await page.setViewportSize({ width: 320, height: 720 });
  await page.reload();
  await openStaffSidebar(page);
  await expect(
    page
      .getByRole("region", { name: "Staff account" })
      .getByText(name, { exact: true }),
  ).toBeVisible();
  await page.route("**/api/v1/auth/sign-out", (route) =>
    route.fulfill({ status: 503, json: { message: "Unavailable" } }),
  );
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Staff account" }).getByRole("alert"),
  ).toContainText("We couldn’t sign you out.");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect(
    page.getByRole("button", { name: "Sign out", exact: true }),
  ).toBeEnabled();
});

test("CRM session-check errors remain reachable and recover through retry", async ({
  page,
}, testInfo) => {
  await signIn(
    page,
    "manager",
    undefined,
    `e2e-navigation-${testInfo.project.name}@example.com`,
  );
  await page.setViewportSize({ width: 320, height: 720 });
  await page.route("**/api/v1/auth/get-session*", (route) =>
    route.fulfill({ status: 503, json: { message: "Unavailable" } }),
  );
  await page.reload();
  await openStaffSidebar(page);
  const alert = page
    .getByRole("region", { name: "Staff account" })
    .getByRole("alert");
  await expect(alert).toContainText("Session verification is unavailable.");
  await expect(
    alert.getByRole("button", { name: "Retry session check" }),
  ).toHaveText("Retry session check");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("session-check-failure.png"),
  });
  await page.unroute("**/api/v1/auth/get-session*");
  const recoveredSession = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/v1/auth/get-session" &&
      response.status() === 200,
  );
  await alert.getByRole("button", { name: "Retry session check" }).click();
  await recoveredSession;
  await expect(alert).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Sign out", exact: true }),
  ).toBeEnabled();
});

test("CRM shell reflows across supported widths and enlarged layout", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "desktop",
    "One viewport sweep is sufficient.",
  );
  await signIn(
    page,
    "manager",
    undefined,
    `e2e-navigation-${testInfo.project.name}@example.com`,
  );

  for (const width of [320, 375, 768, 1024, 1440]) {
    expect(
      await page.evaluate(() => getComputedStyle(document.body).fontFamily),
    ).toMatch(/poppins/i);
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(page.getByRole("banner")).toHaveCount(0);
    await openStaffSidebar(page);
    await expect(
      page.getByRole("button", { name: "Sign out", exact: true }),
    ).toBeVisible();
    if (await page.getByRole("dialog").isVisible()) {
      await expect(page.getByRole("dialog")).toHaveCSS("opacity", "1");
      await page.screenshot({
        path: testInfo.outputPath(`crm-sidebar-${width}.png`),
        animations: "disabled",
      });
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toHaveCount(0);
    }
    await page.screenshot({ path: testInfo.outputPath(`crm-${width}.png`) });
  }

  await page.evaluate(() => {
    document.documentElement.style.zoom = "2";
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("crm-layout-200-percent.png"),
  });
});

test("sidebar reopening preserves pending sign-out and persistent failure feedback", async ({
  page,
}, testInfo) => {
  await signIn(
    page,
    "manager",
    undefined,
    `e2e-navigation-${testInfo.project.name}@example.com`,
  );
  await openStaffSidebar(page);
  let release!: () => void;
  let submissions = 0;
  const responseReady = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/v1/auth/sign-out", async (route) => {
    submissions++;
    await responseReady;
    await route.fulfill({ status: 503, json: { message: "Unavailable" } });
  });

  try {
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await expect.poll(() => submissions).toBe(1);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await openStaffSidebar(page);
    await expect(
      page.getByRole("button", { name: "Signing out…", exact: true }),
    ).toBeDisabled();
    expect(submissions).toBe(1);
  } finally {
    release();
  }

  const feedback = page
    .getByRole("region", { name: "Staff account" })
    .getByRole("alert");
  await expect(feedback).toContainText("We couldn’t sign you out.");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await openStaffSidebar(page);
  await expect(feedback).toContainText("We couldn’t sign you out.");
});

test("anonymous direct CRM requests are protected and login supports keyboard and password managers", async ({
  page,
}) => {
  await page.goto("/crm");
  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("heading", { name: /^(Agency|My) overview$/ }),
  ).toHaveCount(0);
  await expect(page.getByRole("main")).toHaveCount(1);

  const email = page.getByLabel("Email address");
  const password = page.getByLabel("Password", { exact: true });

  await expect(email).toHaveAttribute("autocomplete", "username");
  await expect(password).toHaveAttribute("autocomplete", "current-password");
  await password.fill("pasted password");
  await page.getByRole("button", { name: "Show password" }).click();
  await expect(password).toHaveAttribute("type", "text");
  await expect(password).toHaveValue("pasted password");
  await page.getByRole("button", { name: "Hide password" }).click();
  await expect(password).toHaveAttribute("type", "password");
  await email.fill("bad");
  await password.fill("");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByText("Enter a valid email address.")).toBeVisible();
  await expect(page.getByText("Enter your password.")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("real Better Auth client keeps native credential errors safe and retryable", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email address").fill("missing-staff@example.com");
  await page.getByLabel("Password", { exact: true }).fill("incorrect password");
  await page.getByLabel("Password", { exact: true }).press("Enter");
  await expect(page.locator("form").getByRole("alert")).toHaveText(
    "Email or password is incorrect.",
  );
  await expect(page.getByLabel("Password", { exact: true })).toHaveValue("");
  await expect(page.getByLabel("Email address")).toHaveValue(
    "missing-staff@example.com",
  );
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true }),
  ).toBeEnabled();
  expect(
    await page.evaluate(() => ({
      local: localStorage.length,
      session: sessionStorage.length,
    })),
  ).toEqual({ local: 0, session: 0 });
});

test("delayed hydration keeps controls inert and submits native autofill values", async ({
  page,
}) => {
  let releaseScripts!: () => void;
  const scriptsReady = new Promise<void>((resolve) => {
    releaseScripts = resolve;
  });

  await page.route("**/_next/static/**", async (route) => {
    if (new URL(route.request().url()).pathname.endsWith(".js"))
      await scriptsReady;

    await route.continue();
  });
  await page.route("**/api/v1/auth/sign-in/email", (route) =>
    route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({
        code: "INVALID_EMAIL_OR_PASSWORD",
        message: "Invalid email or password",
      }),
    }),
  );
  await page.goto("/login", { waitUntil: "commit" });

  const email = page.getByLabel("Email address");
  const password = page.getByLabel("Password", { exact: true });
  const show = page.getByRole("button", { name: "Show password" });
  const submit = page.getByRole("button", { name: "Sign in", exact: true });

  try {
    await expect(email).toBeDisabled();
    await expect(password).toBeDisabled();
    await expect(show).toBeDisabled();
    await expect(submit).toBeDisabled();
  } finally {
    releaseScripts();
  }

  await expect(submit).toBeEnabled();
  await expect(show).toBeEnabled();
  // Password managers can update native values without React change events.
  await email.evaluate((element: HTMLInputElement) => {
    element.value = "AUTOFILL@Example.com";
  });
  await password.evaluate((element: HTMLInputElement) => {
    element.value = "  unchanged autofill secret  ";
  });
  await show.click();
  await expect(password).toHaveAttribute("type", "text");
  await expect(password).toHaveValue("  unchanged autofill secret  ");

  const request = page.waitForRequest("**/api/v1/auth/sign-in/email");

  await submit.click();
  expect((await request).postDataJSON()).toEqual({
    email: "autofill@example.com",
    password: "  unchanged autofill secret  ",
    rememberMe: true,
  });
  await expect(page.locator("form").getByRole("alert")).toHaveText(
    "Email or password is incorrect.",
  );
  await expect(password).toHaveValue("");
  await expect(email).toHaveValue("AUTOFILL@Example.com");
});
