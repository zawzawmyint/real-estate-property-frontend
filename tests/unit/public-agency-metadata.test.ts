import { expect, it, vi } from "vitest";
const reads = vi.hoisted(() => ({ agent: vi.fn(), agency: vi.fn() }));
vi.mock("@/features/agency/data/queries", () => ({
  getPublicAgent: reads.agent,
  getPublicAgency: reads.agency,
}));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));
import { generateMetadata } from "@/app/(public)/agents/[slug]/page";

it.each([
  [true, false, false],
  [false, true, false],
  [false, false, true],
])(
  "profile indexing respects agency demo=%s and agent demo=%s",
  async (agencyDemo, agentDemo, indexable) => {
    reads.agent.mockResolvedValue({
      name: "Public consultant",
      introduction: "Public introduction",
      isDemo: agentDemo,
    });
    reads.agency.mockResolvedValue({ isDemo: agencyDemo });
    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: "public-consultant" }),
    });
    expect(metadata.robots).toEqual(
      indexable ? undefined : { index: false, follow: true },
    );
  },
);

it("cannot assert live indexing when the agency content mode is unavailable", async () => {
  reads.agent.mockResolvedValue({
    name: "Public consultant",
    introduction: "Public introduction",
    isDemo: false,
  });
  reads.agency.mockRejectedValue(new Error("unavailable"));
  expect(
    (
      await generateMetadata({
        params: Promise.resolve({ slug: "public-consultant" }),
      })
    ).robots,
  ).toEqual({ index: false, follow: true });
});
