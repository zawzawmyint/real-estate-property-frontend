import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import {
  chromium,
  expect,
  test,
  type Cookie,
  type Page,
} from "@playwright/test";

test.setTimeout(120_000);

const origin = "http://localhost:3100";
const headers = { Origin: origin };
const sessions = new Map<
  string,
  { cookies: Cookie[]; user: { id: string; name: string } }
>();

function uniqueLabel(kind: string) {
  const suffix = randomUUID()
    .replace(/\d/g, (digit) => String.fromCharCode(107 + Number(digit)))
    .slice(0, 12);
  return `Duplicate ${kind} ${suffix}`;
}

function uniquePhone() {
  const digits = randomUUID().replace(/\D/g, "").padEnd(7, "7").slice(0, 7);
  return `+971 50 ${digits}`;
}

function formattedUaeLocalPhone(phone: string) {
  const national = `0${phone.replace(/\D/g, "").slice(3)}`;
  return `(${national.slice(0, 3)}) ${national.slice(3, 6)}-${national.slice(6)}`;
}

function csvFile(prefix: string, phone: string) {
  const cell = (value: string) => `"${value.replaceAll('"', '""')}"`;
  const rows = [
    [`${prefix} first`, phone, "", "sale", "", "call"],
    [`${prefix} second`, phone, "", "rent", "", "walk_in"],
  ];
  return {
    name: "duplicate-leads.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      [["name", "phone", "email", "purpose", "budget_aed", "source"], ...rows]
        .map((row) => row.map(cell).join(","))
        .join("\r\n") + "\r\n",
    ),
  };
}

async function signIn(page: Page, identity = "manager") {
  const key = `${test.info().project.name}-${identity}`;
  const cached = sessions.get(key);
  await page.context().clearCookies();
  if (cached) {
    await page.context().addCookies(cached.cookies);
    return cached.user;
  }
  const response = await page.request.post("/api/v1/auth/sign-in/email", {
    headers,
    data: {
      email: `e2e-lead-${key}@example.com`,
      password: process.env.STAFF_E2E_PASSWORD,
      rememberMe: true,
    },
  });
  expect(response.status(), await response.text()).toBe(200);
  const session = await page.request.get("/api/v1/auth/get-session");
  const user = (await session.json()).user as { id: string; name: string };
  sessions.set(key, { cookies: await page.context().cookies(), user });
  return user;
}

async function createLead(page: Page, input: Record<string, unknown> = {}) {
  const payload = {
    submissionId: randomUUID(),
    name: uniqueLabel("seed"),
    phone: uniquePhone(),
    purpose: "sale",
    source: "call",
    ...input,
  };
  let response = await page.request.post("/api/v1/staff/leads", {
    headers,
    data: payload,
  });
  if (response.status() === 409) {
    const conflict = (await response.json()) as {
      duplicateReview?: { reviewToken?: string };
    };
    expect(conflict.duplicateReview?.reviewToken).toMatch(/^[a-f0-9]{64}$/);
    response = await page.request.post("/api/v1/staff/leads", {
      headers,
      data: {
        ...payload,
        duplicateAcknowledgement: {
          reviewToken: conflict.duplicateReview!.reviewToken,
        },
      },
    });
  }
  expect(response.status(), await response.text()).toBe(201);
  return (await response.json()) as {
    id: string;
    name: string;
    phone: string;
    version: number;
  };
}

async function acknowledgeLeadWarning(page: Page) {
  const acknowledgement = page.getByLabel(
    "I reviewed the matches and want to save a separate lead.",
    { exact: true },
  );
  await expect(acknowledgement).toBeVisible();
  await expect(acknowledgement).not.toBeChecked();
  await acknowledgement.check();
}

async function previewImport(page: Page, file: ReturnType<typeof csvFile>) {
  await page.getByLabel("CSV file", { exact: true }).setInputFiles(file);
  await page.getByRole("button", { name: "Preview CSV", exact: true }).click();
}

