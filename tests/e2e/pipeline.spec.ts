import { randomUUID } from "node:crypto";
import { expect, test, type Page, type Cookie } from "@playwright/test";

function uniqueName(prefix: string) {
  // Digits also trigger backend phone search, so keep name queries alphabetic.
  const suffix = randomUUID()
    .slice(0, 8)
    .replace(/\d/g, (digit) => String.fromCharCode(103 + Number(digit)));
  return `${prefix} ${suffix}`;
}
test.setTimeout(90_000);
const headers = { Origin: "http://localhost:3100" };
const sessions = new Map<string, { cookies: Cookie[]; user: { id: string } }>();
async function login(page: Page, role = "manager") {
  const key = `${test.info().project.name}-${role}`;
  const cached = sessions.get(key);
  if (cached) {
    await page.context().clearCookies();
    await page.context().addCookies(cached.cookies);
    return cached.user;
  }
  const response = await page.request.post("/api/v1/auth/sign-in/email", {
    headers,
    data: {
      email: `e2e-pipeline-${test.info().project.name}-${role}@example.com`,
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
async function create(page: Page, name: string, extra = {}) {
  const response = await page.request.post("/api/v1/staff/leads", {
    headers,
    data: {
      submissionId: randomUUID(),
      name,
      phone: "+971501234567",
      purpose: "sale",
      source: "call",
      budgetFils: 150000000,
      ...extra,
    },
  });
  expect(response.status(), await response.text()).toBe(201);
  return response.json();
}
async function open(page: Page, name: string) {
  await page.goto(`/crm/leads/pipeline?q=${encodeURIComponent(name)}`);
  await expect(
    page.getByRole("heading", { name: "Sales pipeline", exact: true }),
  ).toBeVisible();
}
async function stage(page: Page, value: string) {
  const switcher = page.getByLabel("View stage", { exact: true });
  if (await switcher.isVisible()) await switcher.selectOption(value);
}

test("board moves a lead once, confirms terminal stages and records activity", async ({
  page,
}, info) => {
  await login(page);
  const name = uniqueName("Pipeline");
  const lead = await create(page, name);
  await open(page, name);
  await expect(page.getByRole("link", { name, exact: true })).toBeVisible();
  await page
    .getByRole("combobox", { name: `Move ${name} to stage`, exact: true })
    .selectOption("contacted");
  await stage(page, "contacted");
  await expect(
    page.getByRole("status").filter({ hasText: `${name} moved to Contacted` }),
  ).toBeVisible();
  await expect(
    page.getByRole("combobox", { name: `Move ${name} to stage`, exact: true }),
  ).toHaveValue("contacted");
  await page
    .getByRole("combobox", { name: `Move ${name} to stage`, exact: true })
    .selectOption("won");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(
    page.getByRole("combobox", { name: `Move ${name} to stage`, exact: true }),
  ).toHaveValue("contacted");
  await page
    .getByRole("combobox", { name: `Move ${name} to stage`, exact: true })
    .selectOption("won");
  await page.getByRole("button", { name: "Confirm move", exact: true }).click();
  await stage(page, "won");
  await expect(
    page.getByRole("combobox", { name: `Move ${name} to stage`, exact: true }),
  ).toHaveValue("won");
  await page.screenshot({
    path: info.outputPath("pipeline.png"),
    fullPage: true,
  });
  const detail = await (
    await page.request.get(`/api/v1/staff/leads/${lead.id}`)
  ).json();
  expect(detail.stage).toBe("won");
  expect(detail.version).toBe(lead.version + 2);
  const activity = await (
    await page.request.get(`/api/v1/staff/leads/${lead.id}/activity`)
  ).json();
  expect(
    activity.items.filter((item: { stageChange: unknown }) => item.stageChange),
  ).toHaveLength(2);
});

test("conflicting move reloads current data without replaying the write", async ({
  page,
}) => {
  await login(page);
  const name = uniqueName("Pipeline conflict");
  const lead = await create(page, name);
  await open(page, name);
  await expect(page.getByRole("link", { name, exact: true })).toBeVisible();
  const concurrent = await page.request.patch(
    `/api/v1/staff/leads/${lead.id}/stage`,
    { headers, data: { expectedVersion: lead.version, stage: "offer" } },
  );
  expect(concurrent.status()).toBe(200);
  await page
    .getByRole("combobox", { name: `Move ${name} to stage`, exact: true })
    .selectOption("contacted");
  await expect(
    page.getByRole("alert").filter({ hasText: "Review the current stage" }),
  ).toBeVisible();
  await stage(page, "offer");
  await expect(
    page.getByRole("combobox", { name: `Move ${name} to stage`, exact: true }),
  ).toHaveValue("offer");
  const fresh = await (
    await page.request.get(`/api/v1/staff/leads/${lead.id}`)
  ).json();
  expect(fresh.stage).toBe("offer");
  expect(fresh.version).toBe(lead.version + 1);
});

test("agent only sees own leads and loses a reassigned card on refresh", async ({
  page,
}) => {
  const agent = await login(page, "agent");
  await page.context().clearCookies();
  await login(page);
  const name = uniqueName("Pipeline ownership");
  const own = await create(page, `${name} own`, { assignedAgentId: agent.id });
  await create(page, `${name} hidden`);
  const managerCookies = await page.context().cookies();
  await page.context().clearCookies();
  await login(page, "agent");
  await open(page, name);
  await expect(
    page.getByRole("link", { name: `${name} own`, exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: `${name} hidden`, exact: true }),
  ).toHaveCount(0);
  const agentCookies = await page.context().cookies();
  await page.context().clearCookies();
  await page.context().addCookies(managerCookies);
  const changed = await page.request.patch(
    `/api/v1/staff/leads/${own.id}/assignment`,
    { headers, data: { expectedVersion: own.version, assignedAgentId: null } },
  );
  expect(changed.status()).toBe(200);
  await page.context().clearCookies();
  await page.context().addCookies(agentCookies);
  await page
    .getByRole("button", { name: "Refresh board", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: `${name} own`, exact: true }),
  ).toHaveCount(0);
});

test("board has no page overflow at supported widths and preserves URL filters", async ({
  page,
}, info) => {
  await login(page);
  const name = uniqueName("Pipeline layout");
  await create(page, name);
  await open(page, name);
  await expect(page.getByRole("link", { name, exact: true })).toBeVisible();
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(page.getByRole("link", { name, exact: true })).toBeVisible();
    await page.screenshot({
      path: info.outputPath(`pipeline-${width}.png`),
      fullPage: true,
    });
  }
  await page
    .getByLabel("Source", { exact: true })
    .filter({ visible: true })
    .selectOption("website");
  await expect(page).toHaveURL(/source=website/);
  await expect(
    page.getByText("No matching leads", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: /Clear filters/ })
    .first()
    .click();
  await expect(page).not.toHaveURL(/source=website/);
});

test("pointer drag persists a cross-stage move and Escape cancels a drag", async ({
  page,
}, info) => {
  test.skip(
    info.project.name !== "desktop",
    "Mobile uses the explicit stage control.",
  );
  await login(page);
  const name = uniqueName("Pipeline drag");
  const lead = await create(page, name);
  await open(page, name);
  const handle = page.getByRole("button", {
    name: `Drag ${name}`,
    exact: true,
  });
  await expect(handle).toBeEnabled();
  const source = (await handle.boundingBox())!;
  const target = (await page
    .locator('[data-stage="contacted"]')
    .boundingBox())!;
  await page.mouse.move(
    source.x + source.width / 2,
    source.y + source.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    source.x + source.width / 2 + 15,
    source.y + source.height / 2,
    { steps: 4 },
  );
  await page.mouse.move(target.x + target.width / 2, target.y + 180, {
    steps: 16,
  });
  await page.mouse.up();
  await expect(
    page.getByRole("combobox", { name: `Move ${name} to stage`, exact: true }),
  ).toHaveValue("contacted");
  await expect(handle).toBeEnabled();
  // Let Playwright wait for the drop animation to settle before reading geometry.
  await handle.hover();
  const current = (await handle.boundingBox())!;
  const cancelTarget = (await page
    .locator('[data-stage="new"]')
    .boundingBox())!;
  await page.mouse.move(
    current.x + current.width / 2,
    current.y + current.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    cancelTarget.x + cancelTarget.width / 2,
    cancelTarget.y + 180,
    { steps: 16 },
  );
  await expect(
    // Cancellation only requires an active drag; collision targets can differ
    // while the pointer crosses the boundary between these adjacent columns.
    page.getByText(new RegExp(`^${name} over (?:New|Contacted)\\.$`)),
  ).toHaveCount(1);
  await page.keyboard.press("Escape");
  await page.mouse.up();
  await expect(
    page.getByText(`Move canceled. ${name} remains in its original stage.`, {
      exact: true,
    }),
  ).toHaveCount(1);
  const fresh = await (
    await page.request.get(`/api/v1/staff/leads/${lead.id}`)
  ).json();
  expect(fresh.stage).toBe("contacted");
  expect(fresh.version).toBe(lead.version + 1);
});

test("keyboard drag can move a lead to the next stage", async ({
  page,
}, info) => {
  test.skip(
    info.project.name !== "desktop",
    "Mobile uses the explicit stage control.",
  );
  await login(page);
  const name = uniqueName("Pipeline keyboard");
  await create(page, name);
  await open(page, name);
  const handle = page.getByRole("button", {
    name: `Drag ${name}`,
    exact: true,
  });
  await expect(handle).toBeEnabled();
  await handle.focus();
  await page.keyboard.press("Space");
  await expect(
    page.getByText(`${name} over New.`, { exact: true }),
  ).toHaveCount(1);
  await page.keyboard.press("Space");
  await expect(
    page.getByText(`${name} remains in its original stage.`, { exact: true }),
  ).toHaveCount(1);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("combobox", { name: `Move ${name} to stage`, exact: true }),
  ).toHaveValue("new");
  await expect(handle).toBeFocused();
  await handle.focus();
  await page.keyboard.press("Space");
  await expect(
    page.getByText(`${name} over New.`, { exact: true }),
  ).toHaveCount(1);
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByText(`${name} over Contacted.`, { exact: true }),
  ).toHaveCount(1);
  await page.keyboard.press("Space");
  await expect(
    page.getByText(`Moving ${name} to Contacted. Saving stage change.`, {
      exact: true,
    }),
  ).toHaveCount(1);
  await expect(
    page.getByRole("combobox", { name: `Move ${name} to stage`, exact: true }),
  ).toHaveValue("contacted");
});

