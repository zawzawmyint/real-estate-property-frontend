import { expect, test, type Page } from "@playwright/test";
import {
  createTask,
  fillTask,
  signInTask,
  taskHeaders,
  taskLead,
} from "../fixtures/task-helpers";

test.setTimeout(90_000);
test.describe.configure({ mode: "default" });
test.use({ timezoneId: "America/New_York" });

async function loseSave(page: Page, button: string, afterDispatch: boolean) {
  let dropped = false;
  await page.route("**/crm/tasks/**", async (route) => {
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
  await page.getByRole("button", { name: button, exact: true }).click();
  return () => page.unrouteAll({ behavior: "wait" });
}

test("lost creation response replays the same task without a second insert", async ({
  page,
}) => {
  const lead = await taskLead(page, "task-recovery");
  const { title } = await fillTask(page, lead.id);
  await loseSave(page, "Create task", true);
  await expect(
    page.getByRole("button", { name: "Retry same task", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Retry same task", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
  const response = await page.request.get(
    `/api/v1/staff/tasks?leadId=${lead.id}&status=all`,
  );
  expect((await response.json()).total).toBe(1);
});

test("pre-dispatch failure and assignment change allow explicit review with preserved fields", async ({
  page,
}) => {
  const other = await signInTask(page, "other-agent", "task-recovery");
  const lead = await taskLead(page, "task-recovery");
  const { title } = await fillTask(page, lead.id);
  await loseSave(page, "Create task", false);
  await expect(
    page.getByRole("button", { name: "Retry same task", exact: true }),
  ).toBeVisible();
  const changed = await page.request.patch(
    `/api/v1/staff/leads/${lead.id}/assignment`,
    {
      headers: taskHeaders,
      data: { expectedVersion: lead.version, assignedAgentId: other.id },
    },
  );
  expect(changed.status()).toBe(200);
  await page
    .getByRole("button", { name: "Retry same task", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Load latest lead for review", exact: true })
    .click();
  await expect(page.getByLabel("Title", { exact: true })).toHaveValue(title);
  await page.getByRole("button", { name: "Create task", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
  const response = await page.request.get(
    `/api/v1/staff/tasks?leadId=${lead.id}`,
  );
  expect((await response.json()).total).toBe(1);
});

test("dirty edits survive focus refresh and require review after a concurrent change", async ({
  page,
}) => {
  const { task, lead } = await createTask(page, "task-recovery");
  await page.goto(`/crm/tasks/${task.id}`);
  await page.getByRole("button", { name: "Edit task", exact: true }).click();
  const draft = `${task.title} my draft`;
  await page.getByLabel("Title", { exact: true }).fill(draft);
  const changed = await page.request.patch(`/api/v1/staff/tasks/${task.id}`, {
    headers: taskHeaders,
    data: {
      expectedVersion: task.version,
      expectedLeadVersion: lead.version,
      title: `${task.title} colleague`,
      notes: task.notes,
      dueAt: task.dueAt,
    },
  });
  expect(changed.status()).toBe(200);
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page.getByLabel("Title", { exact: true })).toHaveValue(draft);
  await page
    .getByRole("button", { name: "Load latest task for review", exact: true })
    .click();
  await expect(page.getByLabel("Title", { exact: true })).toHaveValue(draft);
  await page
    .getByRole("button", { name: "Keep my draft and continue", exact: true })
    .click();
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: draft, exact: true }),
  ).toBeVisible();
});

test("review merges a colleague's untouched notes and deadline into a title-only draft", async ({
  page,
}) => {
  const { task, lead } = await createTask(page, "task-recovery");
  await page.goto(`/crm/tasks/${task.id}`);
  await page.getByRole("button", { name: "Edit task", exact: true }).click();
  const title = `${task.title} my title`;
  await page.getByLabel("Title", { exact: true }).fill(title);
  const dueAt = new Date(Date.parse(task.dueAt) + 86_400_000).toISOString();
  const notes = "Colleague confirmed the new date. Keep this update.";
  const changed = await page.request.patch(`/api/v1/staff/tasks/${task.id}`, {
    headers: taskHeaders,
    data: {
      expectedVersion: task.version,
      expectedLeadVersion: lead.version,
      title: task.title,
      notes,
      dueAt,
    },
  });
  expect(changed.status()).toBe(200);
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await page
    .getByRole("button", { name: "Load latest task for review", exact: true })
    .click();
  await expect(page.getByLabel("Title", { exact: true })).toHaveValue(title);
  await expect(page.getByLabel("Notes", { exact: true })).toHaveValue(notes);
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
  const response = await page.request.get(`/api/v1/staff/tasks/${task.id}`);
  expect((await response.json()).task).toMatchObject({ title, notes, dueAt });
});

test("unknown edit outcome is read back before another write", async ({
  page,
}) => {
  const { task } = await createTask(page, "task-recovery");
  await page.goto(`/crm/tasks/${task.id}`);
  await page.getByRole("button", { name: "Edit task", exact: true }).click();
  const title = `${task.title} confirmed`;
  await page.getByLabel("Title", { exact: true }).fill(title);
  await loseSave(page, "Save changes", true);
  await page
    .getByRole("button", { name: "Load latest task for review", exact: true })
    .click();
  const response = await page.request.get(`/api/v1/staff/tasks/${task.id}`);
  const current = (await response.json()).task;
  expect(current.title).toBe(title);
  expect(current.version).toBe(2);
  await expect(page.getByLabel("Title", { exact: true })).toHaveValue(title);
});

test("ownership loss during an edit clears private task content", async ({
  page,
}) => {
  const other = await signInTask(page, "other-agent", "task-recovery");
  const { lead, task } = await createTask(page, "task-recovery");
  await signInTask(page, "agent", "task-recovery");
  await page.goto(`/crm/tasks/${task.id}`);
  await page.getByRole("button", { name: "Edit task", exact: true }).click();
  const manager = await page
    .context()
    .browser()!
    .newContext({ baseURL: "http://localhost:3100" });
  const managerPage = await manager.newPage();
  try {
    await signInTask(managerPage, "manager", "task-recovery");
    const response = await managerPage.request.patch(
      `/api/v1/staff/leads/${lead.id}/assignment`,
      {
        headers: taskHeaders,
        data: { expectedVersion: lead.version, assignedAgentId: other.id },
      },
    );
    expect(response.status()).toBe(200);
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await expect(page.getByLabel("Title", { exact: true })).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: task.title, exact: true }),
    ).toHaveCount(0);
  } finally {
    await manager.close();
  }
});

test("task lists refresh while visible and offer recovery from a failed read", async ({
  page,
}) => {
  await signInTask(page, "manager", "task-recovery");
  await page.clock.install();
  await page.goto("/crm/tasks");
  await expect(
    page.getByRole("heading", { name: "Tasks", exact: true }),
  ).toBeVisible();
  const read = page.waitForRequest(
    (request) =>
      request.method() === "GET" &&
      request.url().includes("/api/v1/staff/tasks?"),
  );
  await page.clock.fastForward(60_001);
  await read;
  await expect(page.getByRole("button", { name: /refresh/i })).toBeEnabled();
});

test("missing task and expired sessions have safe navigation", async ({
  page,
}) => {
  const { task } = await createTask(page, "task-recovery");
  await page.goto("/crm/tasks/00000000-0000-4000-8000-000000000000");
  await expect(
    page.getByRole("link", { name: /back to tasks/i }),
  ).toBeVisible();
  await page.context().clearCookies();
  await page.goto(`/crm/tasks/${task.id}`);
  await expect(page).toHaveURL(/\/login/);
});