test("manual review is explicit, then unrelated edits retain the saved phone decision", async ({
  page,
}, info) => {
  await signIn(page);
  const phone = uniquePhone();
  const existing = await createLead(page, { phone });
  const separate = uniqueLabel("separate");

  await page.goto("/crm/leads/new");
  await page.getByLabel("Name", { exact: true }).fill(separate);
  await page
    .getByLabel("Phone", { exact: true })
    .fill(formattedUaeLocalPhone(phone));
  await page.getByLabel("Phone", { exact: true }).press("Tab");
  await expect(
    page.getByText("Possible duplicate phone number", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: existing.name, exact: true }),
  ).toBeVisible();
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      animations: "disabled",
      path: info.outputPath(`manual-duplicate-${width}.png`),
      fullPage: true,
    });
  }

  await page.getByRole("button", { name: "Save lead", exact: true }).click();
  await expect(
    page.getByText("Acknowledge the matching phone number before saving."),
  ).toBeVisible();
  await expect(
    page
      .locator('[tabindex="-1"]')
      .filter({ hasText: "Acknowledge the matching phone number" }),
  ).toBeFocused();
  await acknowledgeLeadWarning(page);
  await page.getByRole("button", { name: "Save lead", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: separate, exact: true }),
  ).toBeVisible();
  await page.screenshot({
    animations: "disabled",
    path: info.outputPath("manual-duplicate-saved.png"),
    fullPage: true,
  });

  await page.getByRole("link", { name: "Edit details", exact: true }).click();
  await page.getByLabel("Email", { exact: true }).fill("changed@example.com");
  await expect(
    page.getByText("Possible duplicate phone number", { exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: separate, exact: true }),
  ).toBeVisible();
});

test("list filter and detail review expose only scoped duplicate summaries", async ({
  page,
}, info) => {
  await signIn(page);
  const phone = uniquePhone();
  const prefix = uniqueLabel("list");
  const first = await createLead(page, {
    phone,
    name: `${prefix} first`,
  });
  const second = await createLead(page, {
    phone,
    name: `${prefix} second`,
  });
  const query = prefix;

  await page.goto(`/crm/leads?view=all&q=${encodeURIComponent(query)}`);
  if (info.project.name === "mobile") {
    await page.getByRole("button", { name: /^Filters/ }).click();
    const sheet = page.getByRole("dialog", { name: "Filter leads" });
    await sheet
      .getByLabel("Possible duplicates", { exact: true })
      .selectOption("only");
    await sheet
      .getByRole("button", { name: "Apply filters", exact: true })
      .click();
  } else {
    await page.getByRole("button", { name: /^Filters/ }).click();
    await page
      .getByLabel("Possible duplicates", { exact: true })
      .selectOption("only");
  }
  await expect
    .poll(() => new URL(page.url()).searchParams.get("duplicates"))
    .toBe("only");
  await expect(
    page.getByRole("link", { name: first.name, exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: second.name, exact: true }),
  ).toBeVisible();
  const duplicateBadges = page.locator('span[data-slot="badge"]:visible', {
    hasText: "1 possible duplicate",
  });
  await expect(duplicateBadges).toHaveCount(2);
  await expect(duplicateBadges.first()).toBeVisible();

  await page.getByRole("link", { name: first.name, exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Phone duplicate review", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Review matching leads", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: second.name, exact: true }),
  ).toBeVisible();
  await page.screenshot({
    animations: "disabled",
    path: info.outputPath("list-detail-duplicates.png"),
    fullPage: true,
  });
});