test("stage pagination retains cards and retries failed reads", async ({
  page,
}) => {
  await login(page);
  const name = uniqueName("Pipeline pages");
  for (let i = 0; i < 21; i++)
    await create(page, `${name} ${String(i).padStart(2, "0")}`);
  await open(page, name);
  const column = page.locator('[data-stage="new"]');
  await expect(column.getByRole("article")).toHaveCount(20);
  const registered = await page.request.post(
    "http://127.0.0.1:4312/_e2e/rules",
    {
      data: {
        method: "GET",
        path: "/api/v1/staff/leads",
        query: { q: name, stage: "new", page: "2" },
        status: 503,
      },
    },
  );
  expect(registered.status()).toBe(201);
  const { id } = await registered.json();
  try {
    await page.request.post(`http://127.0.0.1:4312/_e2e/rules/${id}/release`);
    await column.getByRole("button", { name: /Load more/ }).click();
    await expect(column.getByRole("alert")).toContainText(
      "More leads could not be loaded",
    );
    await expect(column.getByRole("article")).toHaveCount(20);
    await page.request.delete(`http://127.0.0.1:4312/_e2e/rules/${id}`);
    await column
      .getByRole("button", { name: "Retry New", exact: true })
      .click();
    await expect(column.getByRole("article")).toHaveCount(21);
  } finally {
    await page.request.delete(`http://127.0.0.1:4312/_e2e/rules/${id}`);
  }
});

