import { createHmac, randomUUID } from "node:crypto";
import { expect, test, type Page, type Request } from "@playwright/test";
import { signInTask } from "../fixtures/task-helpers";

test.setTimeout(90_000);

const control = "http://127.0.0.1:4312/_e2e/rules";
const origin = "http://localhost:3100";
const enquiryMessage = "A fictional directory enquiry about a home in Dubai.";
const receipt = (page: Page) =>
  page.getByText("Your enquiry has been received.", { exact: true });
const send = (page: Page) =>
  page.getByRole("button", { name: "Send enquiry", exact: true });
const isAction = (request: Request) =>
  request.method() === "POST" && Boolean(request.headers()["next-action"]);
const uniqueName = () =>
  `Directory ${randomUUID()
    .slice(0, 8)
    .replace(/\d/g, (digit) => String.fromCharCode(103 + Number(digit)))}`;

async function fill(
  page: Page,
  name: string,
  contact: "phone" | "email" = "email",
) {
  await page.getByLabel("Full name", { exact: true }).fill(name);
  await page.getByRole("radio", { name: "Rent", exact: true }).check();
  await page
    .getByLabel(contact === "phone" ? "Phone" : "Email", { exact: true })
    .fill(
      contact === "phone"
        ? "+971\u00a050\u202f123\u20074567"
        : "fictional-directory@example.com",
    );
  await page.getByLabel("Message", { exact: true }).fill(enquiryMessage);
}

async function leads(page: Page, name: string) {
  await signInTask(page, "manager", "task-recovery");
  const response = await page.request.get(
    `/api/v1/staff/leads?view=all&q=${encodeURIComponent(name)}`,
  );
  expect(response.status(), await response.text()).toBe(200);
  return (await response.json()) as {
    total: number;
    items: {
      id: string;
      name: string;
      purpose: string;
      source: string;
      stage: string;
      phone: string | null;
      email: string | null;
      assignedAgent: unknown;
      property: unknown;
    }[];
  };
}

async function catalogRule(
  page: Page,
  path: string,
  outcome: { status?: 503; empty?: true } = {},
) {
  const response = await page.request.post(control, {
    data: { method: "GET", path, ...outcome },
  });
  expect(response.status(), await response.text()).toBe(201);
  const { id } = (await response.json()) as { id: string };
  expect((await page.request.post(`${control}/${id}/release`)).ok()).toBe(true);
  return {
    async hits() {
      const result = await page.request.get(`${control}/${id}`);
      expect(result.ok()).toBe(true);
      return ((await result.json()) as { hits: number }).hits;
    },
    async remove() {
      await page.request.delete(`${control}/${id}`);
    },
  };
}

async function dropFirstResponse(page: Page) {
  let dropped = false;
  await page.route("**/agents**", async (route) => {
    if (!dropped && isAction(route.request())) {
      dropped = true;
      const response = await route.fetch();
      expect(response.ok()).toBe(true);
      await route.abort("failed");
    } else await route.continue();
  });
}

test.beforeEach(async ({ page }) => {
  const token = randomUUID().replaceAll("-", "");
  await page.setExtraHTTPHeaders({
    "x-e2e-client-ip": `2001:db8::${token.slice(0, 4)}:${token.slice(4, 8)}`,
  });
});

