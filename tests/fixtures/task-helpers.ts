import { randomUUID } from "node:crypto";
import { expect, test, type Cookie, type Page } from "@playwright/test";

export const taskHeaders = { Origin: "http://localhost:3100" };
const sessions = new Map<
  string,
  { cookies: Cookie[]; user: { id: string; name: string } }
>();

export async function signInTask(
  page: Page,
  identity = "manager",
  suite = "task",
) {
  const key = `${suite}-${test.info().project.name}-${identity}`;
  await page.context().clearCookies();
  const cached = sessions.get(key);
  if (cached) {
    await page.context().addCookies(cached.cookies);
    return cached.user;
  }
  const response = await page.request.post("/api/v1/auth/sign-in/email", {
    headers: taskHeaders,
    data: {
      email: `e2e-${key}@example.com`,
      password: process.env.STAFF_E2E_PASSWORD,
      rememberMe: true,
    },
  });
  expect(response.status(), await response.text()).toBe(200);
  const session = await page.request.get("/api/v1/auth/get-session");
  const user = (await session.json()).user as { id: string; name: string };
  sessions.set(key, { user, cookies: await page.context().cookies() });
  return user;
}

export async function taskLead(page: Page, suite = "task") {
  const agent = await signInTask(page, "agent", suite);
  await signInTask(page, "manager", suite);
  const response = await page.request.post("/api/v1/staff/leads", {
    headers: taskHeaders,
    data: {
      submissionId: randomUUID(),
      name: `Task browser ${randomUUID().slice(0, 8)}`,
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
  };
}

export async function createTask(page: Page, suite = "task") {
  const lead = await taskLead(page, suite);
  const response = await page.request.post("/api/v1/staff/tasks", {
    headers: taskHeaders,
    data: {
      submissionId: randomUUID(),
      leadId: lead.id,
      expectedLeadVersion: lead.version,
      title: `Call buyer ${randomUUID().slice(0, 8)}`,
      notes: "Discuss the next steps after the property visit.",
      dueAt: new Date(Date.now() + 86_400_000).toISOString(),
    },
  });
  expect(response.status(), await response.text()).toBe(201);
  return {
    lead,
    task: (await response.json()).task as {
      id: string;
      title: string;
      notes: string | null;
      dueAt: string;
      version: number;
    },
  };
}

export async function fillTask(page: Page, leadId: string) {
  const title = `Call follow-up ${randomUUID().slice(0, 8)}`;
  const day = new Date(Date.now() + 86_400_000 + 4 * 3_600_000)
    .toISOString()
    .slice(0, 10);
  await page.goto(`/crm/tasks/new?leadId=${leadId}`);
  await page.getByLabel("Title", { exact: true }).fill(title);
  await page
    .getByLabel("Notes", { exact: true })
    .fill("Confirm their decision.");
  await page.getByLabel("Due date", { exact: true }).fill(day);
  await page.getByLabel("Due time", { exact: true }).fill("11:30");
  return { title, day };
}

export async function fixtureTaskLead(page: Page, scenario = "overdue") {
  await signInTask(page);
  const name = `Task ${scenario} ${test.info().project.name}`;
  const leads = await page.request.get(
    `/api/v1/staff/leads?view=all&q=${encodeURIComponent(name)}`,
  );
  expect(leads.status()).toBe(200);
  const lead = (await leads.json()).items.find(
    (item: { name: string }) => item.name === name,
  ) as { id: string; name: string; version: number };
  expect(lead).toBeTruthy();
  const tasks = await page.request.get(
    `/api/v1/staff/tasks?leadId=${lead.id}&pageSize=100`,
  );
  expect(tasks.status()).toBe(200);
  return { lead, data: await tasks.json() };
}
