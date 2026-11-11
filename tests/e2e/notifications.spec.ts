import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";

const inboxPath = "/api/v1/staff/notifications";
const headers = { Origin: "http://localhost:3100" };

function bell(page: Page) {
  return page.getByRole("button", { name: /^Notifications(?:, \d+ unread)?$/ });
}

function inbox(page: Page) {
  return page.getByRole("dialog", { name: "Notifications", exact: true });
}

async function signIn(page: Page, role: "manager" | "agent" | "other-agent") {
  const response = await page.request.post("/api/v1/auth/sign-in/email", {
    headers,
    data: {
      email: `e2e-notification-${test.info().project.name}-${role}@example.com`,
      password: process.env.STAFF_E2E_PASSWORD,
      rememberMe: true,
    },
  });
  expect(response.status(), await response.text()).toBe(200);
  const session = await page.request.get("/api/v1/auth/get-session");
  return (await session.json()).user.id as string;
}

async function createLead(manager: Page, assignedAgentId?: string) {
  const response = await manager.request.post("/api/v1/staff/leads", {
    headers,
    data: {
      submissionId: randomUUID(),
      name: `Notification buyer ${randomUUID().slice(0, 8)}`,
      email: "fictional@example.com",
      purpose: "sale",
      source: "call",
      assignedAgentId,
    },
  });
  expect(response.status(), await response.text()).toBe(201);
  return (await response.json()) as {
    id: string;
    name: string;
    version: number;
  };
}

