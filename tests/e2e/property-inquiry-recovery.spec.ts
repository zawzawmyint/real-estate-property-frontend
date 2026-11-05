import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import { signInTask } from "../fixtures/task-helpers";

const control = "http://127.0.0.1:4312/_e2e/rules";

async function uncertainInquiry(page: Page) {
  const token = randomUUID().replaceAll("-", "");
  await page.setExtraHTTPHeaders({
    "x-e2e-client-ip": `2001:db8::${token.slice(0, 4)}:${token.slice(4, 8)}`,
  });
  const response = await page.request.get("/api/v1/properties?pageSize=1");
  expect(response.ok()).toBe(true);
  const { items } = (await response.json()) as { items: { id: string }[] };
  const propertyId = items[0]!.id;
  await page.goto(`/properties/${propertyId}`);
  const inquiry = page.getByRole("complementary", {
    name: "Enquire about this property",
  });
  const name = `Recovery ${randomUUID().replace(/\d/g, "a")}`;
  await inquiry.getByLabel("Name", { exact: true }).fill(name);
  await inquiry.getByLabel("Phone", { exact: true }).fill("+971 50 123 4567");
  await inquiry
    .getByLabel("Email", { exact: true })
    .fill("fictional-recovery@example.com");
  await inquiry
    .getByLabel("Message (optional)", { exact: true })
    .fill("Fictional inquiry recovery coverage.");
  const payloads: string[] = [];
  let dropped = false;
  await page.route(`**/properties/${propertyId}`, async (route) => {
    const request = route.request();
    if (request.method() !== "POST" || !request.headers()["next-action"]) {
      await route.continue();
      return;
    }
    payloads.push(request.postData()!);
    if (!dropped) {
      dropped = true;
      const saved = await route.fetch();
      expect(saved.ok()).toBe(true);
      await route.abort("failed");
    } else await route.continue();
  });
  await inquiry
    .getByRole("button", { name: "Send inquiry", exact: true })
    .click();
  const retry = inquiry.getByRole("button", {
    name: "Retry same inquiry",
    exact: true,
  });
  await expect(retry).toBeEnabled();
  await expect(inquiry.getByLabel("Name", { exact: true })).toBeDisabled();
  return { inquiry, retry, name, propertyId, payloads };
}

async function leadCount(page: Page, name: string) {
  await signInTask(page, "manager", "task-recovery");
  const response = await page.request.get(
    `/api/v1/staff/leads?view=all&q=${encodeURIComponent(name)}`,
  );
  expect(response.ok()).toBe(true);
  return ((await response.json()) as { total: number }).total;
}

test("uncertain property inquiry retries the exact receipt after a later definite failure", async ({
  page,
}) => {
  const { inquiry, retry, name, propertyId, payloads } =
    await uncertainInquiry(page);
  const response = await page.request.post(control, {
    data: {
      method: "POST",
      path: `/api/v1/public/properties/${propertyId}/inquiries`,
      name,
      status: 429,
    },
  });
  expect(response.status()).toBe(201);
  const { id } = (await response.json()) as { id: string };
  try {
    await retry.click();
    await expect(
      inquiry.getByRole("button", { name: "Sending inquiry…", exact: true }),
    ).toBeDisabled();
    await inquiry.locator("form").evaluate((form: HTMLFormElement) => {
      form.requestSubmit();
      form.requestSubmit();
    });
    expect(payloads).toHaveLength(2);
    await expect
      .poll(async () => {
        const held = await page.request.get(`${control}/${id}`);
        return ((await held.json()) as { hits: number }).hits;
      })
      .toBe(1);
    await page.request.post(`${control}/${id}/release`);
    await expect(inquiry.getByRole("alert")).toContainText(
      "Too many inquiries.",
    );
    await expect(retry).toBeEnabled();
    expect(payloads).toHaveLength(2);
    expect(payloads[1]).toBe(payloads[0]);
    await page.request.delete(`${control}/${id}`);
    await page.clock.install();
    await page.clock.fastForward(901_000);
    await retry.click();
    await expect(inquiry.getByRole("status")).toContainText(
      "Your inquiry has been received.",
    );
    expect(payloads).toHaveLength(3);
    expect(payloads[2]).toBe(payloads[0]);
    expect(await leadCount(page, name)).toBe(1);
  } finally {
    await page.request.delete(`${control}/${id}`);
  }
});

for (const cooldown of [false, true]) {
  test(`uncertain property inquiry edit confirmation preserves values${cooldown ? " and cooldown" : " and creates a distinct receipt"}`, async ({
    page,
  }) => {
    const { inquiry, retry, name, propertyId, payloads } =
      await uncertainInquiry(page);
    let ruleId: string | undefined;
    try {
      if (cooldown) {
        const response = await page.request.post(control, {
          data: {
            method: "POST",
            path: `/api/v1/public/properties/${propertyId}/inquiries`,
            name,
            status: 429,
          },
        });
        expect(response.status()).toBe(201);
        ruleId = ((await response.json()) as { id: string }).id;
        await page.request.post(`${control}/${ruleId}/release`);
        await retry.click();
        await expect(inquiry.getByRole("alert")).toContainText(
          "Too many inquiries.",
        );
      }
      const before = payloads.length;
      const edit = inquiry.getByRole("button", {
        name: "Edit as a new inquiry",
        exact: true,
      });
      await edit.click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toContainText("may already be saved");
      await dialog
        .getByRole("button", { name: "Keep original inquiry", exact: true })
        .click();
      await expect(inquiry.getByLabel("Name", { exact: true })).toBeDisabled();
      await expect(retry).toBeEnabled();
      expect(payloads).toHaveLength(before);
      await edit.click();
      await dialog
        .getByRole("button", { name: "Edit as new inquiry", exact: true })
        .click();
      await expect(inquiry.getByLabel("Name", { exact: true })).toBeFocused();
      for (const [label, value] of [
        ["Name", name],
        ["Phone", "+971 50 123 4567"],
        ["Email", "fictional-recovery@example.com"],
        ["Message (optional)", "Fictional inquiry recovery coverage."],
      ]) {
        await expect(inquiry.getByLabel(label!, { exact: true })).toBeEnabled();
        await expect(inquiry.getByLabel(label!, { exact: true })).toHaveValue(
          value!,
        );
      }
      expect(payloads).toHaveLength(before);
      const send = inquiry.getByRole("button", {
        name: "Send inquiry",
        exact: true,
      });
      if (cooldown) {
        await send.click();
        await expect(inquiry.getByRole("alert")).toContainText(
          "Please retry after",
        );
        expect(payloads).toHaveLength(before);
        await page.request.delete(`${control}/${ruleId}`);
        await page.clock.install();
        await page.clock.fastForward(901_000);
      }
      await inquiry
        .getByLabel("Message (optional)", { exact: true })
        .fill("A deliberate separate fictional inquiry.");
      await send.click();
      await expect(inquiry.getByRole("status")).toContainText(
        "Your inquiry has been received.",
      );
      expect(payloads).toHaveLength(before + 1);
      const original = JSON.parse(payloads[0]!) as [
        string,
        { submissionId: string },
      ];
      const edited = JSON.parse(payloads.at(-1)!) as [
        string,
        { submissionId: string },
      ];
      expect(edited[1].submissionId).not.toBe(original[1].submissionId);
      expect(await leadCount(page, name)).toBe(2);
    } finally {
      if (ruleId) await page.request.delete(`${control}/${ruleId}`);
    }
  });
}
