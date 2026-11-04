import { randomUUID } from "node:crypto";
import { expect, test, type Cookie, type Page } from "@playwright/test";

test.setTimeout(180_000);
const headers = { Origin: "http://localhost:3100" };
const sessions = new Map<string, { cookies: Cookie[]; id: string }>();

async function signIn(page: Page, role = "manager") {
  const key = `${test.info().project.name}-${role}`;
  const cached = sessions.get(key);
  await page.context().clearCookies();
  if (cached) {
    await page.context().addCookies(cached.cookies);
    return cached.id;
  }
  const response = await page.request.post("/api/v1/auth/sign-in/email", {
    headers,
    data: {
      email: `e2e-contact-${test.info().project.name}-${role}@example.com`,
      password: process.env.STAFF_E2E_PASSWORD,
      rememberMe: true,
    },
  });
  expect(response.status(), await response.text()).toBe(200);
  const session = await page.request.get("/api/v1/auth/get-session");
  const id = (await session.json()).user.id as string;
  sessions.set(key, { cookies: await page.context().cookies(), id });
  return id;
}

test("property workspace preserves icon links and accurate numbered navigation", async ({
  page,
}) => {
  await signIn(page);
  await page.goto("/crm/properties?publishingState=published&pageSize=2");
  await expect(
    page.getByRole("link", { name: "Page 2", exact: true }),
  ).toBeVisible();
  const view = page
    .getByRole("link", { name: "View details", exact: true })
    .filter({ visible: true })
    .first();
  await expect(view).toBeVisible();
  expect((await view.innerText()).trim()).toBe("");
  const size = await view.boundingBox();
  expect(size!.width).toBeGreaterThanOrEqual(44);
  expect(size!.height).toBeGreaterThanOrEqual(44);
  await expect(
    page
      .getByRole("link", { name: "Edit", exact: true })
      .filter({ visible: true })
      .first(),
  ).toBeVisible();
  await page.getByRole("link", { name: "Page 2", exact: true }).click();
  await expect(page).toHaveURL(/page=2/);
  expect(new URL(page.url()).searchParams.get("publishingState")).toBe(
    "published",
  );
  expect(new URL(page.url()).searchParams.get("pageSize")).toBe("2");
  await expect(page.getByText(/^Showing 3[–−-]4 of /)).toBeVisible();
});

test("populated CRM collections reflow while retaining their distinct controls", async ({
  page,
}, info) => {
  const agentId = await signIn(page, "agent");
  await signIn(page);
  const leadResponse = await page.request.post("/api/v1/staff/leads", {
    headers,
    data: {
      submissionId: randomUUID(),
      name: `Workspace buyer ${randomUUID().slice(0, 8)}`,
      email: "workspace@example.com",
      purpose: "sale",
      source: "call",
      assignedAgentId: agentId,
    },
  });
  expect(leadResponse.status(), await leadResponse.text()).toBe(201);
  const lead = await leadResponse.json();
  const due = new Date(Date.now() + 86_400_000).toISOString();
  const taskResponse = await page.request.post("/api/v1/staff/tasks", {
    headers,
    data: {
      submissionId: randomUUID(),
      leadId: lead.id,
      expectedLeadVersion: lead.version,
      title: "Confirm the buyer's preferred community",
      dueAt: due,
    },
  });
  expect(taskResponse.status(), await taskResponse.text()).toBe(201);
  const properties = await page.request.get(
    "/api/v1/staff/properties?publishingState=published&availability=available&pageSize=1",
  );
  const property = (await properties.json()).items[0];
  const viewingResponse = await page.request.post("/api/v1/staff/viewings", {
    headers,
    data: {
      submissionId: randomUUID(),
      leadId: lead.id,
      expectedLeadVersion: lead.version,
      propertyId: property.id,
      startsAt: due,
      endsAt: new Date(Date.parse(due) + 1_800_000).toISOString(),
    },
  });
  expect(viewingResponse.status(), await viewingResponse.text()).toBe(201);
  const dubaiDay = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dubai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(due));
  const routes = [
    ["properties", "/crm/properties", "Properties"],
    ["leads", "/crm/leads?view=all", "Leads"],
    ["tasks", "/crm/tasks", "Tasks"],
    ["viewings", `/crm/viewings?date=${dubaiDay}`, "Viewings"],
  ] as const;
  for (const width of info.project.name === "desktop"
    ? [1440, 768, 390, 320]
    : [390]) {
    await page.setViewportSize({ width, height: 1024 });
    for (const [name, route, heading] of routes) {
      await page.goto(route);
      await expect(
        page.getByRole("heading", { name: heading, exact: true }),
      ).toBeVisible();
      if (name === "tasks") {
        await expect(
          page.getByLabel("Task status", { exact: true }),
        ).toBeVisible();
        await expect(page.getByLabel("Due", { exact: true })).toBeVisible();
        await expect(page.getByRole("textbox")).toHaveCount(0);
      }
      if (name === "viewings") {
        await expect(
          page.getByLabel("Week containing", { exact: true }),
        ).toBeVisible();
        await expect(
          page.getByRole("link", {
            name: "Choose a lead to schedule",
            exact: true,
          }),
        ).toBeVisible();
      }
      if (name === "leads") {
        await expect(
          page.getByLabel("Search leads", { exact: true }),
        ).toBeEnabled();
        await expect(
          page.getByRole("button", { name: "Apply", exact: true }),
        ).toHaveCount(0);
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      if (info.project.name === "desktop" && width !== 768)
        await page.screenshot({
          path: info.outputPath(`${name}-${width}.png`),
          fullPage: true,
        });
    }
  }
});

test("public pages and default dashboard/pipeline remain separate from workspace variants", async ({
  page,
}) => {
  await signIn(page);
  for (const path of [
    "/",
    "/properties",
    "/agents",
    "/contact",
    "/crm",
    "/crm/leads/pipeline?view=all",
  ]) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
    await expect(
      page.getByRole("group", { name: "Inventory search and filters" }),
    ).toHaveCount(0);
  }
});

test("lead filters retain immediate desktop updates and mobile draft Apply and Cancel", async ({
  page,
}) => {
  await signIn(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/crm/leads?view=all");
  await page.getByRole("button", { name: "Filters", exact: true }).click();
  await page.getByLabel("Stage", { exact: true }).selectOption("new");
  await expect
    .poll(() => new URL(page.url()).searchParams.get("stage"))
    .toBe("new");
  await page.getByRole("button", { name: "Remove stage filter" }).click();
  await expect
    .poll(() => new URL(page.url()).searchParams.get("stage"))
    .toBeNull();
  await page.setViewportSize({ width: 390, height: 900 });
  await page.getByRole("button", { name: "Filters", exact: true }).click();
  const sheet = page.getByRole("dialog", { name: "Filter leads" });
  await sheet.getByLabel("Stage", { exact: true }).selectOption("new");
  expect(new URL(page.url()).searchParams.get("stage")).toBeNull();
  await sheet.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(sheet).not.toBeVisible();
  await page.getByRole("button", { name: "Filters", exact: true }).click();
  await expect(sheet.getByLabel("Stage", { exact: true })).toHaveValue("");
  await sheet.getByLabel("Stage", { exact: true }).selectOption("new");
  await sheet
    .getByRole("button", { name: "Apply filters", exact: true })
    .click();
  await expect(sheet).not.toBeVisible();
  await expect
    .poll(() => new URL(page.url()).searchParams.get("stage"))
    .toBe("new");
  await expect(
    page.getByRole("button", { name: "Remove stage filter" }),
  ).toBeVisible();
});