test("live assignment reaches only its recipient, survives reconnect, and persists read state", async ({
  page,
  browser,
}, info) => {
  test.setTimeout(120_000);
  const manager = await browser.newPage({ baseURL: headers.Origin });
  const other = await browser.newPage({ baseURL: headers.Origin });
  try {
    const agentId = await signIn(page, "agent");
    await signIn(manager, "manager");
    const otherId = await signIn(other, "other-agent");
    const lead = await createLead(manager);
    const stream = page.waitForResponse(
      (response) =>
        response.url().endsWith(`${inboxPath}/stream`) && response.ok(),
    );
    await page.goto("/crm", { waitUntil: "domcontentloaded" });
    await stream;
    if (info.project.name === "mobile")
      await page.setViewportSize({ width: 320, height: 680 });

    await expect(bell(page)).toHaveCount(1);
    await expect(bell(page)).toBeEnabled();
    await bell(page).focus();
    await page.keyboard.press("Enter");
    await expect(inbox(page).getByText("You’re all caught up.")).toBeVisible();
    const close = inbox(page).getByRole("button", {
      name: "Close notifications",
    });
    await expect(close).toBeFocused();

    const assignment = await manager.request.patch(
      `/api/v1/staff/leads/${lead.id}/assignment`,
      {
        headers,
        data: { expectedVersion: lead.version, assignedAgentId: agentId },
      },
    );
    expect(assignment.status(), await assignment.text()).toBe(200);
    const assignedVersion = (await assignment.json()).version as number;
    const link = inbox(page).locator(`a[href="/crm/leads/${lead.id}"]`);
    await expect(link).toBeVisible();
    await expect(close).toBeFocused();
    await expect(bell(page)).toHaveAccessibleName("Notifications, 1 unread");
    expect((await (await other.request.get(inboxPath)).json()).items).toEqual(
      [],
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const bounds = await inbox(page).boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(
      page.viewportSize()!.width,
    );
    await page.screenshot({ path: info.outputPath("notification-inbox.png") });

    await page.keyboard.press("Escape");
    await expect(inbox(page)).not.toBeVisible();
    await expect(bell(page)).toBeFocused();
    await page.keyboard.press("Enter");
    await link.click();
    await expect(page).toHaveURL(`/crm/leads/${lead.id}`);
    await expect(
      page.getByRole("heading", { name: lead.name, exact: true }),
    ).toBeVisible();
    await page.reload();
    await bell(page).click();
    await expect(link.getByText("Read", { exact: true })).toBeVisible();
    await expect(bell(page)).toHaveAccessibleName("Notifications");

    await page.context().setOffline(true);
    const offlineLead = await createLead(manager, agentId);
    await page.context().setOffline(false);
    const offlineLink = inbox(page).locator(
      `a[href="/crm/leads/${offlineLead.id}"]`,
    );
    await expect(offlineLink).toBeVisible({ timeout: 20_000 });
    await expect(bell(page)).toHaveAccessibleName("Notifications, 1 unread");

    if (info.project.name === "desktop") {
      const newTab = page.context().waitForEvent("page");
      await offlineLink.click({ modifiers: ["Control"] });
      const destination = await newTab;
      try {
        await expect(destination).toHaveURL(`/crm/leads/${offlineLead.id}`);
        await expect(
          offlineLink.getByText("Read", { exact: true }),
        ).toBeVisible();
      } finally {
        await destination.close();
      }
    }

    const reassignment = await manager.request.patch(
      `/api/v1/staff/leads/${lead.id}/assignment`,
      {
        headers,
        data: { expectedVersion: assignedVersion, assignedAgentId: otherId },
      },
    );
    expect(reassignment.status(), await reassignment.text()).toBe(200);
    await expect(link).toHaveCount(0);
    await expect(offlineLink).toBeVisible();

    const wrongAccount = await other.request.get(inboxPath, {
      headers: { "X-Staff-Account": agentId },
    });
    expect(wrongAccount.status()).toBe(403);

    const signOut = await page.request.post("/api/v1/auth/sign-out", {
      headers,
    });
    expect(signOut.ok()).toBe(true);
    // The signed-out session's heartbeat ends its stream and the active page
    // rechecks authorization even though the client did not initiate sign-out.
    await expect(page).toHaveURL(/\/login$/, { timeout: 25_000 });
    const email = page.getByLabel("Email address");
    await expect(email).toBeEnabled();
    await email.fill(
      `e2e-notification-${info.project.name}-other-agent@example.com`,
    );
    await page
      .getByLabel("Password", { exact: true })
      .fill(process.env.STAFF_E2E_PASSWORD!);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL("/crm");
    await expect(bell(page)).toBeEnabled();
    await bell(page).click();
    await expect(offlineLink).toHaveCount(0);
    await expect(link).toBeVisible();
    await expect(bell(page)).toHaveAccessibleName("Notifications, 1 unread");
  } finally {
    await manager.close();
    await other.close();
  }
});

test("inbox preserves data on failure and replaces stale pages on a live change", async ({
  page,
}) => {
  const managerId = await signIn(page, "manager");
  await page.addInitScript(() => {
    class FixtureEventSource extends EventTarget {
      static readonly OPEN = 1;
      readonly readyState = FixtureEventSource.OPEN;
      onopen: (() => void) | null = null;
      onerror: (() => void) | null = null;

      private changed = () =>
        this.dispatchEvent(new Event("notifications.changed"));

      constructor() {
        super();
        window.addEventListener("test-inbox-changed", this.changed);
        queueMicrotask(() => this.onopen?.());
      }

      close() {
        window.removeEventListener("test-inbox-changed", this.changed);
      }
    }

    Object.defineProperty(window, "EventSource", { value: FixtureEventSource });
  });

  const signal = () =>
    page.evaluate(() => {
      window.dispatchEvent(new Event("test-inbox-changed"));
    });
  const start = Promise.withResolvers<void>();
  const stale = Promise.withResolvers<void>();
  const finished = Promise.withResolvers<void>();
  let phase: "first" | "failure" | "live" | "denied" = "first";
  let staleRequest = false;
  const first = fixtureItem("lead_assigned");
  const second = fixtureItem("viewing_rescheduled");
  const third = fixtureItem("task_due_soon");
  const newest = fixtureItem("website_inquiry_received");
  const retired = fixtureItem("viewing_cancelled");

  await page.route(new RegExp(`${inboxPath}(?:\\?.*)?$`), async (route) => {
    const request = route.request();
    const cursor = new URL(request.url()).searchParams.get("cursor");
    expect(request.headers()["x-staff-account"]).toBe(managerId);

    if (phase === "failure" || phase === "denied") {
      await route.fulfill({ status: phase === "failure" ? 503 : 403 });
    } else if (cursor === "first-tail") {
      staleRequest = true;
      await stale.promise;
      await route
        .fulfill({
          json: { items: [retired], unreadCount: 2, nextCursor: null },
        })
        .catch(() => {});
      finished.resolve();
    } else if (cursor === "live-tail") {
      await route.fulfill({
        json: {
          items: [first, second, third],
          unreadCount: 4,
          nextCursor: null,
        },
      });
    } else if (phase === "live") {
      await route.fulfill({
        json: {
          items: [newest, first],
          unreadCount: 4,
          nextCursor: "live-tail",
        },
      });
    } else {
      await start.promise;
      await route.fulfill({
        json: {
          items: [first, second],
          unreadCount: 2,
          nextCursor: "first-tail",
        },
      });
    }
  });

  try {
    await page.goto("/crm");
    await bell(page).click();
    await expect(inbox(page).getByRole("status")).toHaveText(
      /Loading notifications/,
    );
    start.resolve();
    await expect(bell(page)).toHaveAccessibleName("Notifications, 2 unread");
    const initialLink = inbox(page).getByRole("link", {
      name: /New lead assigned/,
    });
    await expect(initialLink).toHaveAttribute(
      "href",
      `/crm/leads/${first.leadId}`,
    );

    phase = "failure";
    await signal();
    await expect(inbox(page).getByRole("alert")).toContainText(
      "Couldn’t refresh notifications.",
    );
    await expect(initialLink).toBeVisible();
    phase = "first";
    await inbox(page)
      .getByRole("button", { name: "Retry notifications" })
      .click();
    await expect(inbox(page).getByRole("alert")).toHaveCount(0);

    const more = inbox(page).getByRole("button", { name: "Load more" });
    await more.focus();
    await page.keyboard.press("Enter");
    await expect.poll(() => staleRequest).toBe(true);
    phase = "live";
    await signal();
    const taskLink = inbox(page).getByRole("link", {
      name: /Follow-up task due soon/,
    });
    await expect(taskLink).toHaveAttribute(
      "href",
      `/crm/tasks/${third.taskId}`,
    );
    await expect(taskLink).toBeFocused();
    await expect(
      inbox(page).getByRole("link", { name: /Viewing rescheduled/ }),
    ).toHaveAttribute("href", `/crm/viewings/${second.viewingId}`);
    await expect(
      inbox(page).getByRole("link", { name: /New website inquiry/ }),
    ).toHaveAttribute("href", `/crm/leads/${newest.leadId}`);
    await expect(inbox(page).getByRole("link")).toHaveCount(4);
    await expect(bell(page)).toHaveAccessibleName("Notifications, 4 unread");
    stale.resolve();
    await finished.promise;
    await expect(
      inbox(page).getByRole("link", { name: /Viewing cancelled/ }),
    ).toHaveCount(0);
    await expect(bell(page)).toHaveAccessibleName("Notifications, 4 unread");

    phase = "denied";
    await signal();
    await expect(inbox(page)).not.toBeVisible();
    await expect(bell(page)).toBeDisabled();
    await expect(bell(page)).toHaveAccessibleName("Notifications");
  } finally {
    start.resolve();
    stale.resolve();
  }
});

function fixtureItem(type: string) {
  return {
    id: randomUUID(),
    leadId: randomUUID(),
    viewingId: type.startsWith("viewing_") ? randomUUID() : null,
    taskId: type === "task_due_soon" ? randomUUID() : null,
    type,
    createdAt: "2026-11-10T08:03:00.000Z",
    readAt: null,
  };
}
