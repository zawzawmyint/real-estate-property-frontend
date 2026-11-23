import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";

const captureFile = process.env.STAFF_E2E_EMAIL_CAPTURE_FILE;
test.skip(
  !captureFile,
  "Requires the opt-in captured-SMTP email browser fixture.",
);
async function captured(to: string) {
  const text = await readFile(captureFile!, "utf8");
  return text
    .split("\n")
    .filter(Boolean)
    .map(
      (line) => JSON.parse(line) as { to: string; text: string; html: string },
    )
    .filter((message) => message.to === to);
}
test.beforeEach(async ({ page }) => {
  const token = randomUUID().replaceAll("-", "");
  await page.setExtraHTTPHeaders({
    "x-e2e-client-ip": `2001:db8::${token.slice(0, 4)}:${token.slice(4, 8)}`,
  });
});
test("property enquiry response recovery creates one captured acknowledgement", async ({
  page,
}) => {
  const response = await page.request.get("/api/v1/properties?pageSize=1");
  expect(response.ok()).toBe(true);
  const { items } = (await response.json()) as { items: { id: string }[] };
  const id = items[0]!.id;
  const email = `property-${randomUUID()}@example.test`;
  await page.goto(`/properties/${id}`);
  const form = page.getByRole("complementary", {
    name: "Enquire about this property",
  });
  await form.getByLabel("Name", { exact: true }).fill("Email fixture visitor");
  await form.getByLabel("Email", { exact: true }).fill(email);
  let dropped = false;
  await page.route(`**/properties/${id}`, async (route) => {
    if (
      !dropped &&
      route.request().method() === "POST" &&
      route.request().headers()["next-action"]
    ) {
      dropped = true;
      await route.fetch();
      await route.abort("failed");
    } else await route.continue();
  });
  await form.getByRole("button", { name: "Send inquiry", exact: true }).click();
  await form
    .getByRole("button", { name: "Retry same inquiry", exact: true })
    .click();
  await expect(
    form.getByText("Your inquiry has been received.", { exact: true }),
  ).toBeVisible();
  await expect.poll(async () => (await captured(email)).length).toBe(1);
  expect((await captured(email))[0]!.text).toContain(`/properties/${id}`);
  expect((await captured(email))[0]!.text).not.toContain("/crm");
});
test("general website enquiry receives a general acknowledgement without a property link", async ({
  page,
}) => {
  const email = `general-${randomUUID()}@example.test`;
  await page.goto("/agents");
  await page
    .getByLabel("Full name", { exact: true })
    .fill("General email visitor");
  await page.getByRole("radio", { name: "Rent", exact: true }).check();
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page
    .getByLabel("Message", { exact: true })
    .fill("Private preferences must not be echoed");
  await page.getByRole("button", { name: "Send enquiry", exact: true }).click();
  await expect(
    page.getByText("Your enquiry has been received.", { exact: true }),
  ).toBeVisible();
  await expect.poll(async () => (await captured(email)).length).toBe(1);
  const message = (await captured(email))[0]!;
  expect(message.text).not.toContain("Private preferences");
  expect(message.text).not.toContain("/properties/");
});
