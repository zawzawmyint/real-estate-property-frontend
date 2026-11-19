import { createHash } from "node:crypto";
import { readFile, realpath, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { chromium, expect, test, type Page } from "@playwright/test";
import type { AgentPerformanceReport } from "@/features/reports/agent-performance/response";
import { signInDataToolsStaff } from "../fixtures/data-tools-staff";

test.skip(
  process.env.STAFF_E2E_AGENT_PERFORMANCE !== "1" ||
    process.env.STAFF_E2E_DASHBOARD_ONLY === "1",
  "Requires the dedicated reporting backend fixture.",
);

const route = "/crm/reports/agents";
const api = "/api/v1/staff/reports/agent-performance";
const range = "from=2025-11-01&to=2025-11-05";
const control = "http://127.0.0.1:4312/_e2e/rules";
const signIn = (page: Page, role: "manager" | "agent", identity?: string) =>
  signInDataToolsStaff(page, "agent-performance", role, identity);
const table = (page: Page) =>
  page.getByRole("table", { name: "Agent performance metrics" });
const dateApply = (page: Page) =>
  page.getByRole("button", { name: "Apply dates" });
const refresh = (page: Page) =>
  page.getByRole("button", { name: "Refresh", exact: true });

async function report(
  page: Page,
  filters = range,
): Promise<AgentPerformanceReport> {
  const response = await page.request.get(`${api}?${filters}`);
  expect(response.status(), await response.text()).toBe(200);
  expect(response.headers()["cache-control"]).toContain("no-store");
  return response.json();
}

async function reportRule(
  page: Page,
  rule: {
    status?: 503 | 422;
    query?: Record<string, string>;
  } = {},
) {
  const session = (await page.context().cookies()).find(
    ({ name }) => name === "agency.session",
  );
  if (!session) throw new Error("Expected a signed reporting fixture session.");
  const response = await page.request.post(control, {
    data: {
      method: "GET",
      path: api,
      sessionDigest: createHash("sha256")
        .update(decodeURIComponent(session.value))
        .digest("hex"),
      ...rule,
    },
  });
  expect(response.status(), await response.text()).toBe(201);
  const { id } = (await response.json()) as { id: string };
  const url = `${control}/${id}`;
  return {
    hits: async () =>
      (await (await page.request.get(url)).json()).hits as number,
    release: () => page.request.post(`${url}/release`),
    remove: () => page.request.delete(url),
  };
}

test("manager sees known history, selects inactive and former agents, and keeps pagination URL state", async ({
  page,
}, info) => {
  await signIn(page, "manager");
  const agency = await report(page);
  const person = `Report ${info.project.name}`;
  const own = agency.agentOptions.find(
    ({ name }) => name === `${person} agent`,
  );
  const inactive = agency.agentOptions.find(
    ({ name }) => name === `${person} inactive`,
  );
  const former = agency.agentOptions.find(
    ({ id }) => id === `report-former-${info.project.name}`,
  );
  if (!own || !inactive || !former)
    throw new Error("Expected seeded reporting identities.");
  expect(inactive.availability).toBe("inactive");
  expect(former.availability).toBe("former");
  expect(agency.coverage.unattributedFirstWinCount).toBe(2);

  await page.goto(`${route}?${range}`);
  await expect(
    page.getByRole("heading", { name: "Agent results" }),
  ).toBeVisible();
  await expect(page.getByText("Unattributed first wins · 2")).toBeVisible();
  await expect(
    page.getByText("Private reporting fixture", { exact: false }),
  ).toHaveCount(0);
  if (info.project.name === "desktop") {
    await expect(page.getByRole("link", { name: "Reports" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  }
  const next = page.getByRole("link", { name: "Go to next page" });
  expect(agency.total).toBeGreaterThan(25);
  await next.click();
  await expect(page).toHaveURL(new RegExp(`${range}&page=2$`));
  await expect(table(page)).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(new RegExp(`${range}$`));
  await page.getByLabel("Agent", { exact: true }).selectOption(inactive.id);
  await page.getByRole("button", { name: "Apply agent" }).click();
  const inactiveRow = table(page)
    .getByRole("row")
    .filter({ hasText: inactive.name });
  await expect(inactiveRow.getByRole("cell")).toHaveText([
    `${inactive.name}Inactive`,
    "1",
    "1",
    "1",
    "30m1 completed episode",
    "0",
    "0",
  ]);
  await expect(
    page.getByLabel("Agent", { exact: true }).locator("option"),
  ).toHaveCount(2);
  await expect(page).toHaveURL(new RegExp(`agentId=${inactive.id}$`));
  await page.reload();
  await expect(inactiveRow).toBeVisible();
  await expect(page.getByLabel("Agent", { exact: true })).toHaveValue(
    inactive.id,
  );

  await page.getByLabel("Agent", { exact: true }).selectOption("");
  await page.getByRole("button", { name: "Apply agent" }).click();
  await expect(
    page.getByLabel("Agent", { exact: true }).locator("option"),
  ).toHaveCount(agency.total + 1);
  await page.getByLabel("Agent", { exact: true }).selectOption(former.id);
  await page.getByRole("button", { name: "Apply agent" }).click();
  const formerRow = table(page)
    .getByRole("row")
    .filter({ hasText: former.name });
  await expect(formerRow.getByRole("cell")).toHaveText([
    `${former.name}Former agent`,
    "0",
    "0",
    "1",
    "—0 completed episodes",
    "0",
    "1",
  ]);

  await page.getByLabel("Start date").fill("2025-11-04");
  await page.getByLabel("Rows per page").selectOption("50");
  await dateApply(page).click();
  await expect(page).toHaveURL(
    /from=2025-11-04&to=2025-11-05&agentId=.+&pageSize=50$/,
  );
  await expect(formerRow.getByRole("cell").nth(3)).toHaveText("0");
  await page.goBack();
  await expect(page.getByLabel("Start date")).toHaveValue("2025-11-01");
  await expect(formerRow.getByRole("cell").nth(3)).toHaveText("1");
  await page.goForward();
  await expect(page.getByLabel("Rows per page")).toHaveValue("50");
  await expect(formerRow.getByRole("cell").nth(3)).toHaveText("0");

  await page.goto(`${route}?${range}&page=999`);
  await expect(
    page.getByText("No agents on this page", { exact: false }),
  ).toBeVisible();
  await expect(table(page)).toHaveCount(0);
});

test("signed-in date and agent actions are disabled before hydration", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ baseURL });
  try {
    // Keep the server's inline stream inserters active, while preventing hydration.
    await context.route(/\/_next\/static\/.*\.js(?:\?|$)/, (route) =>
      route.abort(),
    );
    const page = await context.newPage();
    await signIn(page, "manager");
    await page.goto(`${route}?${range}`);
    await expect(
      page.getByRole("heading", { name: "Agent performance" }),
    ).toBeVisible();
    await expect(dateApply(page)).toBeDisabled();
    await expect(refresh(page)).toBeDisabled();
    await expect(
      page.locator('form[data-report-form="agent"] button'),
    ).toBeDisabled();
  } finally {
    await context.close();
  }
});

test("direct Back and Forward revalidate a changed role before revealing report results", async ({
  page,
}, info) => {
  test.skip(
    !process.env.STAFF_E2E_STATE_FILE,
    "Requires the disposable fixture's state file.",
  );
  const owner = await signIn(page, "manager", "role");
  const state = JSON.parse(
    await readFile(process.env.STAFF_E2E_STATE_FILE!, "utf8"),
  ) as { databaseUrl: string };
  if (!state.databaseUrl.startsWith("file:"))
    throw new Error("Invalid disposable SQLite URL.");
  const dbPath = await realpath(state.databaseUrl.slice(5));
  const dbDirectory = dirname(dbPath);
  if (
    basename(dbPath) !== "auth.db" ||
    !basename(dbDirectory).startsWith("agency-auth-") ||
    dirname(dbDirectory) !== (await realpath(tmpdir()))
  ) {
    throw new Error("Role test requires the isolated auth fixture database.");
  }

  await page.goto(`${route}?${range}`);
  await expect(page.getByLabel("Agent", { exact: true })).toBeVisible();
  await page.getByLabel("Start date").fill("2025-11-02");
  await dateApply(page).click();
  await expect(page.getByLabel("Agent", { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/from=2025-11-02&to=2025-11-05$/);

  const database = new DatabaseSync(dbPath);
  const update = database.prepare(
    'UPDATE "User" SET role = ? WHERE id = ? AND email = ?',
  );
  const changeRole = (role: string) =>
    update.run(
      role,
      owner.id,
      `e2e-agent-performance-${info.project.name}-role@example.com`,
    );
  const back = await reportRule(page, { query: { from: "2025-11-01" } });
  const forward = await reportRule(page, { query: { from: "2025-11-02" } });
  const selector = page.getByLabel("Agent", { exact: true });
  const ownResults = page.getByRole("heading", { name: "Your results" });

  try {
    expect(changeRole("agent").changes).toBe(1);

    for (const [direction, date, read] of [
      ["back", "2025-11-01", back],
      ["forward", "2025-11-02", forward],
    ] as const) {
      await page.evaluate(
        (direction) => window.history[direction](),
        direction,
      );
      await expect(page).toHaveURL(new RegExp(`from=${date}&to=2025-11-05$`));
      await expect
        .poll(read.hits, {
          message: `History ${direction} makes one fresh authorized report read`,
        })
        .toBe(1);
      await expect(table(page)).toBeHidden();
      await expect(selector).toBeHidden();
      await expect(page.getByText("Loading agent performance…")).toBeVisible();
      await read.release();
      await expect(ownResults).toBeVisible();
      await expect(selector).toHaveCount(0);
      await expect(table(page).getByRole("row")).toHaveCount(2);
      await expect(
        table(page).getByText(owner.name, { exact: true }),
      ).toBeVisible();
      expect(await read.hits()).toBe(1);
    }
  } finally {
    await Promise.all([back.remove(), forward.remove()]);
    changeRole("manager");
    database.close();
  }
});

for (const direction of ["back", "forward"] as const) {
  test(`dirty task can stay twice and then open the report going ${direction}`, async ({
    page,
  }, info) => {
    // Exercise the older-browser history fallback as well as native entry positions.
    if (info.project.name === "mobile")
      await page.addInitScript(() => {
        Object.defineProperty(window, "navigation", {
          configurable: true,
          value: undefined,
        });
      });
    await signIn(page, "manager");
    const task = "/crm/tasks/new";
    const title = page.getByLabel("Title", { exact: true });
    const workspaceLink = async (name: string) => {
      if (info.project.name === "mobile")
        await page.getByRole("button", { name: "Menu", exact: true }).click();
      await page.getByRole("link", { name, exact: true }).click();
    };
    if (direction === "back") {
      await page.goto(`${route}?${range}`);
      await expect(table(page)).toBeVisible();
      await workspaceLink("Tasks");
      await page.getByRole("link", { name: "New task" }).click();
    } else {
      await page.goto(task);
      await expect(title).toBeEnabled();
      await workspaceLink("Reports");
      await expect(table(page)).toBeVisible();
      await page.goBack();
    }
    const delta = direction === "back" ? -2 : 1;
    await title.fill("Keep this unfinished task");
    const length = await page.evaluate(() => history.length);
    const read = await reportRule(page);
    try {
      for (const leave of [false, false, true]) {
        const decision = page.waitForEvent("dialog").then(async (dialog) => {
          if (leave) await dialog.accept();
          else await dialog.dismiss();
        });
        await Promise.all([
          decision,
          page.evaluate((delta) => history.go(delta), delta),
        ]);
        if (!leave) {
          await expect(page).toHaveURL(new RegExp(`${task}$`));
          await expect(title).toHaveValue("Keep this unfinished task");
          await expect(title).toBeEnabled();
          await expect(page.locator("html")).not.toHaveAttribute(
            "data-report-restoring",
            "",
          );
          expect(await page.evaluate(() => history.length)).toBe(length);
          expect(await read.hits()).toBe(0);
        }
      }
      await expect(page).toHaveURL(
        (url) =>
          url.pathname === route &&
          url.search === (direction === "back" ? `?${range}` : ""),
      );
      await expect.poll(read.hits).toBe(1);
      await expect(table(page)).toBeHidden();
      await expect(page.getByLabel("Agent", { exact: true })).toBeHidden();
      await expect(page.getByText("Loading agent performance…")).toBeVisible();
      await read.release();
      await expect(table(page)).toBeVisible();
      expect(await read.hits()).toBe(1);
    } finally {
      await read.remove();
    }
  });
}

async function assertTableReflow(page: Page, width: number) {
  const scrollRegion = page.getByRole("region", {
    name: "Scrollable agent performance table",
  });
  await expect(scrollRegion).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    width,
  );
  if (width < 800) {
    await scrollRegion.focus();
    await expect(scrollRegion).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect
      .poll(() => scrollRegion.evaluate((node) => node.scrollLeft))
      .toBeGreaterThan(0);
    await scrollRegion.evaluate((node) => {
      node.scrollLeft = 0;
    });
  }
}

test("long names wrap and the table scrolls by keyboard at narrow widths and native zoom", async ({
  page,
  baseURL,
}, info) => {
  test.skip(
    info.project.name !== "desktop",
    "One full-browser responsive sweep.",
  );
  await signIn(page, "manager");
  const url = `${route}?${range}&agentId=report-former-desktop`;
  await page.goto(url);
  await expect(table(page).getByText(/Exceptionally Long Name/)).toBeVisible();
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await assertTableReflow(page, width);
    await page.screenshot({ path: info.outputPath(`report-${width}.png`) });
  }

  const executablePath = process.env.PUBLIC_BROWSER_EXECUTABLE;
  test.skip(
    !executablePath,
    "Native browser zoom requires an opt-in full Chrome executable.",
  );
  const context = await chromium.launchPersistentContext("", {
    executablePath,
    baseURL,
    headless: true,
    viewport: null,
    deviceScaleFactor: undefined,
    isMobile: undefined,
    args: ["--window-size=1280,1000"],
  });
  try {
    await context.addCookies(await page.context().cookies());
    const zoomPage = await context.newPage();
    await zoomPage.goto(url);
    const baseline = await zoomPage.evaluate(() => ({
      width: innerWidth,
      ratio: devicePixelRatio,
    }));
    const cdp = await context.newCDPSession(zoomPage);
    const { windowId, bounds } = await cdp.send("Browser.getWindowForTarget");
    await cdp.send("Browser.setWindowBounds", {
      windowId,
      bounds: { width: (bounds.width ?? 1280) + 1280 - baseline.width },
    });
    await expect.poll(() => zoomPage.evaluate(() => innerWidth)).toBe(1280);
    const settings = await context.newPage();
    await settings.goto("chrome://settings/appearance");
    await settings.locator("#zoomLevel").selectOption("2");
    await settings.close();
    await zoomPage.reload();
    await expect.poll(() => zoomPage.evaluate(() => innerWidth)).toBe(640);
    expect(await zoomPage.evaluate(() => devicePixelRatio)).toBe(
      baseline.ratio * 2,
    );
    await assertTableReflow(zoomPage, 640);
    const screenshot = await cdp.send("Page.captureScreenshot", {
      format: "png",
    });
    await writeFile(
      info.outputPath("report-native-200.png"),
      Buffer.from(screenshot.data, "base64"),
    );
  } finally {
    await context.close();
  }
});

test("agent sees only own reassigned history, zero seconds, and no other identity", async ({
  page,
}, info) => {
  const own = await signIn(page, "agent");
  const self = await report(page);
  expect(self.agentOptions).toEqual([
    { id: own.id, name: own.name, availability: "active" },
  ]);
  expect(self.items[0]).toMatchObject({
    leadsHandled: 2,
    dealsClosed: 0,
    assignmentEpisodes: 3,
    completedFollowUps: 2,
    averageFirstFollowUpSeconds: 300,
    awaitingFollowUp: 1,
    endedWithoutFollowUp: 0,
  });
  expect(self.coverage.unattributedFirstWinCount).toBe(0);
  const foreign = `agentId=report-former-${info.project.name}`;
  expect((await page.request.get(`${api}?${range}&${foreign}`)).status()).toBe(
    403,
  );

  await page.goto(`${route}?${range}&${foreign}`);
  await expect(
    page.getByText("You do not have access to this report selection."),
  ).toBeVisible();
  await expect(table(page)).toHaveCount(0);
  await page.getByRole("link", { name: "Clear agent selection" }).click();
  await expect(
    page.getByRole("heading", { name: "Your results" }),
  ).toBeVisible();
  await expect(table(page).getByRole("row")).toHaveCount(2);
  await expect(table(page).getByText("5m", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Agent", { exact: true })).toHaveCount(0);
  await expect(
    page.getByText("Unattributed first wins", { exact: false }),
  ).toHaveCount(0);

  await page.getByLabel("Start date").fill("2025-11-02");
  await page.getByLabel("End date").fill("2025-11-02");
  await dateApply(page).click();
  await expect(table(page).getByText("0s", { exact: true })).toBeVisible();
  await expect(
    table(page).getByText("1 completed episode", { exact: true }),
  ).toBeVisible();

  await page.getByLabel("Start date").fill("2025-11-04");
  await page.getByLabel("End date").fill("2025-11-05");
  await dateApply(page).click();
  await expect(table(page).getByText("—", { exact: true })).toBeVisible();
  await expect(
    table(page).getByText("0 completed episodes", { exact: true }),
  ).toBeVisible();
});

test("rejects repeated and unknown URL filters without a broader backend read", async ({
  page,
}) => {
  await signIn(page, "manager");
  const read = await reportRule(page);
  await read.release();
  try {
    for (const invalid of [
      `${range}&agentId=one&agentId=two`,
      `${range}&agentId%5B%5D=one`,
      `${range}&scope=agency`,
    ]) {
      await page.goto(`${route}?${invalid}`);
      await expect(
        page.getByRole("heading", { name: "Agent performance" }),
      ).toBeVisible();
      await expect(
        page.getByText(
          "Remove any repeated, empty or unrecognized report filters.",
        ),
      ).toBeVisible();
      await expect(table(page)).toHaveCount(0);
    }
    expect(await read.hits()).toBe(0);
  } finally {
    await read.remove();
  }
});

test("streams the date shell and keeps old values hidden during guarded filter changes", async ({
  page,
}) => {
  await signIn(page, "agent");
  const first = await reportRule(page, { query: { from: "2025-11-01" } });
  try {
    await page.goto(`${route}?${range}`, { waitUntil: "commit" });
    await expect.poll(first.hits).toBe(1);
    await expect(
      page.getByRole("heading", { name: "Agent performance" }),
    ).toBeVisible();
    await expect(page.getByText("How these metrics are counted")).toBeVisible();
    await expect(page.getByText("Loading agent performance…")).toBeVisible();
    await expect(page.getByLabel("Start date")).toHaveValue("2025-11-01");
    await expect(table(page)).toHaveCount(0);
  } finally {
    await first.remove();
  }
  await expect(table(page).getByText("5m", { exact: true })).toBeVisible();
  const second = await reportRule(page, { query: { from: "2025-11-02" } });
  try {
    await page.getByLabel("Start date").fill("2025-11-02");
    await page.getByLabel("End date").fill("2025-11-02");
    await dateApply(page).evaluate((button: HTMLButtonElement) => {
      button.form?.requestSubmit(button);
      button.form?.requestSubmit(button);
    });
    await expect.poll(second.hits).toBe(1);
    await expect(dateApply(page)).toBeDisabled();
    await expect(page.getByText("Loading agent performance…")).toBeVisible();
    await expect(table(page)).toBeHidden();
    await second.release();
    await expect(table(page).getByText("0s", { exact: true })).toBeVisible();
    expect(await second.hits()).toBe(1);
  } finally {
    await second.remove();
  }
});

test("keeps actions disabled through a held refresh of the same report URL", async ({
  page,
}) => {
  await signIn(page, "agent");
  await page.goto(`${route}?${range}`);
  await expect(table(page)).toBeVisible();
  const read = await reportRule(page);
  try {
    await refresh(page).click();
    await expect.poll(read.hits).toBe(1);
    await expect(dateApply(page)).toBeDisabled();
    await expect(refresh(page)).toBeDisabled();
    await expect(table(page)).toBeHidden();
    await expect(page).toHaveURL(new RegExp(`${range}$`));
    await read.release();
    await expect(table(page)).toBeVisible();
    await expect(dateApply(page)).toBeEnabled();
  } finally {
    await read.remove();
  }
});

test("keeps filters on retry, guides narrowing on 422, and clears the report on session revocation", async ({
  page,
}, info) => {
  await signIn(page, "agent");
  const scopedRoute = `${route}?${range}`;
  await page.goto(scopedRoute);
  await expect(table(page)).toBeVisible();
  const failure = await reportRule(page, { status: 503 });
  try {
    await failure.release();
    await refresh(page).click();
    await expect(
      page.getByText("The report could not be loaded.", { exact: false }),
    ).toBeVisible();
    await expect(table(page)).toHaveCount(0);
    await expect(
      page.getByText("Fixture service unavailable", { exact: false }),
    ).toHaveCount(0);
  } finally {
    await failure.remove();
  }
  await page.getByRole("button", { name: "Retry report" }).click();
  await expect(table(page)).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`${range}$`));

  const limit = await reportRule(page, {
    status: 422,
    query: { to: "2025-11-05" },
  });
  try {
    await limit.release();
    await refresh(page).click();
    await expect(
      page.getByText("This report is too large.", { exact: false }),
    ).toBeVisible();
    await expect(table(page)).toHaveCount(0);
    await page.getByLabel("End date").fill("2025-11-02");
    await dateApply(page).click();
    await expect(table(page)).toBeVisible();
    await expect(page).toHaveURL(/to=2025-11-02$/);
  } finally {
    await limit.remove();
  }

  const cookies = await page.context().cookies();
  const origin = info.project.use.baseURL ?? "http://localhost:3100";
  const revoked = await page.request.post("/api/v1/auth/sign-out", {
    headers: { Origin: origin },
    data: {},
  });
  expect(revoked.status()).toBe(200);
  await page.context().addCookies(cookies);
  expect((await page.request.get(`${api}?${range}`)).status()).toBe(401);
  await refresh(page).click();
  await expect(page).toHaveURL(/\/login/);
  await expect(table(page)).toHaveCount(0);
});
