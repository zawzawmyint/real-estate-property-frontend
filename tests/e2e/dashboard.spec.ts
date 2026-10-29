import { createHash } from "node:crypto";
import { expect, test, type Cookie, type Page } from "@playwright/test";

// Exact agency counts require a fresh dedicated fixture, with no legacy suites
// creating leads concurrently. Run this file with --workers=1.
test.skip(
  process.env.STAFF_E2E_DASHBOARD_ONLY !== "1",
  "Requires the isolated STAFF_E2E_DASHBOARD_ONLY=1 backend fixture.",
);
test.describe.configure({ mode: "serial" });
test.setTimeout(90_000);

const headers = { Origin: "http://localhost:3100" };
const sessions = new Map<string, { cookies: Cookie[]; user: { id: string } }>();

async function signIn(page: Page, identity: string) {
  await page.context().clearCookies();
  const cached = sessions.get(identity);
  if (cached) {
    await page.context().addCookies(cached.cookies);
    return cached.user;
  }
  const response = await page.request.post("/api/v1/auth/sign-in/email", {
    headers,
    data: {
      email: `e2e-dashboard-${identity}@example.com`,
      password: process.env.STAFF_E2E_PASSWORD,
      rememberMe: true,
    },
  });
  expect(response.status(), await response.text()).toBe(200);
  const session = await page.request.get("/api/v1/auth/get-session");
  const user = (await session.json()).user as { id: string };
  sessions.set(identity, { cookies: await page.context().cookies(), user });
  return user;
}

async function metrics(page: Page, values: [number, number, number, string]) {
  for (const [index, name] of [
    "Total leads",
    "New leads this week",
    "Deals won",
    "Conversion rate",
  ].entries()) {
    const card = page.getByRole("article", { name, exact: true });
    await expect(card).toBeVisible();
    await expect(
      card.getByText(String(values[index]), { exact: true }),
    ).toBeVisible();
  }
}

async function counts(
  page: Page,
  name: string,
  labels: string[],
  values: number[],
) {
  const list = page.getByLabel(name, { exact: true });
  await expect(list.locator("dt")).toHaveText(labels);
  await expect(list.locator("dd")).toHaveText(values.map(String));
}

const sources = ["Website", "Call", "Walk-in"];
const stages = [
  "New",
  "Contacted",
  "Viewing Scheduled",
  "Offer",
  "Won",
  "Lost",
];