test("initial failed stage retries while filters and other stages remain available", async ({
  page,
}) => {
  await login(page);
  const name = uniqueName("Pipeline read");
  await create(page, name);
  const control = "http://127.0.0.1:4312/_e2e/rules";
  const registered = await page.request.post(control, {
    data: {
      method: "GET",
      path: "/api/v1/staff/leads",
      query: { q: name, stage: "contacted" },
      status: 503,
    },
  });
  expect(registered.status()).toBe(201);
  const { id } = await registered.json();
  try {
    await page.request.post(`${control}/${id}/release`);
    await open(page, name);
    await stage(page, "contacted");
    await expect(
      page.getByRole("button", { name: "Retry Contacted", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByLabel("Search leads", { exact: true }),
    ).toBeEnabled();
    await stage(page, "new");
    await expect(
      page.getByRole("combobox", {
        name: `Move ${name} to stage`,
        exact: true,
      }),
    ).toBeDisabled();
    await page.request.delete(`${control}/${id}`);
    await stage(page, "contacted");
    await page
      .getByRole("button", { name: "Retry Contacted", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Retry Contacted", exact: true }),
    ).toHaveCount(0);
    await stage(page, "new");
    await expect(page.getByRole("link", { name, exact: true })).toBeVisible();
  } finally {
    await page.request.delete(`${control}/${id}`);
  }
});

test("lost action response reconciles the saved stage without a duplicate write", async ({
  page,
}) => {
  await login(page);
  const name = uniqueName("Pipeline uncertain");
  const lead = await create(page, name);
  await open(page, name);
  await expect(
    page.getByRole("combobox", { name: `Move ${name} to stage`, exact: true }),
  ).toBeEnabled();
  await page.route("**/crm/leads/pipeline**", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    const response = await route.fetch();
    expect(response.status()).toBe(200);
    await route.fulfill({
      status: 500,
      contentType: "text/plain",
      body: "Unconfirmed response",
    });
  });
  await page
    .getByRole("combobox", { name: `Move ${name} to stage`, exact: true })
    .selectOption("contacted");
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "save response could not be confirmed" }),
  ).toBeVisible();
  await stage(page, "contacted");
  await expect(
    page.getByRole("combobox", { name: `Move ${name} to stage`, exact: true }),
  ).toHaveValue("contacted");
  const fresh = await (
    await page.request.get(`/api/v1/staff/leads/${lead.id}`)
  ).json();
  expect(fresh.stage).toBe("contacted");
  expect(fresh.version).toBe(lead.version + 1);
});

