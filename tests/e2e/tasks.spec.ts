import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import {
  createTask,
  fillTask,
  fixtureTaskLead,
  signInTask,
  taskHeaders,
  taskLead,
} from "../fixtures/task-helpers";

test.setTimeout(90_000);
test.describe.configure({ mode: "default" });
test.use({ timezoneId: "America/New_York" });

test("lead follow-up creation persists Dubai time without changing the pipeline", async ({
  page,
}) => {
  const lead = await taskLead(page);
  await page.goto(`/crm/leads/${lead.id}`);
  await page.getByRole("link", { name: "Add follow-up", exact: true }).click();
  await expect(page).toHaveURL(
    new RegExp(`/crm/tasks/new\\?leadId=${lead.id}`),
  );
  const title = `Discuss offer ${randomUUID().slice(0, 8)}`;
  const day = new Date(Date.now() + 86_400_000 + 4 * 3_600_000)
    .toISOString()
    .slice(0, 10);
  await page.getByLabel("Title", { exact: true }).fill(title);
  await page
    .getByLabel("Notes", { exact: true })
    .fill("Ask about the proposed move-in date.");
  await page.getByLabel("Due date", { exact: true }).fill(day);
  await page.getByLabel("Due time", { exact: true }).fill("11:30");
  await page.getByRole("button", { name: "Create task", exact: true }).click();
  await expect(page).toHaveURL(/\/crm\/tasks\/[\w-]+$/);
  await expect(
    page.getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
  const id = new URL(page.url()).pathname.split("/").at(-1);
  const response = await page.request.get(`/api/v1/staff/tasks/${id}`);
  expect((await response.json()).task.dueAt).toBe(`${day}T07:30:00.000Z`);
  const currentLead = await page.request.get(`/api/v1/staff/leads/${lead.id}`);
  expect((await currentLead.json()).stage).toBe(lead.stage);
  await page.reload();
  await expect(
    page.getByText("Ask about the proposed move-in date.", { exact: true }),
  ).toBeVisible();
});

test("open task editing and early completion persist terminal read-only state", async ({
  page,
}) => {
  const { task } = await createTask(page);
  await page.goto(`/crm/tasks/${task.id}`);
  await page.getByRole("button", { name: "Edit task", exact: true }).click();
  const title = `${task.title} revised`;
  await page.getByLabel("Title", { exact: true }).fill(title);
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Mark complete", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Edit task", exact: true }),
  ).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByText("Completed", { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByText("Overdue", { exact: true })).toHaveCount(0);
  const response = await page.request.get(`/api/v1/staff/tasks/${task.id}`);
  const saved = (await response.json()).task;
  expect(saved.status).toBe("completed");
  expect(saved.completedAt).toBeTruthy();
  expect(saved.title).toBe(title);
});

test("cancelling requires confirmation and retains the cancelled task", async ({
  page,
}) => {
  const { task } = await createTask(page);
  await page.goto(`/crm/tasks/${task.id}`);
  await page.getByRole("button", { name: "Cancel task", exact: true }).click();
  await page
    .getByRole("button", { name: "Confirm cancellation", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Mark complete", exact: true }),
  ).toHaveCount(0);
  await page.reload();
  const response = await page.request.get(`/api/v1/staff/tasks/${task.id}`);
  expect((await response.json()).task.status).toBe("cancelled");
});

test("current lead assignment transfers task access to the new Agent", async ({
  page,
}) => {
  const other = await signInTask(page, "other-agent");
  const { lead, task } = await createTask(page);
  await signInTask(page, "agent");
  await page.goto(`/crm/tasks/${task.id}`);
  await expect(
    page.getByRole("heading", { name: task.title, exact: true }),
  ).toBeVisible();
  await signInTask(page);
  const changed = await page.request.patch(
    `/api/v1/staff/leads/${lead.id}/assignment`,
    {
      headers: taskHeaders,
      data: { expectedVersion: lead.version, assignedAgentId: other.id },
    },
  );
  expect(changed.status()).toBe(200);
  await signInTask(page, "agent");
  expect(
    (await page.request.get(`/api/v1/staff/tasks/${task.id}`)).status(),
  ).toBe(404);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: task.title, exact: true }),
  ).toHaveCount(0);
  await signInTask(page, "other-agent");
  await page.goto(`/crm/tasks/${task.id}`);
  await expect(
    page.getByRole("heading", { name: task.title, exact: true }),
  ).toBeVisible();
});

