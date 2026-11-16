import { expect, test } from "@playwright/test";

test.setTimeout(90_000);

for (const role of ["manager", "agent"]) {
  test(`${role} sees not-found for malformed CRM property and task URLs`, async ({
    page,
  }, info) => {
    const origin = String(info.project.use.baseURL);
    const response = await page.request.post("/api/v1/auth/sign-in/email", {
      headers: { Origin: origin },
      data: {
        email: `e2e-property-${info.project.name}-${role}@example.com`,
        password: process.env.STAFF_E2E_PASSWORD,
        rememberMe: true,
      },
    });
    expect(response.status()).toBe(200);

    for (const path of [
      "/crm/properties/not-a-uuid",
      "/crm/properties/not-a-uuid/edit",
      "/crm/tasks/not-a-uuid",
    ]) {
      await page.goto(path);
      await expect(page).toHaveURL(`${origin}${path}`);
      await expect(
        page.getByRole("heading", {
          name: "This page couldn’t be found",
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", {
          name: "Properties are unavailable",
          exact: true,
        }),
      ).toHaveCount(0);
      await expect(
        page.getByRole("button", { name: "Try again", exact: true }),
      ).toHaveCount(0);
      await expect(
        page.getByRole("button", { name: "Retry tasks", exact: true }),
      ).toHaveCount(0);
    }
  });
}
