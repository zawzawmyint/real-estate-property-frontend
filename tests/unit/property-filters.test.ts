import { describe, expect, it } from "vitest";
import {
  parsePublicFilters,
  serializePropertyFilters,
  formatBedrooms,
} from "@/features/properties/data/filters";

describe("property filters", () => {
  it("keeps explicit zeroes and reloads combined filters", () => {
    const filters = parsePublicFilters(
      new URLSearchParams(
        "purpose=rent&minPriceFils=0&minBedrooms=0&location=Marina&page=3",
      ),
    );

    expect(filters).toMatchObject({
      purpose: "rent",
      minPriceFils: 0,
      minBedrooms: 0,
      page: 3,
    });
    expect(parsePublicFilters(serializePropertyFilters(filters))).toEqual(
      filters,
    );
    expect(formatBedrooms(0)).toBe("Studio");
  });
  it("rejects malformed filters instead of broadening searches", () => {
    for (const query of [
      "page=1.2",
      "page=1e2",
      "minPriceFils=-1",
      "minBedrooms=21",
      "page=",
      "purpose=rent&purpose=sale",
      "publishingState=draft",
      "minPriceFils=20&maxPriceFils=10",
    ])
      expect(() => parsePublicFilters(new URLSearchParams(query))).toThrow();
  });
});
