import { createHash, randomUUID } from "node:crypto";
import { expect, test, type Cookie, type Page } from "@playwright/test";

test.setTimeout(90_000);
test.use({ timezoneId: "America/New_York" });

const headers = { Origin: "http://localhost:3100" };
const sessions = new Map<
  string,
  { cookies: Cookie[]; user: { id: string; name: string } }
>();

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
      email: `e2e-viewing-${key}@example.com`,
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

async function assignedLead(page: Page) {
  const agent = await signIn(page, "agent");
  await signIn(page);
  const response = await page.request.post("/api/v1/staff/leads", {
    headers,
    data: {
      submissionId: randomUUID(),
      name: `Viewing browser ${randomUUID().slice(0, 8)}`,
      phone: "+971 50 123 4567",
      purpose: "sale",
      source: "call",
      assignedAgentId: agent.id,
    },
  });
  expect(response.status(), await response.text()).toBe(201);
  return (await response.json()) as {
    id: string;
    name: string;
    version: number;
    stage: string;
    property: { id: string } | null;
  };
}

async function book(page: Page) {
  const lead = await assignedLead(page);
  const properties = await page.request.get(
    "/api/v1/staff/properties?publishingState=published&availability=available&pageSize=48",
  );
  expect(properties.status(), await properties.text()).toBe(200);
  const property = (await properties.json()).items.find(
    (item: { isDemo: boolean }) => item.isDemo,
  ) as {
    id: string;
    title: string;
  };
  expect(property).toBeTruthy();
  const startsAt = new Date(Date.now() + 86_400_000).toISOString();
  const response = await page.request.post("/api/v1/staff/viewings", {
    headers,
    data: {
      submissionId: randomUUID(),
      leadId: lead.id,
      propertyId: property.id,
      expectedLeadVersion: lead.version,
      startsAt,
      endsAt: new Date(Date.parse(startsAt) + 3_600_000).toISOString(),
    },
  });
  expect(response.status(), await response.text()).toBe(201);
  return { lead, property, viewing: await response.json() };
}

async function fillBooking(page: Page, lead: { id: string }) {
  const properties = await page.request.get(
    "/api/v1/staff/properties?publishingState=published&availability=available&pageSize=48",
  );
  const property = (await properties.json()).items.find(
    (item: { isDemo: boolean }) => item.isDemo,
  ) as { title: string };
  expect(property).toBeTruthy();
  const day = new Date(Date.now() + 86_400_000 + 4 * 3_600_000)
    .toISOString()
    .slice(0, 10);
  await page.goto(`/crm/leads/${lead.id}`);
  await page
    .getByRole("link", { name: "Schedule viewing", exact: true })
    .click();
  await page
    .getByLabel("Search properties", { exact: true })
    .fill(property.title);
  await page.getByRole("radio", { name: new RegExp(property.title) }).check();
  await page.getByLabel("Date", { exact: true }).fill(day);
  await page.getByLabel("Start time", { exact: true }).fill("11:00");
  await page.getByLabel("End time", { exact: true }).fill("12:00");
  return day;
}

test("overnight appointments identify the next-day end in calendar and detail", async ({
  page,
}) => {
  const { lead, viewing } = await book(page);
  const day = new Date(Date.now() + 86_400_000 + 4 * 3_600_000)
    .toISOString()
    .slice(0, 10);
  const start = new Date(`${day}T23:30:00+04:00`);
  const end = new Date(start.getTime() + 3_600_000);
  const endDay = new Date(end.getTime() + 4 * 3_600_000)
    .toISOString()
    .slice(0, 10);
  const changed = await page.request.patch(
    `/api/v1/staff/viewings/${viewing.id}`,
    {
      headers,
      data: {
        expectedVersion: viewing.version,
        expectedLeadVersion: lead.version,
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
      },
    },
  );
  expect(changed.status(), await changed.text()).toBe(200);
  await page.goto(`/crm/viewings/${viewing.id}`);
  await expect(page.getByText(new RegExp(`Ends.*${endDay}`))).toBeVisible();
  await page.goto(`/crm/viewings?date=${day}`);
  const appointment = page.getByRole("link", { name: new RegExp(lead.name) });
  await expect(appointment).toContainText(endDay);
});

