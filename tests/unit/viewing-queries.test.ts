import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { getBookableProperties } from "@/features/viewings/data/queries";
beforeEach(() =>
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue(
        Response.json({ items: [], page: 1, pageSize: 12, total: 0 }),
      ),
  ),
);
afterEach(() => vi.unstubAllGlobals());
it.each([undefined, "", "   "])(
  "omits blank property search while retaining server eligibility filters",
  async (search) => {
    await getBookableProperties(search);
    const [url] = vi.mocked(fetch).mock.calls[0]!;
    const query = new URL(String(url), "http://localhost").searchParams;
    expect(Object.fromEntries(query)).toEqual({
      page: "1",
      pageSize: "12",
      publishingState: "published",
      availability: "available",
    });
  },
);
it("trims nonempty search and retains pagination and cancellation", async () => {
  const controller = new AbortController();
  await getBookableProperties("  Palm residence  ", 2, controller.signal);
  const [url, init] = vi.mocked(fetch).mock.calls[0]!;
  expect(
    Object.fromEntries(new URL(String(url), "http://localhost").searchParams),
  ).toEqual({
    page: "2",
    pageSize: "12",
    publishingState: "published",
    availability: "available",
    q: "Palm residence",
  });
  expect(init?.signal).toBe(controller.signal);
});