test("an Agent cannot infer another Agent's matching lead", async ({
  page,
}) => {
  await signIn(page, "manager");
  const hiddenOwner = await signIn(page, "other-agent");
  await signIn(page, "manager");
  const phone = uniquePhone();
  await createLead(page, {
    phone,
    name: uniqueLabel("hidden owner"),
    assignedAgentId: hiddenOwner.id,
  });

  await signIn(page, "agent");
  const ownName = uniqueLabel("agent separate");
  await page.goto("/crm/leads/new");
  await page.getByLabel("Name", { exact: true }).fill(ownName);
  await page.getByLabel("Phone", { exact: true }).fill(phone);
  await page.getByLabel("Phone", { exact: true }).press("Tab");
  await expect(
    page.getByText("Possible duplicate phone number", { exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Save lead", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: ownName, exact: true }),
  ).toBeVisible();
});

test("public repeated enquiries remain undisclosed and become CRM duplicates", async ({
  page,
}, info) => {
  const phone = uniquePhone();
  const prefix = uniqueLabel("public inquiry");
  for (const suffix of ["first", "second"]) {
    await page.goto("/contact");
    await page
      .getByLabel("Full name", { exact: true })
      .fill(`${prefix} ${suffix}`);
    await page
      .getByLabel("I'm looking to", { exact: true })
      .selectOption("rent");
    await page.getByLabel("Email", { exact: true }).fill("");
    await page.getByLabel("Phone", { exact: true }).fill(phone);
    await page
      .getByLabel("Message", { exact: true })
      .fill("Fictional repeat enquiry.");
    await page
      .getByRole("button", { name: "Send enquiry", exact: true })
      .click();
    await expect(
      page.getByText("Your enquiry has been received.", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText(/duplicate phone/i)).toHaveCount(0);
  }

  await signIn(page);
  await page.goto(`/crm/leads?view=all&q=${encodeURIComponent(prefix)}`);
  await expect(
    page.getByRole("link", { name: `${prefix} first`, exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: `${prefix} second`, exact: true }),
  ).toBeVisible();
  const duplicateBadges = page.locator('span[data-slot="badge"]:visible', {
    hasText: "1 possible duplicate",
  });
  await expect(duplicateBadges).toHaveCount(2);
  await expect(duplicateBadges.first()).toBeVisible();
  await page.screenshot({
    animations: "disabled",
    path: info.outputPath("public-repeat-crm.png"),
    fullPage: true,
  });
});

test("CSV warnings cover file and database matches, reject stale acknowledgement, and re-preview", async ({
  page,
}, info) => {
  await signIn(page);
  const phone = uniquePhone();
  await createLead(page, { phone, name: uniqueLabel("database import match") });
  const prefix = uniqueLabel("CSV warning");
  const file = csvFile(prefix, phone);

  await page.goto("/crm/leads/import");
  await previewImport(page, file);
  const confirm = page.getByRole("button", {
    name: "Import 2 leads",
    exact: true,
  });
  await expect(
    page.getByText("Possible duplicate phone numbers", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(
      /2 rows have matching phone numbers: 2 match existing leads and 2 match other rows in this file/,
    ),
  ).toBeVisible();
  await expect(confirm).toBeDisabled();
  await page.screenshot({
    animations: "disabled",
    path: info.outputPath("csv-duplicate-warning.png"),
    fullPage: true,
  });
  const acknowledgement = page.getByLabel(
    "I reviewed the duplicate phone warnings and want to import every valid row as a separate lead.",
    { exact: true },
  );
  await acknowledgement.check();
  await expect(confirm).toBeEnabled();

  await createLead(page, { phone, name: uniqueLabel("stale database match") });
  await confirm.click();
  await expect(
    page.getByText(
      /Matching phone numbers changed\. Preview the same file and acknowledge the current warnings/,
    ),
  ).toBeVisible();
  await expect(confirm).toHaveCount(0);

  await previewImport(page, file);
  await expect(acknowledgement).not.toBeChecked();
  await acknowledgement.check();
  await confirm.click();
  await expect(
    page.getByRole("heading", { name: "Import complete", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    animations: "disabled",
    path: info.outputPath("csv-duplicate-confirmed.png"),
    fullPage: true,
  });
});

test("manual duplicate warning reflows at native 200 percent browser zoom", async ({}, info) => {
  test.skip(info.project.name !== "desktop", "One full-browser zoom sweep.");
  const executablePath = process.env.PUBLIC_BROWSER_EXECUTABLE;
  test.skip(
    !executablePath,
    "Requires the disposable full-browser executable.",
  );
  const context = await chromium.launchPersistentContext("", {
    executablePath,
    headless: true,
    viewport: null,
    deviceScaleFactor: undefined,
    isMobile: undefined,
    args: ["--window-size=1280,1000"],
  });
  try {
    const page = await context.newPage();
    context.setDefaultTimeout(10_000);
    const login = await page.request.post(
      "http://localhost:3100/api/v1/auth/sign-in/email",
      {
        headers,
        data: {
          email: "e2e-lead-desktop-manager@example.com",
          password: process.env.STAFF_E2E_PASSWORD,
          rememberMe: true,
        },
      },
    );
    expect(login.status(), await login.text()).toBe(200);
    const phone = uniquePhone();
    const seeded = await page.request.post(
      "http://localhost:3100/api/v1/staff/leads",
      {
        headers,
        data: {
          submissionId: randomUUID(),
          name: uniqueLabel("native zoom match"),
          phone,
          purpose: "sale",
          source: "call",
        },
      },
    );
    expect(seeded.status(), await seeded.text()).toBe(201);
    await page.goto("http://localhost:3100/crm/leads/new");
    const baseline = await page.evaluate(() => ({
      width: innerWidth,
      ratio: devicePixelRatio,
    }));
    const cdp = await context.newCDPSession(page);
    const { windowId, bounds } = await cdp.send("Browser.getWindowForTarget");
    if (bounds.width === undefined)
      throw new Error("Native browser window width is unavailable");
    await cdp.send("Browser.setWindowBounds", {
      windowId,
      bounds: { width: bounds.width + 1280 - baseline.width },
    });
    await expect.poll(() => page.evaluate(() => innerWidth)).toBe(1280);
    const settings = await context.newPage();
    await settings.goto("chrome://settings/appearance");
    await settings.locator("#zoomLevel").selectOption("2");
    await settings.close();

    await page.reload();
    await expect.poll(() => page.evaluate(() => innerWidth)).toBe(640);
    expect(await page.evaluate(() => devicePixelRatio)).toBe(
      baseline.ratio * 2,
    );
    await page
      .getByLabel("Name", { exact: true })
      .fill(uniqueLabel("native zoom"));
    await page
      .getByLabel("Phone", { exact: true })
      .fill(formattedUaeLocalPhone(phone));
    await page.getByLabel("Phone", { exact: true }).press("Tab");
    const warning = page.getByRole("status").filter({
      has: page.getByText("Possible duplicate phone number", {
        exact: true,
      }),
    });
    await expect(warning).toBeVisible();
    await warning.scrollIntoViewIfNeeded();
    const metrics = await page.evaluate(() => {
      const dimensions = (element: Element | null) => {
        if (!element) return null;
        const { x, y, width, height } = element.getBoundingClientRect();
        return { x, y, width, height };
      };
      const warning = Array.from(
        document.querySelectorAll('[role="status"]'),
      ).find((element) =>
        element.textContent?.includes("Possible duplicate phone number"),
      );
      return {
        innerWidth,
        innerHeight,
        scrollWidth: document.documentElement.scrollWidth,
        main: dimensions(document.querySelector("main")),
        form: dimensions(document.querySelector("form")),
        warning: dimensions(warning ?? null),
      };
    });
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.innerWidth);
    expect(metrics.warning).not.toBeNull();
    await writeFile(
      info.outputPath("manual-duplicate-native-zoom-200-layout.json"),
      JSON.stringify(metrics, null, 2),
    );
    const screenshot = await cdp.send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: false,
    });
    await writeFile(
      info.outputPath("manual-duplicate-native-zoom-200.png"),
      Buffer.from(screenshot.data, "base64"),
    );
  } finally {
    await context.close();
  }
});