test("manager books from a lead without changing its stage or inquiry context", async ({
  page,
}, info) => {
  const lead = await assignedLead(page);
  await fillBooking(page, lead);
  await page.screenshot({
    path: info.outputPath("viewing-booking.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Schedule viewing", exact: true })
    .click();
  await expect(page).toHaveURL(/\/crm\/viewings\/[\da-f-]+/);
  await expect(
    page.getByText(lead.name, { exact: true }).first(),
  ).toBeVisible();
  const response = await page.request.get(`/api/v1/staff/leads/${lead.id}`);
  const fresh = await response.json();
  expect(fresh.stage).toBe(lead.stage);
  expect(fresh.property).toEqual(lead.property);
});

test("lost booking response reconciles the identical submission once", async ({
  page,
}) => {
  const lead = await assignedLead(page);
  const day = await fillBooking(page, lead);
  let dropped = false;
  await page.route("**/crm/viewings/**", async (route) => {
    const request = route.request();
    if (
      !dropped &&
      request.method() === "POST" &&
      request.headers()["next-action"]
    ) {
      dropped = true;
      await route.fetch();
      await route.abort("failed");
    } else await route.continue();
  });
  await page
    .getByRole("button", { name: "Schedule viewing", exact: true })
    .click();
  const retry = page.getByRole("button", {
    name: /Retry same booking|Check booking|Reconcile booking/,
  });
  await expect(retry).toBeVisible();
  await expect(page.getByLabel("Date", { exact: true })).toHaveValue(day);
  await retry.click();
  await expect(page).toHaveURL(/\/crm\/viewings\/[\da-f-]+/);
  expect(dropped).toBe(true);
  const query = new URLSearchParams({
    leadId: lead.id,
    from: `${day}T00:00:00+04:00`,
    to: `${day}T23:59:59+04:00`,
  });
  const appointments = await page.request.get(
    `/api/v1/staff/viewings?${query}`,
  );
  expect((await appointments.json()).total).toBe(1);
});

test("viewing detail preserves context and cancellation persists", async ({
  page,
}, info) => {
  const { lead, property, viewing } = await book(page);
  await page.goto(`/crm/viewings/${viewing.id}`);
  await expect(
    page.getByText(lead.name, { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByText(property.title, { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByText(/Asia\/Dubai|Dubai time/).first()).toBeVisible();
  await page.screenshot({
    path: info.outputPath("viewing-detail.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Cancel viewing", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog
    .getByRole("button", { name: /Cancel viewing|Confirm cancellation/ })
    .click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByText(/^cancelled$/i).first()).toBeVisible();
  await page.reload();
  await expect(page.getByText(/^cancelled$/i).first()).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Cancel viewing", exact: true }),
  ).toHaveCount(0);
  const freshLead = await page.request.get(`/api/v1/staff/leads/${lead.id}`);
  expect((await freshLead.json()).stage).toBe(lead.stage);
});

test("rescheduling saves Dubai times and stale edits require review", async ({
  page,
}) => {
  const { lead, viewing } = await book(page);
  await page.goto(`/crm/viewings/${viewing.id}`);
  await page
    .getByRole("button", { name: "Reschedule viewing", exact: true })
    .click();
  const day = new Date(Date.now() + 3 * 86_400_000 + 4 * 3_600_000)
    .toISOString()
    .slice(0, 10);
  await page.getByLabel("Date", { exact: true }).fill(day);
  await page.getByLabel("Start time", { exact: true }).fill("14:00");
  await page.getByLabel("End time", { exact: true }).fill("15:00");
  const changed = await page.request.patch(
    `/api/v1/staff/viewings/${viewing.id}`,
    {
      headers,
      data: {
        expectedVersion: viewing.version,
        expectedLeadVersion: lead.version,
        startsAt: new Date(
          Date.parse(viewing.startsAt) + 3_600_000,
        ).toISOString(),
        endsAt: new Date(Date.parse(viewing.endsAt) + 3_600_000).toISOString(),
      },
    },
  );
  expect(changed.status(), await changed.text()).toBe(200);
  await page
    .getByRole("button", { name: "Save new time", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "I have reviewed the latest appointment",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByLabel("Date", { exact: true })).toHaveValue(day);
  await page
    .getByRole("button", {
      name: "I have reviewed the latest appointment",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Save new time", exact: true })
    .click();
  await expect(
    page.getByText("Viewing rescheduled.", { exact: true }),
  ).toBeVisible();
  const fresh = await page.request.get(`/api/v1/staff/viewings/${viewing.id}`);
  const body = await fresh.json();
  expect(body.startsAt).toBe(new Date(`${day}T14:00:00+04:00`).toISOString());
  expect(body.version).toBe(3);
});

test("calendar opens appointments and fits narrow screens", async ({
  page,
}, info) => {
  const { lead, viewing } = await book(page);
  const day = new Date(Date.parse(viewing.startsAt) + 4 * 3_600_000)
    .toISOString()
    .slice(0, 10);
  await page.goto(`/crm/viewings?date=${day}`);
  await expect(
    page.getByRole("heading", { name: "Viewings", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: new RegExp(lead.name) }).first(),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath("viewing-calendar.png"),
    fullPage: true,
  });
  for (const width of info.project.name === "mobile"
    ? [390, 320]
    : [1440, 768]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: info.outputPath(`viewings-${width}.png`),
      fullPage: true,
    });
  }
  const link = page.getByRole("link", { name: new RegExp(lead.name) }).first();
  await link.focus();
  await link.press("Enter");
  await expect(page).toHaveURL(new RegExp(`/crm/viewings/${viewing.id}`));
});

test("reassignment revokes the former agent's viewing access", async ({
  page,
}) => {
  const { lead, viewing } = await book(page);
  await signIn(page, "agent");
  expect(
    (await page.request.get(`/api/v1/staff/viewings/${viewing.id}`)).status(),
  ).toBe(200);
  const other = await signIn(page, "other-agent");
  expect(
    (await page.request.get(`/api/v1/staff/viewings/${viewing.id}`)).status(),
  ).toBe(404);
  await signIn(page);
  const assignment = await page.request.patch(
    `/api/v1/staff/leads/${lead.id}/assignment`,
    {
      headers,
      data: { expectedVersion: lead.version, assignedAgentId: other.id },
    },
  );
  expect(assignment.status(), await assignment.text()).toBe(200);
  await signIn(page, "agent");
  expect(
    (await page.request.get(`/api/v1/staff/viewings/${viewing.id}`)).status(),
  ).toBe(404);
  await signIn(page, "other-agent");
  expect(
    (await page.request.get(`/api/v1/staff/viewings/${viewing.id}`)).status(),
  ).toBe(200);
});

test("started viewing feedback persists as read-only history", async ({
  page,
}, info) => {
  await signIn(page);
  const query = new URLSearchParams({
    view: "all",
    q: `Started viewing ${info.project.name}`,
  });
  const leads = await page.request.get(`/api/v1/staff/leads?${query}`);
  expect(leads.status(), await leads.text()).toBe(200);
  const lead = (await leads.json()).items[0];
  expect(lead).toBeTruthy();
  const range = new URLSearchParams({
    leadId: lead.id,
    from: new Date(Date.now() - 86_400_000).toISOString(),
    to: new Date(Date.now() + 86_400_000).toISOString(),
  });
  const response = await page.request.get(`/api/v1/staff/viewings?${range}`);
  const viewing = (await response.json()).items[0];
  expect(viewing).toBeTruthy();
  await page.goto(`/crm/viewings/${viewing.id}`);
  const feedback = "The client liked the layout and asked to discuss an offer.";
  await page.getByLabel(/Feedback/i).fill(feedback);
  await page
    .getByRole("button", { name: "Complete viewing", exact: true })
    .click();
  await expect(page.getByText(/^completed$/i).first()).toBeVisible();
  await page.reload();
  await expect(page.getByText(feedback, { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Complete viewing", exact: true }),
  ).toHaveCount(0);
  await page.screenshot({
    path: info.outputPath("viewing-feedback.png"),
    fullPage: true,
  });
});

test("calendar makes partial pages explicit and loads the remaining appointments", async ({
  page,
}, info) => {
  const { lead, property } = await book(page);
  const startsAt = new Date(
    Date.now() + (info.project.name === "desktop" ? 28 : 35) * 86_400_000,
  ).toISOString();
  for (let index = 0; index < 55; index++) {
    const response = await page.request.post("/api/v1/staff/viewings", {
      headers,
      data: {
        submissionId: randomUUID(),
        leadId: lead.id,
        propertyId: property.id,
        expectedLeadVersion: lead.version,
        startsAt,
        endsAt: new Date(Date.parse(startsAt) + 3_600_000).toISOString(),
      },
    });
    expect(response.status(), await response.text()).toBe(201);
  }
  const day = new Date(Date.parse(startsAt) + 4 * 3_600_000)
    .toISOString()
    .slice(0, 10);
  await page.goto(`/crm/viewings?date=${day}`);
  const appointments = page.getByRole("link", { name: new RegExp(lead.name) });
  await expect(appointments).toHaveCount(50);
  await expect(page.getByText(/50\s+(?:of|\/)\s+55/).first()).toBeVisible();
  await page.getByRole("button", { name: /Load more/ }).click();
  await expect(appointments).toHaveCount(55);
  await expect(page.getByRole("button", { name: /Load more/ })).toHaveCount(0);
});

test("calendar streams its heading and recovers from a failed read", async ({
  page,
}) => {
  await signIn(page);
  const cookie = (await page.context().cookies()).find(
    (item) => item.name === "agency.session",
  );
  expect(cookie).toBeTruthy();
  const sessionDigest = createHash("sha256")
    .update(decodeURIComponent(cookie!.value))
    .digest("hex");
  const controls = "http://127.0.0.1:4312/_e2e/rules";
  const rule = await page.request.post(controls, {
    data: {
      method: "GET",
      path: "/api/v1/staff/viewings",
      sessionDigest,
      status: 503,
    },
  });
  expect(rule.status(), await rule.text()).toBe(201);
  const { id } = await rule.json();
  try {
    await page.goto("/crm/viewings?date=2030-01-14", { waitUntil: "commit" });
    await expect(
      page.getByRole("heading", { name: "Viewings", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("status").filter({ hasText: /Loading/i }),
    ).toBeVisible();
    await page.request.post(`${controls}/${id}/release`);
    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: "Viewings could not be loaded." }),
    ).toBeVisible();
    await page.request.delete(`${controls}/${id}`);
    await page.getByText("Retry viewings", { exact: true }).click();
    await expect(
      page.getByRole("region", { name: "Viewing calendar", exact: true }),
    ).toBeVisible();
    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: "Viewings could not be loaded." }),
    ).toHaveCount(0);
  } finally {
    await page.request.delete(`${controls}/${id}`);
  }
});
