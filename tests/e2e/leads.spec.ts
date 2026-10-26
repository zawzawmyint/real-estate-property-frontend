import { randomUUID } from "node:crypto";
import {
  expect,
  test,
  type Page,
  type Cookie,
  type Request,
} from "@playwright/test";

test.setTimeout(90_000);

const origin = "http://localhost:3100";
const headers = { Origin: origin };
const identities = new Map<
  string,
  {
    cookies: Cookie[];
    user: { id: string; name: string };
  }
>();

async function signIn(page: Page, identity = "manager") {
  const key = `${test.info().project.name}-${identity}`;
  const cached = identities.get(key);

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

  identities.set(key, { cookies: await page.context().cookies(), user });
  return user;
}

async function createLead(page: Page, extra: Record<string, unknown> = {}) {
  const response = await page.request.post("/api/v1/staff/leads", {
    headers,
    data: {
      submissionId: randomUUID(),
      name: `Lead browser ${randomUUID().slice(0, 8)}`,
      phone: "+971 50 123 4567",
      purpose: "sale",
      source: "call",
      ...extra,
    },
  });

  expect(response.status(), await response.text()).toBe(201);

  return (await response.json()) as {
    id: string;
    name: string;
    version: number;
    assignedAgent: { id: string; name: string } | null;
  };
}

test("visitor inquiry reaches the manager inbox, is assigned and followed up", async ({
  page,
}, testInfo) => {
  await page.setExtraHTTPHeaders({
    "x-e2e-client-ip":
      testInfo.project.name === "desktop" ? "192.0.2.10" : "192.0.2.11",
  });
  const properties = await page.request.get("/api/v1/properties?purpose=sale");

  expect(properties.status()).toBe(200);

  const propertyBody = await properties.json();
  const property = (propertyBody.items ?? propertyBody.properties)[0] as {
    id: string;
  };
  const name = `Inquiry browser ${randomUUID().slice(0, 8)}`;

  await page.goto(`/properties/${property.id}`);
  await expect(
    page.getByRole("heading", { name: "Enquire about this property" }),
  ).toBeVisible();
  await page.getByLabel("Name", { exact: true }).fill(name);
  await page.getByLabel("Email", { exact: true }).fill("fictional@example.com");
  await page
    .getByLabel("Message (optional)", { exact: true })
    .fill("Please contact me about this fictional viewing inquiry.");
  await page.getByRole("button", { name: "Send inquiry", exact: true }).click();
  await expect(page.getByText(/Our team will contact you/i)).toBeVisible();

  const agent = await signIn(page, "agent");

  await signIn(page, "manager");
  await page.goto(`/crm/leads?view=unassigned&q=${encodeURIComponent(name)}`);
  await expect(page.getByRole("link", { name, exact: true })).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("leads-inbox.png"),
    fullPage: true,
  });
  await page.getByRole("link", { name, exact: true }).click();
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();

  const id = new URL(page.url()).pathname.split("/").at(-1)!;

  await page
    .getByRole("button", { name: "Assign agent", exact: true })
    .first()
    .click();
  const dialog = page.getByRole("dialog");

  await expect(dialog).toBeVisible();
  // Assignment uses native radio choices within a searchable, labelled group.
  const nativeSelect = dialog.locator("select");

  if (await nativeSelect.count()) {
    await nativeSelect.selectOption(agent.id);
  } else {
    await dialog
      .getByLabel("Search active agents", { exact: true })
      .fill(agent.name);
    await dialog.getByRole("radio", { name: agent.name, exact: true }).check();
  }
  await dialog
    .getByRole("button", { name: /Assign agent|Save assignment/ })
    .click();
  await expect(dialog).not.toBeVisible();

  await signIn(page, "agent");
  await page.goto(`/crm/leads/${id}`);
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  await page
    .getByLabel(/Note|Content|Message/, { exact: true })
    .fill("Called the client and discussed preferences.");
  await page.getByRole("button", { name: "Add note", exact: true }).click();
  await expect(
    page.getByText("Called the client and discussed preferences.", {
      exact: true,
    }),
  ).toBeVisible();
  await page.getByLabel("Stage", { exact: true }).selectOption("contacted");
  await page.getByRole("button", { name: "Save stage", exact: true }).click();
  await expect(page.getByText(/Contacted/).first()).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Called the client and discussed preferences.", {
      exact: true,
    }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("lead-detail.png"),
    fullPage: true,
  });
});