test("an expired session clears the board and sends a move back to sign in", async ({
  page,
}) => {
  await login(page);
  const name = uniqueName("Pipeline session");
  await create(page, name);
  await open(page, name);
  await expect(
    page.getByRole("combobox", { name: `Move ${name} to stage`, exact: true }),
  ).toBeEnabled();
  await page.context().clearCookies();
  await page
    .getByRole("combobox", { name: `Move ${name} to stage`, exact: true })
    .selectOption("contacted");
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("article", { name, exact: true })).toHaveCount(0);
});

test("heading and filters stream before held pipeline data", async ({
  page,
}) => {
  await login(page);
  const name = uniqueName("Pipeline stream");
  await create(page, name);
  const control = "http://127.0.0.1:4312/_e2e/rules";
  const registered = await page.request.post(control, {
    data: {
      method: "GET",
      path: "/api/v1/staff/leads",
      query: { q: name, stage: "new" },
    },
  });
  expect(registered.status()).toBe(201);
  const { id } = await registered.json();
  try {
    await page.goto(`/crm/leads/pipeline?q=${encodeURIComponent(name)}`, {
      waitUntil: "commit",
    });
    await expect(
      page.getByRole("heading", { name: "Sales pipeline", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByLabel("Search leads", { exact: true }),
    ).toBeEnabled();
    await expect(
      page.getByRole("status", { name: "Loading pipeline", exact: true }),
    ).toBeVisible();
    await page.request.post(`${control}/${id}/release`);
    await expect(page.getByRole("link", { name, exact: true })).toBeVisible();
  } finally {
    await page.request.delete(`${control}/${id}`);
  }
});

test("pointer stage saves keep single-card board geometry stable", async ({
  page,
}, info) => {
  test.skip(
    info.project.name !== "desktop",
    "Mobile uses the explicit stage control.",
  );
  await page.setViewportSize({ width: 1480, height: 807 });
  await login(page);
  const name = uniqueName("Pipeline geometry");
  const lead = await create(page, name, { budgetFils: null });
  await open(page, name);
  const handle = page.getByRole("button", {
    name: `Drag ${name}`,
    exact: true,
  });
  await expect(handle).toBeEnabled();
  await page.evaluate(() =>
    window.scrollTo(0, document.documentElement.scrollHeight),
  );

  for (const destination of ["contacted", "new"]) {
    await handle.hover();
    const source = (await handle.boundingBox())!;
    const target = (await page
      .locator(`[data-stage="${destination}"]`)
      .boundingBox())!;
    const sampling = page.evaluate(
      async ({ id, destination }) => {
        const region = document.querySelector<HTMLElement>(
          '[aria-label="Sales pipeline stages"]',
        )!;
        const samples: {
          height: number;
          top: number;
          scrollY: number;
          left: number;
        }[] = [];
        const deadline = performance.now() + 15000;
        let settledFrames = 0;
        while (performance.now() < deadline) {
          const rect = region.getBoundingClientRect();
          samples.push({
            height: rect.height,
            top: rect.top,
            scrollY,
            left: region.scrollLeft,
          });
          const control = document.getElementById(
            `pipeline-move-${id}`,
          ) as HTMLSelectElement | null;
          if (
            control?.value === destination &&
            !control.disabled &&
            !document.querySelector("[data-dnd-dragging]")
          )
            settledFrames++;
          else settledFrames = 0;
          if (settledFrames === 20) return samples;
          await new Promise<void>((resolve) =>
            requestAnimationFrame(() => resolve()),
          );
        }
        throw new Error(
          "Stage save did not settle while measuring board geometry",
        );
      },
      { id: lead.id, destination },
    );
    await page.mouse.move(
      source.x + source.width / 2,
      source.y + source.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(
      target.x + target.width / 2,
      source.y + source.height / 2 + 40,
      { steps: 24 },
    );
    await page.mouse.up();
    const samples = await sampling;
    await page.screenshot({
      path: info.outputPath(`${destination}-stable-board.png`),
    });
    await info.attach(`${destination}-board-geometry`, {
      body: JSON.stringify(samples),
      contentType: "application/json",
    });
    for (const key of ["height", "top", "scrollY", "left"] as const) {
      const values = samples.map((sample) => sample[key]);
      expect(
        Math.max(...values) - Math.min(...values),
        `${destination}: ${key} should remain stable`,
      ).toBeLessThanOrEqual(2);
    }
    await expect(
      page.getByRole("combobox", {
        name: `Move ${name} to stage`,
        exact: true,
      }),
    ).toHaveValue(destination);
    await expect(
      page.getByRole("combobox", {
        name: `Move ${name} to stage`,
        exact: true,
      }),
    ).toBeFocused();
  }
  const fresh = await (
    await page.request.get(`/api/v1/staff/leads/${lead.id}`)
  ).json();
  expect(fresh.stage).toBe("new");
  expect(fresh.version).toBe(lead.version + 2);
});
