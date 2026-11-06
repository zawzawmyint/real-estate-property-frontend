import { expect, test, type Page } from "@playwright/test";

test.skip(
  process.env.STAFF_E2E_PUBLIC_CHAT !== "1",
  "Requires the opt-in public chat backend fixture.",
);

async function firstReplySnapshot(page: Page, list: string) {
  return page.evaluateHandle(
    (label) => ({
      first: new Promise<{ displayed: string; full: string; link: string }>(
        (resolve) => {
          const observer = new MutationObserver(() => {
            const results = document.querySelector(`ul[aria-label="${label}"]`);
            if (!results) return;

            const text = results.previousElementSibling;
            const reveal = text?.querySelector('[aria-hidden="true"]');
            resolve({
              displayed:
                reveal?.textContent?.trim() ?? text?.textContent?.trim() ?? "",
              full:
                text?.firstElementChild?.textContent ?? text?.textContent ?? "",
              link: results.querySelector("a")?.getAttribute("href") ?? "",
            });
            observer.disconnect();
          });
          observer.observe(document.body, { childList: true, subtree: true });
        },
      ),
    }),
    list,
  );
}

test("answers an FAQ once and restores focus after Escape", async ({
  page,
}, testInfo) => {
  await page.setExtraHTTPHeaders({
    "x-e2e-client-ip":
      testInfo.project.name === "mobile" ? "192.0.2.171" : "192.0.2.170",
  });
  if (testInfo.project.name === "mobile")
    await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/contact");
  const launcher = page.getByRole("button", { name: "Ask about properties" });
  await expect(launcher).toBeEnabled();
  await expect(launcher).toHaveText("");
  const initial = await launcher.boundingBox();
  if (!initial) throw new Error("Chat launcher has no bounding box");
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(0);
  await expect.poll(() => launcher.boundingBox()).toEqual(initial);
  const { width, height } = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    height: document.documentElement.clientHeight,
  }));
  expect(initial.width).toBeLessThan(width - 48);
  expect(width - initial.x - initial.width).toBeLessThanOrEqual(26);
  expect(height - initial.y - initial.height).toBeLessThanOrEqual(26);
  await launcher.focus();
  await expect(page.getByRole("tooltip")).toHaveText("Ask about properties");
  await launcher.press("Enter");
  const panel = page.getByRole("dialog", { name: "Property assistant" });
  const openingHeight = await panel.evaluate(
    (element) => (element as HTMLElement).offsetHeight,
  );
  const expectedHeight = await panel.evaluate((element) => {
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const maxHeight = parseFloat(getComputedStyle(element).maxHeight);
    return Math.round(Math.min(38 * rem, maxHeight));
  });
  expect(openingHeight).toBe(expectedHeight);
  await expect(panel.getByRole("button", { name: "Close" })).toHaveCSS(
    "color",
    "rgb(255, 255, 255)",
  );
  await expect(
    panel.getByRole("heading", { name: "Property assistant" }),
  ).toBeFocused();
  const question = panel.getByRole("textbox", { name: "Your question" });
  await question.fill("How do I arrange a viewing?");
  const snapshot = await firstReplySnapshot(page, "Sources");

  let actionRequests = 0;
  page.on("request", (request) => {
    if (request.headers()["next-action"]) actionRequests++;
  });
  await question.evaluate((element) => {
    const form = (element as HTMLInputElement).form!;
    form.requestSubmit();
    form.requestSubmit();
  });

  const first = await snapshot.evaluate((result) => result.first);
  await snapshot.dispose();
  expect(first.displayed).toBe("Open");
  expect(first.full).toContain("An agent can confirm available times.");
  expect(first.link).toBe("/contact");

  await expect(
    panel.getByText(/An agent can confirm available times/),
  ).toHaveCSS("opacity", "1");
  await expect(
    panel.getByRole("link", { name: /source.*Contact Avenor Properties/i }),
  ).toHaveAttribute("href", "/contact");
  await expect(question).toHaveValue("");
  expect(
    await panel.evaluate((element) => (element as HTMLElement).offsetHeight),
  ).toBe(openingHeight);
  expect(actionRequests).toBe(1);
  await question.fill("Do you have weekend viewings?");
  const docked = await panel.boundingBox();
  if (!docked) throw new Error("Chat panel has no bounding box");
  const expand = panel.getByRole("button", { name: "Expand chat" });
  await expect(expand).toHaveText("");
  await expand.focus();
  await expect(page.getByRole("tooltip")).toHaveText("Expand chat");
  await expand.press("Enter");
  const collapse = panel.getByRole("button", { name: "Collapse chat" });
  await expect(collapse).toBeFocused();
  await expect
    .poll(async () => {
      const box = await panel.boundingBox();
      return box && Math.abs(box.x + box.width / 2 - width / 2);
    })
    .toBeLessThan(2);
  const expanded = await panel.boundingBox();
  if (!expanded) throw new Error("Expanded chat has no bounding box");
  expect(Math.abs(expanded.y + expanded.height / 2 - height / 2)).toBeLessThan(
    2,
  );
  if (testInfo.project.name === "mobile") {
    expect(expanded.width).toBeGreaterThan(width - 24);
    expect(expanded.height).toBeGreaterThan(height - 24);
  } else {
    expect(expanded.width).toBeGreaterThan(docked.width);
  }
  await expect(question).toHaveValue("Do you have weekend viewings?");
  await expect(
    panel.getByText(/An agent can confirm available times/),
  ).toBeVisible();
  const send = panel.getByRole("button", { name: "Send" });
  await expect(send).toHaveText("");
  await send.focus();
  await expect(page.getByRole("tooltip")).toHaveText("Send");
  await collapse.press("Enter");
  await expect(expand).toBeFocused();
  await expect.poll(() => panel.boundingBox()).toEqual(docked);
  await expect(question).toHaveValue("Do you have weekend viewings?");
  expect(actionRequests).toBe(1);
  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
  await expect(launcher).toBeFocused();
  await launcher.click();
  const close = panel.getByRole("button", { name: "Close" });
  await expect(close).toHaveText("");
  await close.focus();
  await expect(page.getByRole("tooltip")).toHaveText("Close");
  await close.click();
  await expect(panel).toBeHidden();
  await expect(launcher).toBeFocused();
});