test("directory renders real summary languages without per-card detail requests", async ({
  page,
}, info) => {
  test.skip(
    info.project.name !== "desktop" || info.config.workers !== 1,
    "Shared catalog hit guards require a single-worker desktop run.",
  );
  const response = await page.request.get("/api/v1/public/agents");
  expect(response.ok()).toBe(true);
  const directory = (await response.json()) as {
    items: { slug: string; name: string; languages: string[] }[];
  };
  expect(directory.items.length).toBeGreaterThan(0);
  expect(directory.items.some((agent) => agent.languages.length > 0)).toBe(
    true,
  );
  const rules = [];
  try {
    for (const agent of directory.items)
      rules.push(
        await catalogRule(page, `/api/v1/public/agents/${agent.slug}`),
      );
    await page.goto("/agents");
    await expect(send(page)).toBeEnabled();
    await expect(page.locator("main article")).toHaveCount(
      directory.items.length,
    );
    for (const agent of directory.items) {
      const card = page.locator("main article").filter({
        has: page.getByRole("heading", { name: agent.name, exact: true }),
      });
      if (agent.languages.length)
        await expect(card).toContainText(
          `Languages: ${agent.languages.join(", ")}`,
        );
      else
        await expect(card.getByText("Languages:", { exact: true })).toHaveCount(
          0,
        );
    }
    for (const rule of rules) expect(await rule.hits()).toBe(0);
  } finally {
    for (const rule of rules) await rule.remove();
  }
});

for (const state of ["empty", "outage"] as const) {
  test(`${state} directory retains its independent enquiry form`, async ({
    page,
  }, info) => {
    test.skip(
      info.project.name !== "desktop" || info.config.workers !== 1,
      "Shared list faults require a single-worker desktop run.",
    );
    const rule = await catalogRule(
      page,
      "/api/v1/public/agents",
      state === "empty" ? { empty: true } : { status: 503 },
    );
    try {
      await page.goto("/agents");
      await expect(send(page)).toBeEnabled();
      await expect(page.locator("main form")).toHaveCount(1);
      if (state === "empty")
        await expect(
          page.getByRole("heading", {
            name: "Our team profiles are being prepared.",
            exact: true,
          }),
        ).toBeVisible();
      else
        await expect(
          page.getByText("Agency information is temporarily unavailable", {
            exact: true,
          }),
        ).toBeVisible();
      const name = uniqueName();
      await fill(page, name);
      await send(page).click();
      await expect(receipt(page)).toBeVisible();
      if (state === "outage") {
        await rule.remove();
        await page
          .getByRole("button", { name: "Try again", exact: true })
          .click();
        await expect(page.locator("main article").first()).toBeVisible();
        await expect(receipt(page)).toBeVisible();
      }
    } finally {
      await rule.remove();
    }
  });
}

test("directory requires explicit radio intent, contact and message before a phone-only enquiry", async ({
  page,
}) => {
  await page.goto("/agents");
  await expect(send(page)).toBeEnabled();
  const buy = page.getByRole("radio", { name: "Buy", exact: true });
  const rent = page.getByRole("radio", { name: "Rent", exact: true });
  await expect(buy).not.toBeChecked();
  await expect(rent).not.toBeChecked();
  await send(page).click();
  const summary = page
    .getByRole("alert")
    .filter({ hasText: "Check the highlighted fields" });
  await expect(summary.locator("..")).toBeFocused();
  await expect(
    page.getByRole("group", { name: "I'm looking to", exact: true }),
  ).toHaveAttribute("aria-invalid", "true");
  await expect(buy).toHaveAttribute("aria-describedby", "agency-purpose-error");
  await expect(page.locator("#agency-purpose-error")).toContainText(
    "Choose whether you are looking to buy or rent.",
  );
  await summary.locator('a[href="#agency-purpose"]').click();
  await expect(buy).toBeFocused();
  const name = uniqueName();
  await page.getByLabel("Full name", { exact: true }).fill(name);
  await rent.check();
  await send(page).click();
  await expect(page.getByLabel("Phone", { exact: true })).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await expect(page.getByLabel("Message", { exact: true })).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await fill(page, name, "phone");
  await send(page).click();
  await expect(receipt(page)).toBeVisible();
  const result = await leads(page, name);
  expect(result.total).toBe(1);
  expect(result.items[0]).toMatchObject({
    name,
    phone: "+971 50 123 4567",
    email: null,
    purpose: "rent",
    source: "website",
    stage: "new",
    assignedAgent: null,
    property: null,
  });
});