for (const identity of ["admin", "manager"]) {
  test(`${identity} sees exact agency totals including unassigned leads`, async ({
    page,
  }, testInfo) => {
    const runtimeErrors: string[] = [];
    page.on("pageerror", (error) => runtimeErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") runtimeErrors.push(message.text());
    });
    await signIn(page, identity);
    await page.goto("/crm");
    await expect(
      page.getByRole("heading", { name: "Agency overview", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Agency totals", { exact: true }),
    ).toBeVisible();
    await metrics(page, [10, 3, 2, "20.0%"]);
    await counts(page, "Leads by source counts", sources, [4, 3, 3]);
    await counts(page, "Pipeline by stage counts", stages, [3, 2, 1, 1, 2, 1]);
    await expect(page.getByText("Current Won leads · All time")).toBeVisible();
    await expect(
      page.getByText("2 Won / 10 total leads · All time"),
    ).toBeVisible();
    const response = await page.request.get("/api/v1/staff/dashboard");
    expect(response.headers()["cache-control"]).toContain("no-store");
    expect(await response.json()).toMatchObject({
      scope: "agency",
      totalLeads: 10,
      newLeadsThisWeek: 3,
      wonLeads: 2,
      conversionRatePercent: 20,
    });
    if (identity === "admin") {
      await page.setViewportSize(
        testInfo.project.name === "desktop"
          ? { width: 1440, height: 1024 }
          : { width: 390, height: 844 },
      );
      if (testInfo.project.name === "desktop") {
        await page
          .getByRole("button", { name: "Expand sidebar", exact: true })
          .click();
      }
      await page.screenshot({
        path: testInfo.outputPath("agency-dashboard.png"),
        fullPage: true,
      });
    }
    expect(runtimeErrors).toEqual([]);
  });
}

test("agents receive only their current assignment in HTML and aggregate JSON", async ({
  page,
}) => {
  for (const [
    identity,
    total,
    weekly,
    won,
    percent,
    sourceCounts,
    stageCounts,
  ] of [
    ["agent", 6, 2, 1, "16.7%", [2, 2, 2], [1, 1, 1, 1, 1, 1]],
    ["other-agent", 3, 1, 1, "33.3%", [1, 1, 1], [1, 1, 0, 0, 1, 0]],
  ] as const) {
    await signIn(page, identity);
    await page.goto("/crm");
    await expect(
      page.getByRole("heading", { name: "My overview", exact: true }),
    ).toBeVisible();
    await metrics(page, [total, weekly, won, percent]);
    await counts(page, "Leads by source counts", sources, [...sourceCounts]);
    await counts(page, "Pipeline by stage counts", stages, [...stageCounts]);
    await expect(page.getByText("Agency totals", { exact: true })).toHaveCount(
      0,
    );
    const response = await page.request.get("/api/v1/staff/dashboard");
    const body = await response.json();
    expect(body).toMatchObject({
      scope: "mine",
      totalLeads: total,
      newLeadsThisWeek: weekly,
      wonLeads: won,
    });
    expect(Object.keys(body).sort()).toEqual(
      [
        "generatedAt",
        "scope",
        "timezone",
        "weekStart",
        "weekEndExclusive",
        "totalLeads",
        "newLeadsThisWeek",
        "wonLeads",
        "conversionRatePercent",
        "leadsBySource",
        "pipelineByStage",
      ].sort(),
    );
    expect(JSON.stringify(body)).not.toMatch(
      /Dashboard fixture|assignedAgent|phone|email|leadId/,
    );
    for (const query of ["scope=agency", "agentId=someone-else"]) {
      const rejected = await page.request.get(
        `/api/v1/staff/dashboard?${query}`,
      );
      expect(rejected.status()).toBe(400);
    }
  }
});

test("empty scope retains all chart categories and a null conversion", async ({
  page,
}) => {
  await signIn(page, "empty-agent");
  await page.goto("/crm");
  await metrics(page, [0, 0, 0, "—"]);
  await expect(
    page.getByText("No leads yet", { exact: true }).first(),
  ).toBeVisible();
  await counts(page, "Leads by source counts", sources, [0, 0, 0]);
  await counts(page, "Pipeline by stage counts", stages, [0, 0, 0, 0, 0, 0]);
  expect(
    (await (await page.request.get("/api/v1/staff/dashboard")).json())
      .conversionRatePercent,
  ).toBeNull();
  await expect(
    page.getByRole("link", { name: /leads/i }).first(),
  ).toBeVisible();
});

test("loading and failure do not fabricate zeros, and keyboard retry recovers", async ({
  page,
}) => {
  await signIn(page, "agent");
  const cookie = (await page.context().cookies()).find(
    (item) => item.name === "agency.session",
  )!;
  const sessionDigest = createHash("sha256")
    .update(decodeURIComponent(cookie.value))
    .digest("hex");
  const configured = await page.request.post(
    "http://127.0.0.1:4312/_e2e/rules",
    {
      data: {
        method: "GET",
        path: "/api/v1/staff/dashboard",
        sessionDigest,
        status: 503,
      },
    },
  );
  expect(configured.status()).toBe(201);
  const { id } = await configured.json();
  try {
    await page.goto("/crm", { waitUntil: "commit" });
    await expect
      .poll(
        async () =>
          (
            await (
              await page.request.get(`http://127.0.0.1:4312/_e2e/rules/${id}`)
            ).json()
          ).hits,
      )
      .toBeGreaterThan(0);
    await expect(
      page.getByRole("article", { name: "Total leads", exact: true }),
    ).toHaveCount(0);
    await page.request.post(`http://127.0.0.1:4312/_e2e/rules/${id}/release`);
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(
      page.getByRole("article", { name: "Total leads", exact: true }),
    ).toHaveCount(0);
  } finally {
    await page.request.delete(`http://127.0.0.1:4312/_e2e/rules/${id}`);
  }
  const retry = page.getByRole("button", { name: "Retry", exact: true });
  await expect(retry).toBeEnabled();
  await retry.focus();
  await expect(retry).toBeFocused();
  await page.keyboard.press("Enter");
  await metrics(page, [6, 2, 1, "16.7%"]);
});

test("assignment and reopening a Won lead are reflected after explicit refresh", async ({
  page,
}) => {
  const agent = await signIn(page, "agent");
  await signIn(page, "manager");
  const result = await page.request.get(
    "/api/v1/staff/leads?q=Dashboard%20fixture&view=all",
  );
  expect(result.status()).toBe(200);
  const { items } = await result.json();
  const won = items.find(
    (item: { name: string }) => item.name === "Dashboard fixture 01",
  );
  const unassigned = items.find(
    (item: { name: string }) => item.name === "Dashboard fixture 10",
  );
  expect(won).toBeTruthy();
  expect(unassigned).toBeTruthy();
  let assignedVersion: number | undefined;
  let stageVersion: number | undefined;
  try {
    const assigned = await page.request.patch(
      `/api/v1/staff/leads/${unassigned.id}/assignment`,
      {
        headers,
        data: {
          expectedVersion: unassigned.version,
          assignedAgentId: agent.id,
        },
      },
    );
    expect(assigned.status(), await assigned.text()).toBe(200);
    assignedVersion = (await assigned.json()).version;
    await signIn(page, "agent");
    await page.goto("/crm");
    await metrics(page, [7, 2, 1, "14.3%"]);
    await signIn(page, "manager");
    const reopened = await page.request.patch(
      `/api/v1/staff/leads/${won.id}/stage`,
      { headers, data: { expectedVersion: won.version, stage: "contacted" } },
    );
    expect(reopened.status(), await reopened.text()).toBe(200);
    stageVersion = (await reopened.json()).version;
    await signIn(page, "agent");
    await page.getByRole("button", { name: "Refresh", exact: true }).click();
    await metrics(page, [7, 2, 0, "0.0%"]);
  } finally {
    await signIn(page, "manager");
    for (const [id, operation, version, data] of [
      [unassigned.id, "assignment", assignedVersion, { assignedAgentId: null }],
      [won.id, "stage", stageVersion, { stage: "won" }],
    ] as const) {
      if (version === undefined) continue;
      const restored = await page.request.patch(
        `/api/v1/staff/leads/${id}/${operation}`,
        { headers, data: { expectedVersion: version, ...data } },
      );
      expect(restored.status(), await restored.text()).toBe(200);
    }
  }
});

test("360px reduced-motion layout fits and refresh works by keyboard", async ({
  page,
}) => {
  await signIn(page, "agent");
  await page.setViewportSize({ width: 360, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/crm");
  await metrics(page, [6, 2, 1, "16.7%"]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  const refresh = page.getByRole("button", { name: "Refresh", exact: true });
  await expect(refresh).toBeEnabled();
  await refresh.focus();
  await expect(refresh).toBeFocused();
  await page.keyboard.press("Enter");
  await metrics(page, [6, 2, 1, "16.7%"]);
});

test("revoked session cannot refresh dashboard or reuse an expired cookie", async ({
  page,
}) => {
  await signIn(page, "empty-agent");
  await page.goto("/crm");
  const cookies = await page.context().cookies();
  const response = await page.request.post("/api/v1/auth/sign-out", {
    headers,
    data: {},
  });
  expect(response.status()).toBe(200);
  sessions.delete("empty-agent");
  await page.context().addCookies(cookies);
  expect((await page.request.get("/api/v1/staff/dashboard")).status()).toBe(
    401,
  );
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(page).toHaveURL(/\/login/);
});