test("shows annual pricing and hands off to the existing property inquiry at 320px", async ({
  page,
}, testInfo) => {
  await page.setExtraHTTPHeaders({
    "x-e2e-client-ip":
      testInfo.project.name === "mobile" ? "192.0.2.173" : "192.0.2.172",
  });
  if (testInfo.project.name === "mobile")
    await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/contact");
  await page.getByRole("button", { name: "Ask about properties" }).click();
  const panel = page.getByRole("dialog", { name: "Property assistant" });
  await panel
    .getByRole("textbox")
    .fill(
      "Find me a 2-bedroom rental in Dubai Marina under AED 120,000 a year.",
    );
  const snapshot = await firstReplySnapshot(page, "Matching properties");
  await panel.getByRole("button", { name: "Send" }).click();

  const first = await snapshot.evaluate((result) => result.first);
  await snapshot.dispose();
  expect(first.displayed).toBe("Here");
  expect(first.link).toMatch(/^\/properties\/[a-f0-9-]+$/);

  const listing = panel.getByRole("list", { name: "Matching properties" });
  await expect(listing.getByText("Marina View Apartment")).toBeVisible();
  await expect(listing.getByText("2 beds · AED 115,000/year")).toBeVisible();
  expect(
    await panel.evaluate((element) => element.scrollWidth),
  ).toBeLessThanOrEqual(await panel.evaluate((element) => element.clientWidth));
  await listing.getByRole("link", { name: "Request a viewing" }).click();
  await expect(page).toHaveURL(/\/properties\/[a-f0-9-]+#inquiry-heading$/);
  await expect(
    page.getByRole("heading", { name: "Enquire about this property" }),
  ).toBeVisible();
  await expect(panel).toBeHidden();
});

test("keeps the draft and gives alternate routes when chat is unavailable", async ({
  page,
}, testInfo) => {
  await page.setExtraHTTPHeaders({
    "x-e2e-client-ip":
      testInfo.project.name === "mobile" ? "192.0.2.175" : "192.0.2.174",
  });
  await page.goto("/contact");
  await page.getByRole("button", { name: "Ask about properties" }).click();
  const panel = page.getByRole("dialog", { name: "Property assistant" });
  const question = panel.getByRole("textbox");
  await question.fill("Chat fixture outage");
  await panel.getByRole("button", { name: "Send" }).click();

  const alert = panel.getByRole("alert");
  await expect(alert).toContainText(
    "The property assistant is temporarily unavailable.",
  );
  await expect(question).toHaveValue("Chat fixture outage");
  await expect(
    alert.getByRole("link", { name: "Browse listings" }),
  ).toHaveAttribute("href", "/properties");
  await expect(
    alert.getByRole("link", { name: "Contact Avenor" }),
  ).toHaveAttribute("href", "/contact");
});

test("shows the complete reply immediately with reduced motion", async ({
  page,
}, testInfo) => {
  await page.setExtraHTTPHeaders({
    "x-e2e-client-ip":
      testInfo.project.name === "mobile" ? "192.0.2.177" : "192.0.2.176",
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/contact");
  await page.getByRole("button", { name: "Ask about properties" }).click();
  const panel = page.getByRole("dialog", { name: "Property assistant" });
  await panel.getByRole("textbox").fill("How do I arrange a viewing?");
  const snapshot = await firstReplySnapshot(page, "Sources");
  await panel.getByRole("button", { name: "Send" }).click();

  const first = await snapshot.evaluate((result) => result.first);
  await snapshot.dispose();
  expect(first.displayed).toContain("An agent can confirm available times.");
  expect(first.link).toBe("/contact");
});
