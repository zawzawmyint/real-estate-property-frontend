import { expect, test } from "@playwright/test";

test("Contact connects its split surface to the header and keeps the form in page flow", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Explicit viewport coverage.");
  await page.setViewportSize({ width: 1480, height: 810 });
  await page.goto("/contact");
  await expect(
    page.getByRole("heading", {
      name: "Tell us what home means to you.",
      exact: true,
    }),
  ).toBeVisible();
  const header = await page.locator(".public-header").boundingBox();
  const surface = await page.locator(".agency-contact-layout").boundingBox();
  expect(header).not.toBeNull();
  expect(surface).not.toBeNull();
  expect(Math.abs(surface!.y - header!.y - header!.height)).toBeLessThanOrEqual(
    1,
  );
  const intro = await page.locator(".agency-contact-intro").boundingBox();
  const formArea = await page.locator(".agency-contact-form").boundingBox();
  expect(formArea!.x).toBeGreaterThanOrEqual(intro!.x + intro!.width - 1);
  const form = page.locator(".agency-contact-form form");
  await expect(form).toHaveCount(1);
  await expect(page.getByLabel("I'm looking to", { exact: true })).toHaveValue(
    "",
  );
  for (const width of [1480, 1024, 768, 640, 390, 320]) {
    await page.setViewportSize({ width, height: 810 });
    const submit = page.getByRole("button", {
      name: "Send enquiry",
      exact: true,
    });
    await submit.scrollIntoViewIfNeeded();
    await expect(submit).toBeInViewport();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width + 1);
    expect(
      await form.evaluate(
        (el) =>
          el.scrollHeight <= el.clientHeight + 1 &&
          getComputedStyle(el).overflowY === "visible",
      ),
    ).toBe(true);
  }
});

test("profile keeps facts and biography beside the right-hand portrait and reflows on mobile", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Explicit viewport coverage.");
  const response = await page.request.get("/api/v1/public/agents/amira-hassan");
  expect(response.ok()).toBe(true);
  const agent = await response.json();
  await page.goto(`/agents/${agent.slug}`);
  const facts = page.getByRole("complementary", {
    name: "Agent specialties and languages",
  });
  const biography = page.getByRole("region", { name: "About Amira" });
  const portrait = page.getByRole("img", {
    name: `Portrait of ${agent.name}`,
    exact: true,
  });
  await expect(biography).toContainText(agent.introduction);
  for (const paragraph of agent.biography)
    await expect(biography).toContainText(paragraph);
  for (const language of agent.languages)
    await expect(facts).toContainText(language);
  await expect(page.locator("main form")).toHaveCount(0);
  for (const width of [1480, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    const left = await facts.boundingBox();
    const middle = await biography.boundingBox();
    const right = await portrait.boundingBox();
    expect(left && middle && right).toBeTruthy();
    if (width >= 1024) {
      expect(middle!.x).toBeGreaterThan(left!.x + left!.width);
      expect(right!.x).toBeGreaterThanOrEqual(middle!.x + middle!.width);
    } else {
      expect(middle!.y).toBeGreaterThan(left!.y);
      expect(right!.y).toBeGreaterThan(middle!.y);
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width + 1);
  }
});

test("Contact image failure preserves an honest illustration caption and usable form", async ({
  page,
}) => {
  await page.route("**/_next/image?**", async (route) => {
    if (
      decodeURIComponent(route.request().url()).includes(
        "/images/agency/contact-interior.webp",
      )
    )
      await route.abort();
    else await route.continue();
  });
  await page.goto("/contact");
  await page.locator(".agency-contact-media").scrollIntoViewIfNeeded();
  await expect(
    page.getByRole("img", {
      name: "Illustrative home image unavailable",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator("figcaption")).toHaveText("Illustrative home");
  await expect(
    page.getByRole("button", { name: "Send enquiry", exact: true }),
  ).toBeEnabled();
});

test("the bounded 24-profile directory reflows long public fields without clipping actions", async ({
  page,
}, info) => {
  test.skip(
    info.project.name !== "desktop" || info.config.workers !== 1,
    "One serial fixture covers explicit viewports.",
  );
  const control = "http://127.0.0.1:4312/_e2e/rules";
  const registered = await page.request.post(control, {
    data: { method: "GET", path: "/api/v1/public/agents", agentCount: 24 },
  });
  expect(registered.status(), await registered.text()).toBe(201);
  const { id } = await registered.json();
  try {
    await page.request.post(`${control}/${id}/release`);
    await page.goto("/agents");
    const cards = page.locator("main article");
    await expect(cards).toHaveCount(24);
    await expect(
      page.getByRole("img", { name: /Advisor 1 .*Portrait unavailable/ }),
    ).toBeVisible();
    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      const overflowing = await cards.evaluateAll((elements) =>
        elements.some((card) =>
          Array.from(card.querySelectorAll("h2, p, li, a")).some(
            (el) => el.scrollWidth > el.clientWidth + 1,
          ),
        ),
      );
      expect(overflowing).toBe(false);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width + 1);
      const action = cards.last().getByRole("link", { name: /^View profile:/ });
      await action.scrollIntoViewIfNeeded();
      await expect(action).toBeInViewport();
    }
  } finally {
    await page.request.delete(`${control}/${id}`);
  }
});

test("held catalog reads reserve the redesigned directory portraits and Contact split", async ({
  page,
}, info) => {
  test.skip(
    info.project.name !== "desktop" || info.config.workers !== 1,
    "Serial delayed-response fixture.",
  );
  const control = "http://127.0.0.1:4312/_e2e/rules";
  await page.setViewportSize({ width: 1480, height: 900 });
  for (const [route, path, name] of [
    ["/agents", "/api/v1/public/agents", "Loading our agents"],
    ["/contact", "/api/v1/public/agency", "Loading contact information"],
  ]) {
    const registered = await page.request.post(control, {
      data: { method: "GET", path },
    });
    expect(registered.status(), await registered.text()).toBe(201);
    const { id } = await registered.json();
    try {
      await page.goto(route!, { waitUntil: "commit" });
      const loading = page.getByRole("status", { name, exact: true });
      await expect(loading).toBeVisible();
      const heading = await page.locator("main h1").boundingBox();
      expect(heading).not.toBeNull();
      if (route === "/agents") {
        const photo = await loading
          .locator('[data-slot="skeleton"]')
          .nth(1)
          .boundingBox();
        expect(photo!.width / photo!.height).toBeCloseTo(7 / 6, 2);
      } else {
        const area = await loading
          .locator(".agency-contact-form")
          .boundingBox();
        const intro = await loading
          .locator(".agency-contact-intro")
          .boundingBox();
        expect(area!.x).toBeGreaterThanOrEqual(intro!.x + intro!.width - 1);
      }
      await page.request.post(`${control}/${id}/release`);
      await expect(loading).toHaveCount(0);
      const finalHeading = await page.locator("main h1").boundingBox();
      expect(Math.abs(finalHeading!.x - heading!.x)).toBeLessThanOrEqual(1);
      expect(Math.abs(finalHeading!.y - heading!.y)).toBeLessThanOrEqual(1);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(1481);
    } finally {
      await page.request.delete(`${control}/${id}`);
    }
  }
});