test("assignment dialog supports keyboard dismissal and restores trigger focus", async ({
  page,
}) => {
  await signIn(page);
  const lead = await createLead(page);

  await page.goto(`/crm/leads/${lead.id}`);
  const trigger = page
    .getByRole("button", { name: "Assign agent", exact: true })
    .first();

  await trigger.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByLabel("Search active agents", { exact: true })
    .fill("No matching fictional agent");
  await expect(
    page.getByText("No active agents found.", { exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

test("lead headings and filters render while independent result data is held", async ({
  page,
}) => {
  await signIn(page);
  const lead = await createLead(page);
  const control = "http://127.0.0.1:4312/_e2e/rules";
  const registered = await page.request.post(control, {
    data: {
      method: "GET",
      path: "/api/v1/staff/leads",
      query: { q: lead.name },
    },
  });

  expect(registered.status(), await registered.text()).toBe(201);
  const { id } = (await registered.json()) as { id: string };

  try {
    await page.goto(
      `/crm/leads?view=unassigned&q=${encodeURIComponent(lead.name)}`,
      { waitUntil: "commit" },
    );
    await expect(
      page.getByRole("heading", { name: "Leads", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "New lead", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: lead.name, exact: true }),
    ).toHaveCount(0);
    const hits = await page.request.get(`${control}/${id}`);

    expect((await hits.json()).hits).toBeGreaterThan(0);
    await page.request.post(`${control}/${id}/release`);
    await expect(
      page.getByRole("link", { name: lead.name, exact: true }),
    ).toBeVisible();
  } finally {
    await page.request.delete(`${control}/${id}`);
  }
});

test("manual lead form saves contact details and exact AED budget", async ({
  page,
}) => {
  await signIn(page);
  const name = `Manual browser ${randomUUID().slice(0, 8)}`;
  const propertyTitle = `Lead property ${randomUUID().slice(0, 8)}`;
  const propertyResponse = await page.request.post("/api/v1/staff/properties", {
    headers,
    data: { title: propertyTitle, purpose: "rent" },
  });

  expect(propertyResponse.status(), await propertyResponse.text()).toBe(201);
  const property = (await propertyResponse.json()) as { id: string };

  await page.goto("/crm/leads/new");
  // The initial empty search must load eligible options without a rejected q=.
  await page.getByRole("radio", { name: propertyTitle, exact: true }).check();
  await expect(page.getByLabel("Purpose", { exact: true })).toHaveValue("rent");
  await page.getByLabel("Name", { exact: true }).fill(name);
  await page.getByLabel("Phone", { exact: true }).fill("+971 50 765 4321");
  await page.getByLabel(/Budget.*AED/).fill("1250000.50");
  await page
    .getByRole("button", { name: /Create lead|Save lead/, exact: true })
    .click();
  await expect(page).toHaveURL(/\/crm\/leads\/[\w-]+(?:\?.*)?$/);
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();

  const saved = await page.request.get(
    `/api/v1/staff/leads/${new URL(page.url()).pathname.split("/").at(-1)}`,
  );

  expect(saved.status()).toBe(200);
  const savedLead = await saved.json();

  expect(savedLead.budgetFils).toBe(125000050);
  expect(savedLead.property.id).toBe(property.id);
  expect(savedLead.purpose).toBe("rent");
  await page.getByRole("link", { name: "Edit details", exact: true }).click();
  await page.getByLabel("Email", { exact: true }).fill("updated@example.com");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("link", { name: "updated@example.com", exact: true }),
  ).toBeVisible();
});

test("reassignment revokes former-agent reads, activity and stale writes", async ({
  page,
}) => {
  const first = await signIn(page, "agent");
  const second = await signIn(page, "other-agent");

  await signIn(page, "manager");
  const lead = await createLead(page, { assignedAgentId: first.id });

  await signIn(page, "agent");
  await page.goto(`/crm/leads/${lead.id}`);
  await expect(
    page.getByRole("heading", { name: lead.name, exact: true }),
  ).toBeVisible();
  await signIn(page, "manager");
  const reassigned = await page.request.patch(
    `/api/v1/staff/leads/${lead.id}/assignment`,
    {
      headers,
      data: { expectedVersion: lead.version, assignedAgentId: second.id },
    },
  );

  expect(reassigned.status(), await reassigned.text()).toBe(200);
  await signIn(page, "agent");
  for (const suffix of ["", "/activity"]) {
    const denied = await page.request.get(
      `/api/v1/staff/leads/${lead.id}${suffix}`,
    );

    expect(denied.status()).toBe(404);
    expect(await denied.text()).not.toContain(lead.name);
  }
  const deniedWrite = await page.request.patch(
    `/api/v1/staff/leads/${lead.id}/stage`,
    {
      headers,
      data: { expectedVersion: lead.version, stage: "won" },
    },
  );

  expect(deniedWrite.status()).toBe(404);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: lead.name, exact: true }),
  ).not.toBeVisible();
  await signIn(page, "other-agent");
  await page.goto(`/crm/leads/${lead.id}`);
  await expect(
    page.getByRole("heading", { name: lead.name, exact: true }),
  ).toBeVisible();
});

test("note submission keys replay without duplicate records", async ({
  page,
}) => {
  await signIn(page, "agent");
  const lead = await createLead(page);
  const data = {
    submissionId: randomUUID(),
    expectedVersion: lead.version,
    kind: "call",
    body: `Call replay ${randomUUID()}`,
  };
  const created = await page.request.post(
    `/api/v1/staff/leads/${lead.id}/notes`,
    { headers, data },
  );
  const replay = await page.request.post(
    `/api/v1/staff/leads/${lead.id}/notes`,
    { headers, data },
  );

  expect(created.status(), await created.text()).toBe(201);
  expect(replay.status(), await replay.text()).toBe(200);
  const activity = await page.request.get(
    `/api/v1/staff/leads/${lead.id}/activity`,
  );
  const events = (await activity.json()).items as {
    note: { body: string } | null;
  }[];

  expect(events.filter((event) => event.note?.body === data.body)).toHaveLength(
    1,
  );
  const changedPayload = await page.request.post(
    `/api/v1/staff/leads/${lead.id}/notes`,
    {
      headers,
      data: { ...data, body: "Different body with the same key" },
    },
  );

  expect(changedPayload.status()).toBe(409);
});

test("manager can filter retained leads assigned to an inactive agent", async ({
  page,
}, testInfo) => {
  await signIn(page);
  const name = `Inactive assignment ${testInfo.project.name}`;
  const agentName = `Lead E2E ${testInfo.project.name} inactive agent`;
  const response = await page.request.get(
    `/api/v1/staff/leads?view=all&q=${encodeURIComponent(name)}`,
  );

  expect(response.status()).toBe(200);
  const lead = (await response.json()).items[0] as {
    id: string;
    assignedAgent: { id: string; available: boolean };
  };

  expect(lead.assignedAgent.available).toBe(false);
  await page.goto(`/crm/leads?view=all&q=${encodeURIComponent(name)}`);
  await page
    .getByRole("link", {
      name: `View leads assigned to ${agentName}`,
      exact: true,
    })
    .click();
  await expect
    .poll(() => new URL(page.url()).searchParams.get("agentId"))
    .toBe(lead.assignedAgent.id);
  await expect(page.getByRole("link", { name, exact: true })).toBeVisible();
  await page.goto(`/crm/leads/${lead.id}`);
  const contextLink = page.getByRole("link", {
    name: `View leads assigned to ${agentName}`,
    exact: true,
  });

  await expect(contextLink).toBeVisible();
  await contextLink.click();
  await expect
    .poll(() => new URL(page.url()).searchParams.get("agentId"))
    .toBe(lead.assignedAgent.id);
});

test("lost inquiry response explicitly retries the same submission without duplication", async ({
  page,
}, testInfo) => {
  await page.setExtraHTTPHeaders({
    "x-e2e-client-ip":
      testInfo.project.name === "desktop" ? "192.0.2.20" : "192.0.2.21",
  });
  const properties = await page.request.get("/api/v1/properties?purpose=sale");
  const property = (await properties.json()).items[0] as { id: string };
  const name = `Lost response ${randomUUID().slice(0, 8)}`;
  let dropped = false;

  await page.goto(`/properties/${property.id}`);
  await page.getByLabel("Name", { exact: true }).fill(name);
  await page
    .getByLabel("Email", { exact: true })
    .fill("fictional-lost@example.com");
  await page.route("**/properties/**", async (route) => {
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
  await page.getByRole("button", { name: "Send inquiry", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Retry same inquiry", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Name", { exact: true })).toHaveValue(name);
  await page
    .getByRole("button", { name: "Retry same inquiry", exact: true })
    .click();
  await expect(page.getByText(/Our team will contact you/i)).toBeVisible();
  expect(dropped).toBe(true);
  await signIn(page);
  const leads = await page.request.get(
    `/api/v1/staff/leads?view=all&q=${encodeURIComponent(name)}`,
  );

  expect(leads.status()).toBe(200);
  expect((await leads.json()).total).toBe(1);
});

test("inbox filters preserve query state and narrow layouts do not overflow", async ({
  page,
}, testInfo) => {
  await signIn(page);
  const lead = await createLead(page);

  await page.goto("/crm/leads?view=unassigned");
  const search = page.getByLabel("Search leads", { exact: true });

  await search.fill(lead.name);
  await expect
    .poll(() => new URL(page.url()).searchParams.get("q"))
    .toBe(lead.name);
  await expect(search).toBeFocused();
  await expect(
    page.getByRole("link", { name: lead.name, exact: true }),
  ).toBeVisible();

  async function noRepeatedSearch(value: string) {
    const repeated: string[] = [];
    const record = (request: Request) => {
      const url = new URL(request.url());

      if (
        url.pathname === "/crm/leads" &&
        request.method() === "GET" &&
        request.headers().rsc === "1" &&
        !request.headers()["next-router-prefetch"]
      )
        repeated.push(request.url());
    };

    page.on("request", record);
    try {
      await search.fill(value);
      // This bounded observation covers three debounce windows and asserts
      // the absence of requests, rather than waiting for a click/result.
      await page.waitForTimeout(1100);
      expect(repeated).toEqual([]);
      await expect(search).toHaveValue(value);
      await expect(search).toBeFocused();
    } finally {
      page.off("request", record);
    }
  }

  await noRepeatedSearch(` ${lead.name} `);
  await search.fill("");
  await expect.poll(() => new URL(page.url()).searchParams.get("q")).toBeNull();
  await noRepeatedSearch("   ");

  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(
      `/crm/leads?view=unassigned&q=${encodeURIComponent(lead.name)}`,
    );
    await expect(
      page.getByRole("link", { name: lead.name, exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (width === 320 || width === 1440)
      await page.screenshot({
        path: testInfo.outputPath(`leads-${width}.png`),
        fullPage: true,
      });
  }
  await page.getByRole("link", { name: lead.name, exact: true }).click();
  await expect(
    page.getByRole("heading", { name: lead.name, exact: true }),
  ).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(
    new RegExp(
      `q=${encodeURIComponent(lead.name).replaceAll("%20", "(?:%20|\\+)")}`,
    ),
  );
  await expect(
    page.getByRole("link", { name: lead.name, exact: true }),
  ).toBeVisible();
});
