import { expect, test, type Locator, type Page } from "@playwright/test";
import { signInTask } from "../fixtures/task-helpers";

async function expectSlidingFill(page: Page, action: Locator) {
  await expect(action).toBeEnabled();
  await page.mouse.move(0, 0);
  await action.scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      action.evaluate(
        (el) =>
          new DOMMatrixReadOnly(getComputedStyle(el, "::before").transform).m41,
      ),
    )
    .toBeLessThan(-20);
  await action.hover();
  const samples = await action.evaluate(async (el) => {
    const positions: number[] = [];
    const start = performance.now();
    while (performance.now() - start < 430) {
      positions.push(
        new DOMMatrixReadOnly(getComputedStyle(el, "::before").transform).m41,
      );
      await new Promise(requestAnimationFrame);
    }
    return { positions, width: el.getBoundingClientRect().width };
  });
  expect(
    samples.positions.some((x) => x < -1 && x > -samples.width * 0.95),
  ).toBe(true);
  await expect
    .poll(() =>
      action.evaluate(
        (el) =>
          new DOMMatrixReadOnly(getComputedStyle(el, "::before").transform).m41,
      ),
    )
    .toBe(0);
  await expect(action).toHaveCSS("color", "rgb(255, 255, 255)");
}

test("public primary, secondary, inverse and gallery actions retain their visual states", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  await page.goto("/properties");
  await expectSlidingFill(
    page,
    page.getByRole("button", { name: "Apply filters", exact: true }),
  );
  const view = page.getByRole("link", { name: /^View property:/ }).first();
  await expectSlidingFill(page, view);
  await page.mouse.move(0, 0);
  await expect(view).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(view).toHaveCSS("border-top-color", "rgb(112, 31, 53)");
  const footer = page.locator(".public-footer-cta a");
  await expectSlidingFill(page, footer);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await view.focus();
  await expect(view).toBeFocused();
  await expect(view).toHaveCSS("color", "rgb(255, 255, 255)");
  expect(
    await view.evaluate(
      (el) => getComputedStyle(el, "::before").transitionDuration,
    ),
  ).toBe("0s");
  await view.click();
  const gallery = page.getByRole("button", { name: /View all.*photos/i });
  await expect(gallery).toBeVisible();
  await expect(gallery).toHaveCSS("position", "absolute");
  await gallery.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/contact");
  const contact = page
    .locator(".agency-contact-media")
    .getByRole("link", { name: "Meet our agents" });
  await expectSlidingFill(page, contact);
  await contact.focus();
  await expect(contact).toHaveCSS("outline-color", "rgb(250, 248, 245)");
});

test("CRM primary and secondary actions share the public treatment and keep navigation", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  await signInTask(page);
  await page.goto("/crm/leads/new");
  await expect(
    page.getByRole("radio", { name: "No property selected", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByRole("radio", { name: "Unassigned", exact: true }),
  ).toBeEnabled();
  const primary = page.getByRole("button", { name: "Save lead", exact: true });
  await expectSlidingFill(page, primary);
  const cancel = page.getByRole("link", { name: "Cancel", exact: true });
  await expectSlidingFill(page, cancel);
  await cancel.click();
  await expect(page).toHaveURL(/\/crm\/leads$/);
});

test("navigation feedback escapes the clipped action while the destination is pending", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  await page.goto("/properties");
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/properties/**", async (route) => {
    if (route.request().headers().rsc === "1") await held;
    await route.continue();
  });
  try {
    await page
      .getByRole("link", { name: /^View property:/ })
      .first()
      .click();
    const status = page
      .getByRole("status")
      .filter({ hasText: "Opening page…" });
    await expect(status).toBeVisible();
    expect(
      await status.evaluate((el) => el.parentElement === document.body),
    ).toBe(true);
    await expect(status.locator('[data-slot="spinner"]')).toBeVisible();
    release();
    await expect(page).toHaveURL(/\/properties\/[^/?]+/);
    await expect(status).toHaveCount(0);
  } finally {
    release();
  }
});
