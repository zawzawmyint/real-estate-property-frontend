import { afterEach, expect, it, vi } from "vitest";
import { getPropertyCandidates } from "@/features/leads/data/queries";
afterEach(() => vi.unstubAllGlobals());
it.each(["", "   "])(
  "omits empty property search q so initial and cleared lookup work: %j",
  async (q) => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ items: [], page: 1, pageSize: 12, total: 0 }),
        ),
    );
    await getPropertyCandidates(q, 1);
    const url = String(vi.mocked(fetch).mock.calls[0]?.[0]);
    const params = new URL(url, "http://localhost").searchParams;
    expect(params.has("q")).toBe(false);
    expect(params.get("availability")).toBe("available");
    expect(params.get("pageSize")).toBe("12");
  },
);
it("trims nonempty property search and retains bounded eligibility filtering", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      Response.json({
        items: [
          {
            id: "draft",
            title: "Draft home",
            purpose: "rent",
            publishingState: "draft",
          },
          {
            id: "archived",
            title: "Archived home",
            purpose: "sale",
            publishingState: "archived",
          },
        ],
        page: 2,
        pageSize: 12,
        total: 13,
      }),
    ),
  );
  const result = await getPropertyCandidates("  marina  ", 2);
  const params = new URL(
    String(vi.mocked(fetch).mock.calls[0]?.[0]),
    "http://localhost",
  ).searchParams;
  expect(params.get("q")).toBe("marina");
  expect(params.get("page")).toBe("2");
  expect(result.items).toEqual([
    { id: "draft", name: "Draft home", purpose: "rent" },
  ]);
  expect(result.total).toBe(13);
});