test("tasks remain resolvable after lead closure without allowing editing", async ({
  page,
}) => {
  const { lead, task } = await createTask(page);
  const stage = await page.request.patch(
    `/api/v1/staff/leads/${lead.id}/stage`,
    {
      headers: taskHeaders,
      data: { expectedVersion: lead.version, stage: "lost" },
    },
  );
  expect(stage.status(), await stage.text()).toBe(200);
  await page.goto(`/crm/tasks/${task.id}`);
  await expect(
    page.getByRole("button", { name: "Edit task", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Mark complete", exact: true })
    .click();
  const response = await page.request.get(`/api/v1/staff/tasks/${task.id}`);
  await expect
    .poll(
      async () =>
        (
          await (
            await page.request.get(`/api/v1/staff/tasks/${task.id}`)
          ).json()
        ).task.status,
    )
    .toBe("completed");
  expect(response.status()).toBe(200);
});

test("overdue lead tasks paginate without changing viewing filters", async ({
  page,
}) => {
  const { lead, data } = await fixtureTaskLead(page);
  expect(data.total).toBe(23);
  await page.goto(
    `/crm/leads/${lead.id}?date=2026-10-29&status=scheduled&taskDue=overdue`,
  );
  const section = page.getByRole("region", { name: "Tasks", exact: true });
  await expect(
    section
      .locator("span:visible")
      .filter({ hasText: /^Overdue$/ })
      .first(),
  ).toBeVisible();
  await section.getByRole("link", { name: /next/i }).click();
  await expect(page).toHaveURL(/taskPage=2/);
  expect(new URL(page.url()).searchParams.get("date")).toBe("2026-10-29");
  expect(new URL(page.url()).searchParams.get("status")).toBe("scheduled");
  await expect(
    section.getByRole("link", { name: /Follow-up overdue.*23/ }).first(),
  ).toBeVisible();
});

test("text-only overdue edits preserve the exact stored instant", async ({
  page,
}) => {
  const { data } = await fixtureTaskLead(page, "exact timestamp");
  const task = data.items[0];
  await page.goto(`/crm/tasks/${task.id}`);
  await page.getByRole("button", { name: "Edit task", exact: true }).click();
  await page
    .getByLabel("Title", { exact: true })
    .fill(`${task.title} corrected`);
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: `${task.title} corrected`, exact: true }),
  ).toBeVisible();
  const result = await page.request.get(`/api/v1/staff/tasks/${task.id}`);
  expect((await result.json()).task.dueAt).toBe(task.dueAt);
});

test("invalid direct query combinations offer a reset instead of a misleading list", async ({
  page,
}) => {
  await signInTask(page);
  await page.goto("/crm/tasks?status=completed&due=overdue");
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "These task filters are invalid" }),
  ).toBeVisible();
  await page.getByRole("link", { name: /reset/i }).click();
  await expect(
    page.getByRole("heading", { name: "Tasks", exact: true }),
  ).toBeVisible();
});

test("new task validates required fields and global creation has a lead picker", async ({
  page,
}) => {
  const lead = await taskLead(page);
  await page.goto("/crm/tasks/new");
  await page.getByLabel("Search leads", { exact: true }).fill(lead.name);
  await page.getByRole("radio", { name: new RegExp(lead.name) }).check();
  await page.getByRole("button", { name: "Create task", exact: true }).click();
  await expect(page.getByLabel("Title", { exact: true })).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  const { title } = await fillTask(page, lead.id);
  await page.getByRole("button", { name: "Create task", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
});

test("task screens fit mobile, tablet and desktop with readable long content", async ({
  page,
}) => {
  const { task, lead } = await createTask(page);
  task.title = "Discuss the property offer and confirm the buyer's next steps. "
    .repeat(3)
    .slice(0, 160);
  const changed = await page.request.patch(`/api/v1/staff/tasks/${task.id}`, {
    headers: taskHeaders,
    data: {
      expectedVersion: task.version,
      expectedLeadVersion: lead.version,
      title: task.title,
      notes: "Detailed context for the next conversation. ".repeat(45),
      dueAt: task.dueAt,
    },
  });
  expect(changed.status()).toBe(200);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/crm/tasks/${task.id}`);
    await expect(
      page.getByRole("button", { name: "Edit task", exact: true }),
    ).toBeEnabled();
    await expect(
      page.getByRole("heading", { name: task.title, exact: true }),
    ).toBeVisible();
    if (test.info().project.name === "desktop" && [390, 1440].includes(width))
      await page.screenshot({
        path: test.info().outputPath(`task-detail-${width}.png`),
        fullPage: true,
      });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.goto("/crm/tasks");
    await expect(
      page.getByRole("button", { name: "Refresh tasks", exact: true }),
    ).toBeEnabled();
    await expect(
      page.getByRole("heading", { name: "Tasks", exact: true }),
    ).toBeVisible();
    if (test.info().project.name === "desktop" && [390, 1440].includes(width))
      await page.screenshot({
        path: test.info().outputPath(`task-list-${width}.png`),
        fullPage: true,
      });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.goto(`/crm/tasks/new?leadId=${lead.id}`);
    await expect(page.getByLabel("Title", { exact: true })).toBeEnabled();
    if (test.info().project.name === "desktop" && [390, 1440].includes(width))
      await page.screenshot({
        path: test.info().outputPath(`task-form-${width}.png`),
        fullPage: true,
      });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});
