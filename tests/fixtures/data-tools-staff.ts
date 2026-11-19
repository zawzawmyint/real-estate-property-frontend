import { expect, test, type Cookie, type Page } from "@playwright/test";

type StaffRole = "admin" | "manager" | "agent";
type Namespace =
  | "csv-export"
  | "lead-import"
  | "property-import"
  | "lead-temperature"
  | "agent-performance";
type Identity = { id: string; name: string; role: StaffRole };
const sessions = new Map<string, { cookies: Cookie[]; identity: Identity }>();

/** Real signed sessions, isolated per data workflow and checked before reuse. */
export async function signInDataToolsStaff(
  page: Page,
  namespace: Namespace,
  role: StaffRole,
  accountLabel: string = role,
) {
  const project = test.info().project.name;
  const key = `${namespace}-${project}-${accountLabel}`;
  const origin = test.info().project.use.baseURL ?? "http://localhost:3100";
  await page.context().clearCookies();
  const saved = sessions.get(key);
  if (saved) {
    await page.context().addCookies(saved.cookies);
    const response = await page.request.get("/api/v1/auth/get-session");
    expect(response.status(), await response.text()).toBe(200);
    const current = (await response.json())?.user as Identity | undefined;
    if (current) {
      expect(current.id).toBe(saved.identity.id);
      expect(current.role).toBe(role);
      return current;
    }
    sessions.delete(key);
    await page.context().clearCookies();
  }
  const response = await page.request.post("/api/v1/auth/sign-in/email", {
    headers: { Origin: origin },
    data: {
      email: `e2e-${key}@example.com`,
      password: process.env.STAFF_E2E_PASSWORD,
      rememberMe: true,
    },
  });
  expect(response.status(), await response.text()).toBe(200);
  const session = await page.request.get("/api/v1/auth/get-session");
  expect(session.status(), await session.text()).toBe(200);
  const identity = (await session.json()).user as Identity;
  expect(identity.id).toBeTruthy();
  expect(identity.role).toBe(role);
  sessions.set(key, { cookies: await page.context().cookies(), identity });
  return identity;
}
