import { expect, test, type Locator } from "@playwright/test";

async function descriptions(control: Locator) {
  return control.evaluate((element) =>
    (element.getAttribute("aria-describedby") || "")
      .split(/\s+/)
      .filter(Boolean)
      .map((id) => document.getElementById(id)?.textContent || "MISSING:" + id),
  );
}

test("public search keeps budget validation and descriptions after field reuse", async ({
  page,
}) => {
  await page.goto("/");
  const form = page.getByRole("form", { name: "Find a property" });
  const minimum = form.getByLabel("Min. price (AED)", { exact: true });
  const maximum = form.getByLabel("Max. price (AED)", { exact: true });
  await minimum.fill("1000");
  await maximum.fill("500");
  await form
    .getByRole("button", { name: "Search properties", exact: true })
    .click();
  await expect(maximum).toHaveAttribute("aria-invalid", "true");
  await expect
    .poll(() => descriptions(maximum))
    .toContain("Maximum price must be at least the minimum price.");
  expect(
    (await descriptions(maximum)).some((text) => text.startsWith("MISSING:")),
  ).toBe(false);
  await maximum.fill("2000");
  await form
    .getByRole("button", { name: "Search properties", exact: true })
    .click();
  await expect(page).toHaveURL(/\/properties\?/);
  const query = new URL(page.url()).searchParams;
  expect(query.get("minPriceFils")).toBe("100000");
  expect(query.get("maxPriceFils")).toBe("200000");
  await expect(
    page.getByRole("heading", { name: "Homes to make your own." }),
  ).toBeVisible();
});

test("public inquiry keeps contact hints and error anchors without invalid writes", async ({
  page,
}) => {
  const response = await page.request.get(
    "/api/v1/properties?purpose=sale&pageSize=1",
  );
  expect(response.ok()).toBe(true);
  const { items } = await response.json();
  await page.goto(`/properties/${items[0].id}`);
  let writes = 0;
  page.on("request", (request) => {
    if (request.method() === "POST") writes++;
  });
  const name = page.getByLabel("Name", { exact: true });
  const phone = page.getByLabel("Phone", { exact: true });
  await name.fill("Public wrapper validation");
  await page.getByRole("button", { name: "Send inquiry", exact: true }).click();
  await expect(phone).toHaveAttribute("aria-invalid", "true");
  const described = await descriptions(phone);
  expect(
    described.some((text) =>
      text.includes("Provide a phone number or email address."),
    ),
  ).toBe(true);
  expect(described.some((text) => text.startsWith("MISSING:"))).toBe(false);
  await expect(page.locator('a[href="#inquiry-phone"]')).toBeVisible();
  expect(writes).toBe(0);
});
