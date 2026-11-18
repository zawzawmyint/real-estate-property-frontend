import { createHash, randomUUID } from "node:crypto";
import { chromium, expect, test, type Page } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import { signInDataToolsStaff } from "../fixtures/data-tools-staff";

test.setTimeout(90000);
const headers = { Origin: "http://localhost:3100" };
const signIn = (page: Page, role: "admin" | "manager" | "agent" = "manager") =>
  signInDataToolsStaff(page, "lead-temperature", role);
async function createLead(page: Page, extra = {}) {
  const response = await page.request.post("/api/v1/staff/leads", {
    headers,
    data: {
      submissionId: randomUUID(),
      name: `Temperature ${randomUUID()}`,
      email: `${randomUUID()}@example.test`,
      purpose: "sale",
      source: "call",
      ...extra,
    },
  });
  expect(response.status(), await response.text()).toBe(201);
  return response.json();
}
async function detail(page: Page, id: string) {
  const response = await page.request.get(`/api/v1/staff/leads/${id}`);
  expect(response.status()).toBe(200);
  return response.json();
}
async function rule(page: Page, path: string, method: string, status?: number) {
  const cookie = (await page.context().cookies()).find(
    (c) => c.name === "agency.session",
  );
  expect(cookie).toBeTruthy();
  const response = await page.request.post("http://127.0.0.1:4312/_e2e/rules", {
    data: {
      method,
      path,
      sessionDigest: createHash("sha256")
        .update(decodeURIComponent(cookie!.value))
        .digest("hex"),
      ...(status ? { status } : {}),
    },
  });
  expect(response.status(), await response.text()).toBe(201);
  const { id } = await response.json();
  return {
    wait: () =>
      expect
        .poll(
          async () =>
            (
              await (
                await page.request.get(`http://127.0.0.1:4312/_e2e/rules/${id}`)
              ).json()
            ).hits,
        )
        .toBeGreaterThan(0),
    release: () =>
      page.request.post(`http://127.0.0.1:4312/_e2e/rules/${id}/release`),
    remove: () => page.request.delete(`http://127.0.0.1:4312/_e2e/rules/${id}`),
  };
}
test("rejects repeated temperature at actual list and pipeline entries", async ({
  page,
}) => {
  await signIn(page);
  for (const path of ["/crm/leads", "/crm/leads/pipeline"]) {
    await page.goto(`${path}?temperature=hot&temperature=cold`);
    await expect(
      page.getByText("These lead filters are invalid."),
    ).toBeVisible();
    await expect(page.getByText("Your opportunities")).not.toBeVisible();
  }
});
test("assesses, resets, preserves stage and displays filter/badges/history", async ({
  page,
}, info) => {
  await signIn(page);
  const lead = await createLead(page);
  await page.goto(`/crm/leads/${lead.id}`);
  await expect(page.getByLabel("Temperature", { exact: true })).toHaveValue(
    "unassessed",
  );
  await page.getByLabel("Temperature", { exact: true }).selectOption("hot");
  await page
    .getByRole("button", { name: "Save temperature", exact: true })
    .click();
  await expect(
    page.getByText("Temperature changed · Not assessed → Hot"),
  ).toBeVisible();
  expect(await detail(page, lead.id)).toMatchObject({
    temperature: "hot",
    stage: "new",
    version: 2,
  });
  await page.screenshot({
    path: info.outputPath("temperature-detail.png"),
    fullPage: true,
  });
  await page.goto(
    `/crm/leads?view=all&q=${encodeURIComponent(lead.name)}&temperature=hot`,
  );
  await expect(
    page.getByRole("link", { name: lead.name, exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Hot", { exact: true }).filter({ visible: true }).first(),
  ).toBeVisible();
  await page.goto(
    `/crm/leads/pipeline?view=all&q=${encodeURIComponent(lead.name)}&temperature=hot`,
  );
  await expect(
    page.getByRole("link", { name: lead.name, exact: true }),
  ).toBeVisible();
  await page.goto(`/crm/leads/${lead.id}`);
  await page
    .getByLabel("Temperature", { exact: true })
    .selectOption("unassessed");
  await page
    .getByRole("button", { name: "Save temperature", exact: true })
    .click();
  await expect(
    page.getByText("Temperature changed · Hot → Not assessed"),
  ).toBeVisible();
});
test("allows assigned Agent, hides other leads and recovers stale versions without losing note drafts", async ({
  page,
}) => {
  await signIn(page, "agent");
  const own = await createLead(page);
  await page.goto(`/crm/leads/${own.id}`);
  await page.getByLabel("Temperature", { exact: true }).selectOption("warm");
  const note = page.getByLabel("Note", { exact: true });
  await note.fill("Preserve this unsaved note");
  expect(
    (
      await page.request.patch(`/api/v1/staff/leads/${own.id}/temperature`, {
        headers,
        data: { expectedVersion: 1, temperature: "hot" },
      })
    ).status(),
  ).toBe(200);
  await page
    .getByRole("button", { name: "Save temperature", exact: true })
    .click();
  await expect(page.getByText(/Review.*temperature/i).first()).toBeVisible();
  await expect(note).toHaveValue("Preserve this unsaved note");
  await expect(page.getByLabel("Temperature", { exact: true })).toHaveValue(
    "warm",
  );
  await page
    .getByRole("button", { name: "Save temperature", exact: true })
    .click();
  await expect(
    page.getByText("Temperature changed · Hot → Warm"),
  ).toBeVisible();
  await signIn(page);
  const other = await createLead(page);
  await signIn(page, "agent");
  expect(
    (await page.request.get(`/api/v1/staff/leads/${other.id}`)).status(),
  ).toBe(404);
});
test("blocks assignment while temperature is pending and until failed reconciliation recovers", async ({
  page,
}) => {
  await signIn(page);
  const lead = await createLead(page);
  await page.goto(`/crm/leads/${lead.id}`);
  const mutation = await rule(
    page,
    `/api/v1/staff/leads/${lead.id}/temperature`,
    "PATCH",
    503,
  );
  const read = await rule(page, `/api/v1/staff/leads/${lead.id}`, "GET", 503);
  try {
    await page.getByLabel("Temperature", { exact: true }).selectOption("hot");
    await page
      .getByRole("button", { name: "Save temperature", exact: true })
      .click();
    await mutation.wait();
    await expect(
      page.getByRole("button", { name: "Assign agent", exact: true }),
    ).toBeDisabled();
    await mutation.release();
    await read.wait();
    await read.release();
    await expect(
      page.getByRole("button", { name: "Reload latest lead" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Assign agent", exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "Save temperature", exact: true }),
    ).toBeDisabled();
    await mutation.remove();
    await read.remove();
    await page.getByRole("button", { name: "Reload latest lead" }).click();
    await expect(
      page.getByRole("button", { name: "Assign agent", exact: true }),
    ).toBeEnabled();
    await expect(page.getByLabel("Temperature", { exact: true })).toHaveValue(
      "hot",
    );
    await page
      .getByRole("button", { name: "Save temperature", exact: true })
      .click();
    await expect(
      page.getByText("Temperature changed · Not assessed → Hot"),
    ).toBeVisible();
  } finally {
    await mutation.remove();
    await read.remove();
  }
});

test("reconciles a lost successful response without retrying or adding duplicate history", async ({
  page,
}) => {
  await signIn(page);
  const lead = await createLead(page);
  await page.goto(`/crm/leads/${lead.id}`);
  let intercepted = false;
  await page.route(`**/crm/leads/${lead.id}`, async (route) => {
    if (
      route.request().method() !== "POST" ||
      !route.request().headers()["next-action"] ||
      intercepted
    ) {
      await route.continue();
      return;
    }
    intercepted = true;
    await route.fetch();
    await route.abort("failed");
  });
  await page.getByLabel("Temperature", { exact: true }).selectOption("hot");
  await page
    .getByRole("button", { name: "Save temperature", exact: true })
    .click();
  await expect(
    page.getByText(/current saved temperature/i).first(),
  ).toBeVisible();
  expect(intercepted).toBe(true);
  expect(await detail(page, lead.id)).toMatchObject({
    temperature: "hot",
    version: 2,
  });
  const activity = await (
    await page.request.get(`/api/v1/staff/leads/${lead.id}/activity`)
  ).json();
  expect(
    activity.items.filter(
      (event: { type: string }) => event.type === "temperature_changed",
    ),
  ).toHaveLength(1);
  await expect(
    page.getByRole("button", { name: "Save temperature", exact: true }),
  ).toBeDisabled();
});

test("coordinates an already-open assignment dialog and blocks temperature during assignment", async ({
  page,
}) => {
  const agent = await signIn(page, "agent");
  await signIn(page);
  const lead = await createLead(page);
  await page.goto(`/crm/leads/${lead.id}`);
  await page.getByLabel("Temperature", { exact: true }).selectOption("warm");
  await page.getByRole("button", { name: "Assign agent", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Search active agents").fill(agent.name);
  await dialog.getByRole("radio", { name: agent.name, exact: true }).check();
  const held = await rule(
    page,
    `/api/v1/staff/leads/${lead.id}/temperature`,
    "PATCH",
  );
  try {
    await page.evaluate(() =>
      (
        document
          .getElementById("detail-temperature")!
          .closest("form") as HTMLFormElement
      ).requestSubmit(),
    );
    await held.wait();
    await expect(
      dialog.getByRole("button", { name: "Assign agent", exact: true }),
    ).toBeDisabled();
    await held.release();
    await expect(
      dialog.getByRole("button", { name: "Assign agent", exact: true }),
    ).toBeEnabled();
  } finally {
    await held.remove();
  }
  // The dialog was opened with an older version: its first save must reconcile.
  await dialog
    .getByRole("button", { name: "Assign agent", exact: true })
    .click();
  await expect(dialog.getByText(/Review the current assignment/)).toBeVisible();
  const assignment = await rule(
    page,
    `/api/v1/staff/leads/${lead.id}/assignment`,
    "PATCH",
  );
  try {
    await dialog
      .getByRole("button", { name: "Assign agent", exact: true })
      .click();
    await assignment.wait();
    await page.evaluate(() =>
      (
        document
          .getElementById("detail-temperature")!
          .closest("form") as HTMLFormElement
      ).requestSubmit(),
    );
    await expect(
      page.getByLabel("Temperature", { exact: true }),
    ).toBeDisabled();
    await assignment.release();
    await expect(dialog).not.toBeVisible();
    expect(await detail(page, lead.id)).toMatchObject({
      temperature: "warm",
      version: 3,
      assignedAgent: { id: agent.id },
    });
  } finally {
    await assignment.remove();
  }
});

test("routes expired sessions to sign-in without saving a temperature", async ({
  page,
}) => {
  await signIn(page);
  const lead = await createLead(page);
  await page.goto(`/crm/leads/${lead.id}`);
  await page.getByLabel("Temperature", { exact: true }).selectOption("hot");
  await page.request.post("/api/v1/auth/sign-out", { headers, data: {} });
  await page
    .getByRole("button", { name: "Save temperature", exact: true })
    .click();
  await expect(page).toHaveURL(/\/login/);
  await signIn(page);
  expect((await detail(page, lead.id)).temperature).toBe("unassessed");
});

test("temperature controls reflow at 320 to 1440px and native 200 percent zoom", async ({}, info) => {
  test.skip(
    info.project.name !== "desktop",
    "One full-browser responsive/zoom sweep.",
  );
  const executablePath = process.env.PUBLIC_BROWSER_EXECUTABLE;
  test.skip(
    !executablePath,
    "Requires an opt-in full Chrome/Chromium executable.",
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
    const login = await page.request.post(
      "http://localhost:3100/api/v1/auth/sign-in/email",
      {
        headers,
        data: {
          email: "e2e-lead-temperature-desktop-admin@example.com",
          password: process.env.STAFF_E2E_PASSWORD,
          rememberMe: true,
        },
      },
    );
    expect(login.status()).toBe(200);
    const result = await page.request.post(
      "http://localhost:3100/api/v1/staff/leads",
      {
        headers,
        data: {
          submissionId: randomUUID(),
          name: `Temperature layout ${randomUUID()}`,
          email: `${randomUUID()}@example.test`,
          purpose: "sale",
          source: "call",
        },
      },
    );
    expect(result.status()).toBe(201);
    const lead = await result.json();
    await page.goto(`http://localhost:3100/crm/leads/${lead.id}`);
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page
        .getByRole("button", { name: "Save temperature", exact: true })
        .scrollIntoViewIfNeeded();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBe(width);
      await expect(
        page.getByLabel("Temperature", { exact: true }),
      ).toBeVisible();
      await page.screenshot({
        path: info.outputPath(`temperature-${width}.png`),
      });
    }
    await context.close();
    // Native zoom needs a fresh context with browser-owned window dimensions.
  } finally {
    await context.close();
  }
  const zoom = await chromium.launchPersistentContext("", {
    executablePath,
    headless: true,
    viewport: null,
    deviceScaleFactor: undefined,
    isMobile: undefined,
    args: ["--window-size=1280,1000"],
  });
  try {
    const page = await zoom.newPage();
    await page.request.post("http://localhost:3100/api/v1/auth/sign-in/email", {
      headers,
      data: {
        email: "e2e-lead-temperature-desktop-admin@example.com",
        password: process.env.STAFF_E2E_PASSWORD,
        rememberMe: true,
      },
    });
    const response = await page.request.get(
      "http://localhost:3100/api/v1/staff/leads?view=all&sort=newest",
    );
    const lead = (await response.json()).items[0];
    await page.goto(`http://localhost:3100/crm/leads/${lead.id}`);
    const baseline = await page.evaluate(() => ({
      width: innerWidth,
      ratio: devicePixelRatio,
    }));
    const cdp = await zoom.newCDPSession(page);
    const { windowId, bounds } = await cdp.send("Browser.getWindowForTarget");
    await cdp.send("Browser.setWindowBounds", {
      windowId,
      bounds: { width: bounds.width! + 1280 - baseline.width },
    });
    await expect.poll(() => page.evaluate(() => innerWidth)).toBe(1280);
    const settings = await zoom.newPage();
    await settings.goto("chrome://settings/appearance");
    await settings.locator("#zoomLevel").selectOption("2");
    await settings.close();
    await page.reload();
    await expect.poll(() => page.evaluate(() => innerWidth)).toBe(640);
    expect(await page.evaluate(() => devicePixelRatio)).toBe(
      baseline.ratio * 2,
    );
    await page.getByLabel("Temperature", { exact: true }).selectOption("hot");
    await page
      .getByRole("button", { name: "Save temperature", exact: true })
      .click();
    await expect(page.getByText(/Temperature changed.*Hot/)).toBeVisible();
    await page
      .getByRole("button", { name: "Save temperature", exact: true })
      .scrollIntoViewIfNeeded();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(640);
    // Native browser zoom needs physical viewport capture; Playwright's CSS
    // screenshot clip can otherwise produce an empty image after scrolling.
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    const { data } = await cdp.send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: false,
    });
    await writeFile(
      info.outputPath("temperature-native-zoom-200.png"),
      Buffer.from(data, "base64"),
    );
    await writeFile(
      info.outputPath("temperature-native-zoom-200.json"),
      JSON.stringify(
        await page.evaluate(() => ({
          width: innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          ratio: devicePixelRatio,
        })),
        null,
        2,
      ),
    );
  } finally {
    await zoom.close();
  }
});

test("assignment in an open dialog routes an expired session to sign-in", async ({
  page,
}) => {
  const agent = await signIn(page, "agent");
  await signIn(page);
  const lead = await createLead(page);
  await page.goto(`/crm/leads/${lead.id}`);
  await page.getByRole("button", { name: "Assign agent", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Search active agents").fill(agent.name);
  await dialog.getByRole("radio", { name: agent.name, exact: true }).check();
  await page.request.post("/api/v1/auth/sign-out", { headers, data: {} });
  await dialog
    .getByRole("button", { name: "Assign agent", exact: true })
    .click();
  await expect(page).toHaveURL(/\/login/);
  await expect(
    page.getByRole("heading", { name: lead.name, exact: true }),
  ).not.toBeVisible();
});