test("pending directory enquiry blocks duplicates, records one email-only lead and resets radios", async ({
  page,
}) => {
  await page.goto("/agents");
  const name = uniqueName();
  await fill(page, name);
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  let writes = 0;
  await page.route("**/agents**", async (route) => {
    if (isAction(route.request())) {
      writes++;
      await held;
    }
    await route.continue();
  });
  await send(page).click();
  try {
    await expect(
      page.getByRole("button", { name: "Sending enquiry…", exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByRole("radio", { name: "Rent", exact: true }),
    ).toBeDisabled();
    await page.locator("main form").evaluate((form) => {
      (form as HTMLFormElement).requestSubmit();
      (form as HTMLFormElement).requestSubmit();
    });
    expect(writes).toBe(1);
  } finally {
    release();
  }
  await expect(receipt(page)).toBeVisible();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Your enquiry has been received." }),
  ).toBeFocused();
  await page
    .getByRole("button", { name: "Send another enquiry", exact: true })
    .click();
  await expect(page.getByLabel("Full name", { exact: true })).toBeFocused();
  for (const label of ["Full name", "Phone", "Email", "Message"])
    await expect(page.getByLabel(label, { exact: true })).toHaveValue("");
  for (const label of ["Buy", "Rent"])
    await expect(
      page.getByRole("radio", { name: label, exact: true }),
    ).not.toBeChecked();
  const result = await leads(page, name);
  expect(result.total).toBe(1);
  expect(result.items[0]).toMatchObject({
    name,
    phone: null,
    email: "fictional-directory@example.com",
    purpose: "rent",
    source: "website",
    stage: "new",
    assignedAgent: null,
    property: null,
  });
  const detail = await page.request.get(
    `/api/v1/staff/leads/${result.items[0]!.id}`,
  );
  expect(detail.ok()).toBe(true);
  expect((await detail.json()).originalMessage).toBe(enquiryMessage);
});

test("agency recovery preserves entered values and an uncertain directory receipt for explicit replay", async ({
  page,
}, info) => {
  test.skip(
    info.project.name !== "desktop" || info.config.workers !== 1,
    "Shared agency faults require a single-worker desktop run.",
  );
  const rule = await catalogRule(page, "/api/v1/public/agency", {
    status: 503,
  });
  try {
    await page.goto("/agents");
    await expect(
      page.getByText(/Agency details and demo status could not be confirmed/),
    ).toBeVisible();
    const name = uniqueName();
    await fill(page, name);
    await page.getByRole("button", { name: "Try again", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Try again", exact: true }),
    ).toBeEnabled();
    await expect(page.getByLabel("Full name", { exact: true })).toHaveValue(
      name,
    );
    await expect(
      page.getByRole("radio", { name: "Rent", exact: true }),
    ).toBeChecked();
    await dropFirstResponse(page);
    await send(page).click();
    const retry = page.getByRole("button", {
      name: "Retry same enquiry",
      exact: true,
    });
    await expect(retry).toBeVisible();
    await expect(page.getByLabel("Full name", { exact: true })).toBeDisabled();
    await rule.remove();
    await page.getByRole("button", { name: "Try again", exact: true }).click();
    await expect(page.getByText(/Demo agency\./)).toBeVisible();
    await expect(page.getByLabel("Full name", { exact: true })).toHaveValue(
      name,
    );
    await expect(page.getByLabel("Message", { exact: true })).toHaveValue(
      enquiryMessage,
    );
    await expect(page.getByLabel("Full name", { exact: true })).toBeDisabled();
    await retry.click();
    await expect(receipt(page)).toBeVisible();
    expect((await leads(page, name)).total).toBe(1);
  } finally {
    await rule.remove();
  }
});

test("agency recovery retains a completed directory receipt", async ({
  page,
}, info) => {
  test.skip(
    info.project.name !== "desktop" || info.config.workers !== 1,
    "Shared agency faults require a single-worker desktop run.",
  );
  const rule = await catalogRule(page, "/api/v1/public/agency", {
    status: 503,
  });
  try {
    await page.goto("/agents");
    await fill(page, uniqueName());
    await send(page).click();
    await expect(receipt(page)).toBeVisible();
    await expect(page.getByText(/follow-up cannot be confirmed/)).toBeVisible();
    await rule.remove();
    await page.getByRole("button", { name: "Try again", exact: true }).click();
    await expect(page.getByText(/Demo agency\./)).toBeVisible();
    await expect(receipt(page)).toBeVisible();
    await expect(send(page)).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Send another enquiry", exact: true }),
    ).toBeVisible();
  } finally {
    await rule.remove();
  }
});

test("editing an uncertain directory enquiry requires confirmation and creates a new receipt", async ({
  page,
}) => {
  await page.goto("/agents");
  const name = uniqueName();
  await fill(page, name);
  await dropFirstResponse(page);
  await send(page).click();
  const edit = page.getByRole("button", {
    name: "Edit as a new enquiry",
    exact: true,
  });
  await edit.click();
  await expect(page.getByRole("dialog")).toContainText("may already be saved");
  await page
    .getByRole("button", { name: "Keep original enquiry", exact: true })
    .click();
  await expect(page.getByLabel("Full name", { exact: true })).toBeDisabled();
  await edit.click();
  await page
    .getByRole("button", { name: "Edit as new enquiry", exact: true })
    .click();
  await expect(page.getByLabel("Full name", { exact: true })).toBeFocused();
  await page.getByRole("radio", { name: "Buy", exact: true }).check();
  await page
    .getByLabel("Message", { exact: true })
    .fill("A deliberate second fictional enquiry about buying.");
  await send(page).click();
  await expect(receipt(page)).toBeVisible();
  const result = await leads(page, name);
  expect(result.total).toBe(2);
  expect(result.items.map((lead) => lead.purpose).sort()).toEqual([
    "rent",
    "sale",
  ]);
});

test("directory rate limiting preserves values and blocks writes throughout cooldown", async ({
  page,
}) => {
  const token = randomUUID().replaceAll("-", "");
  const ip = `2001:db8::${token.slice(0, 4)}:${token.slice(4, 8)}`;
  await page.setExtraHTTPHeaders({ "x-e2e-client-ip": ip });
  const secret =
    process.env.INQUIRY_RELAY_SECRET ||
    "test-only-inquiry-relay-secret-for-browser-fixtures";
  const key = createHmac("sha256", secret).update(ip).digest("hex");
  for (let index = 0; index < 5; index++) {
    const response = await page.request.post("/api/v1/public/inquiries", {
      headers: {
        Origin: origin,
        "x-inquiry-client-key": key,
        "x-inquiry-relay-signature": createHmac("sha256", secret)
          .update(key)
          .digest("hex"),
      },
      data: {
        submissionId: randomUUID(),
        name: `Directory quota ${index}`,
        purpose: "sale",
        email: "fictional-quota@example.com",
        message: "Fictional directory quota setup.",
      },
    });
    expect(response.status(), await response.text()).toBe(201);
  }
  await page.goto("/agents");
  const name = uniqueName();
  await fill(page, name);
  let writes = 0;
  page.on("request", (request) => {
    if (isAction(request)) writes++;
  });
  await send(page).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "enquiry limit" }),
  ).toBeVisible();
  await expect(
    page.getByRole("status").filter({ hasText: "You can try again in" }),
  ).toBeVisible();
  await expect(send(page)).toBeDisabled();
  await expect(page.getByLabel("Full name", { exact: true })).toHaveValue(name);
  await expect(
    page.getByRole("radio", { name: "Rent", exact: true }),
  ).toBeChecked();
  await page
    .locator("main form")
    .evaluate((form) => (form as HTMLFormElement).requestSubmit());
  expect(writes).toBe(1);
  expect((await leads(page, name)).total).toBe(0);
});
