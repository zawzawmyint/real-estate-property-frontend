import { randomUUID } from "node:crypto";
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

async function dropFirstSave(page: Page, afterDispatch = false) {
  let dropped = false;
  await page.route("**/crm/viewings/**", async (route) => {
    if (
      !dropped &&
      route.request().method() === "POST" &&
      route.request().headers()["next-action"]
    ) {
      dropped = true;
      if (afterDispatch) await route.fetch();
      await route.abort("failed");
    } else await route.continue();
  });
  await page
    .getByRole("button", { name: "Schedule viewing", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Retry same booking", exact: true }),
  ).toBeVisible();
}

async function countBookings(page: Page, leadId: string, day: string) {
  const query = new URLSearchParams({
    leadId,
    from: `${day}T00:00:00+04:00`,
    to: `${day}T23:59:59+04:00`,
  });
  const response = await page.request.get(`/api/v1/staff/viewings?${query}`);
  expect(response.status()).toBe(200);
  return (await response.json()).total;
}

test("pre-dispatch loss followed by reassignment permits explicit review and safe correction", async ({
  page,
}) => {
  const other = await signIn(page, "other-agent");
  const lead = await assignedLead(page);
  const day = await fillBooking(page, lead);
  await dropFirstSave(page);
  const assigned = await page.request.patch(
    `/api/v1/staff/leads/${lead.id}/assignment`,
    {
      headers,
      data: { expectedVersion: lead.version, assignedAgentId: other.id },
    },
  );
  expect(assigned.status()).toBe(200);
  await page
    .getByRole("button", { name: "Retry same booking", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Schedule viewing", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Load latest lead for review" })
    .click();
  await expect(page.getByLabel("Date", { exact: true })).toHaveValue(day);
  await expect(page.getByText(other.name, { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Schedule viewing", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Viewing details", exact: true }),
  ).toBeVisible();
  expect(await countBookings(page, lead.id, day)).toBe(1);
});

test("pre-dispatch loss followed by server time rejection preserves values and permits correction", async ({
  page,
}) => {
  const lead = await assignedLead(page);
  await fillBooking(page, lead);
  // Change time only after hydration so server/client calendar markup agrees.
  // The browser believes this time is future; the authoritative server rejects it.
  await page.clock.setFixedTime(new Date("2020-01-01T00:00:00Z"));
  const oldDay = "2020-01-02";
  await page.getByLabel("Date", { exact: true }).fill(oldDay);
  await dropFirstSave(page);
  await page
    .getByRole("button", { name: "Retry same booking", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Schedule viewing", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Load latest lead for review" })
    .click();
  await expect(page.getByLabel("Date", { exact: true })).toHaveValue(oldDay);
  await page.clock.setFixedTime(new Date());
  const day = new Date(Date.now() + 86400000 + 14400000)
    .toISOString()
    .slice(0, 10);
  await page.getByLabel("Date", { exact: true }).fill(day);
  await page
    .getByRole("button", { name: "Schedule viewing", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Viewing details", exact: true }),
  ).toBeVisible();
  expect(await countBookings(page, lead.id, day)).toBe(1);
});

test("correcting a lost successful booking opens the saved receipt instead of inserting twice", async ({
  page,
}) => {
  const lead = await assignedLead(page);
  const day = await fillBooking(page, lead);
  await dropFirstSave(page, true);
  await page
    .getByRole("button", { name: "Load latest lead for review" })
    .click();
  await page.getByLabel("Start time", { exact: true }).fill("12:00");
  await page.getByLabel("End time", { exact: true }).fill("13:00");
  await page
    .getByRole("button", { name: "Schedule viewing", exact: true })
    .click();
  await page
    .getByRole("link", { name: "Review saved viewing", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Viewing details", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("11:00–12:00", { exact: true })).toBeVisible();
  expect(await countBookings(page, lead.id, day)).toBe(1);
});

test("lead assignment dialog refreshes existing calendar cards without changing week or reloading", async ({
  page,
}) => {
  const other = await signIn(page, "other-agent");
  const { lead, viewing } = await book(page);
  const day = new Date(Date.parse(viewing.startsAt) + 14400000)
    .toISOString()
    .slice(0, 10);
  await page.goto(`/crm/leads/${lead.id}?date=${day}`);
  const calendar = page.getByRole("region", {
    name: "Viewing calendar",
    exact: true,
  });
  await expect(
    calendar.getByText(viewing.assignedAgent.name, { exact: true }).last(),
  ).toBeVisible();
  const originalUrl = page.url();
  const navigations: string[] = [];
  page.on("request", (request) => {
    if (request.isNavigationRequest()) navigations.push(request.url());
  });
  await page
    .getByRole("button", { name: "Reassign agent", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Search active agents", { exact: true })
    .fill(other.name);
  await dialog.getByRole("radio", { name: other.name, exact: true }).check();
  await dialog
    .getByRole("button", { name: "Save assignment", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  await expect(
    calendar.getByText(other.name, { exact: true }).last(),
  ).toBeVisible();
  await expect(
    calendar.getByText(viewing.assignedAgent.name, { exact: true }),
  ).toHaveCount(0);
  expect(page.url()).toBe(originalUrl);
  expect(navigations).toEqual([]);
});

test("detail refresh updates assignment at unchanged viewing version while preserving dirty schedule", async ({
  page,
}) => {
  const other = await signIn(page, "other-agent");
  const { lead, viewing } = await book(page);
  await page.goto(`/crm/viewings/${viewing.id}`);
  await page
    .getByRole("button", { name: "Reschedule viewing", exact: true })
    .click();
  await page.getByLabel("Start time", { exact: true }).fill("14:00");
  await page.getByLabel("End time", { exact: true }).fill("15:00");
  const assigned = await page.request.patch(
    `/api/v1/staff/leads/${lead.id}/assignment`,
    {
      headers,
      data: { expectedVersion: lead.version, assignedAgentId: other.id },
    },
  );
  expect(assigned.status()).toBe(200);
  const fresh = await page.request.get(`/api/v1/staff/viewings/${viewing.id}`);
  expect((await fresh.json()).version).toBe(viewing.version);
  await page
    .getByRole("button", { name: "Refresh appointment", exact: true })
    .click();
  await expect(page.getByText(other.name, { exact: true })).toBeVisible();
  await expect(page.getByLabel("Start time", { exact: true })).toHaveValue(
    "14:00",
  );
  await expect(page.getByLabel("End time", { exact: true })).toHaveValue(
    "15:00",
  );
  await expect(
    page.getByRole("button", {
      name: "I have reviewed the latest appointment",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Save new time", exact: true }),
  ).toBeDisabled();
});

for (const dirty of [true, false]) {
  test(`closed ${dirty ? "dirty" : "pristine"} schedule reconciles an external reschedule`, async ({
    page,
  }) => {
    const { lead, viewing } = await book(page);
    await page.goto(`/crm/viewings/${viewing.id}`);
    const open = page.getByRole("button", {
      name: "Reschedule viewing",
      exact: true,
    });
    await open.click();
    if (dirty) {
      await page.getByLabel("Start time", { exact: true }).fill("14:00");
      await page.getByLabel("End time", { exact: true }).fill("15:00");
    }
    await page
      .getByRole("button", { name: "Close reschedule", exact: true })
      .click();
    const day = new Date(Date.now() + 2 * 86400000 + 14400000)
      .toISOString()
      .slice(0, 10);
    const changed = await page.request.patch(
      `/api/v1/staff/viewings/${viewing.id}`,
      {
        headers,
        data: {
          expectedVersion: viewing.version,
          expectedLeadVersion: lead.version,
          startsAt: `${day}T16:00:00+04:00`,
          endsAt: `${day}T17:00:00+04:00`,
        },
      },
    );
    expect(changed.status()).toBe(200);
    await page
      .getByRole("button", { name: "Refresh appointment", exact: true })
      .click();
    await expect(page.getByText("16:00–17:00", { exact: true })).toBeVisible();
    const review = page.getByRole("button", {
      name: "I have reviewed the latest appointment",
      exact: true,
    });
    if (dirty) {
      await expect(review).toBeVisible();
      // The existing review guard blocks reopening too, so no save can bypass acknowledgement.
      await expect(open).toBeDisabled();
      await expect(
        page.getByRole("button", { name: "Save new time", exact: true }),
      ).toHaveCount(0);
      await review.click();
    } else await expect(review).toHaveCount(0);
    await open.click();
    await expect(page.getByLabel("Start time", { exact: true })).toHaveValue(
      dirty ? "14:00" : "16:00",
    );
    await expect(page.getByLabel("End time", { exact: true })).toHaveValue(
      dirty ? "15:00" : "17:00",
    );
    if (!dirty)
      await expect(page.getByLabel("Date", { exact: true })).toHaveValue(day);
    await expect(
      page.getByRole("button", { name: "Save new time", exact: true }),
    ).toBeEnabled();
  });
}
