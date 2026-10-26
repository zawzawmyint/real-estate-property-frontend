import { describe, expect, it } from "vitest";
import {
  parseAedToFils,
  parseAedFilterToFils,
  filsToAed,
  parseArea,
  propertyFormSchema,
  toPropertyInput,
  publishingRequirements,
} from "@/features/properties/data/input";

describe("property input", () => {
  it("converts AED exactly without rounding", () => {
    expect(parseAedToFils("10000000000.00")).toBe(1_000_000_000_000);
    expect(parseAedToFils("0.29")).toBe(29);
    expect(filsToAed(29)).toBe("0.29");
    expect(parseAedFilterToFils("0.00")).toBe(0);
    expect(() => parseAedToFils("0.00")).toThrow();

    for (const value of ["", "-1", "1e3", "0.001", "1,200", "10000000000.01"])
      expect(() => parseAedToFils(value)).toThrow();
  });
  it("shows publishing requirements without mistaking Studio for missing bedrooms", () => {
    const values = propertyFormSchema.parse({
      title: "A studio",
      purpose: "sale",
      bedrooms: "0",
    });

    expect(publishingRequirements(values, 0)).toMatchObject({
      photos: expect.any(String),
      price: expect.any(String),
    });
    expect(publishingRequirements(values, 1)).not.toHaveProperty("bedrooms");
  });
  it("preserves area precision and rejects extra decimals", () => {
    expect(parseArea("001186.1")).toBe("1186.10");

    for (const value of ["0", "1.001", "1000000.01", "Infinity"])
      expect(() => parseArea(value)).toThrow();
  });
  it("supports minimal drafts, null optional fields, and Studio", () => {
    const draft = propertyFormSchema.parse({
      title: " A home ",
      purpose: "sale",
    });

    expect(toPropertyInput(draft)).toMatchObject({
      title: "A home",
      purpose: "sale",
      bedrooms: null,
      priceFils: null,
    });
    expect(
      toPropertyInput(
        propertyFormSchema.parse({
          title: "Studio",
          purpose: "rent",
          bedrooms: "0",
          price: "0.29",
        }),
      ),
    ).toMatchObject({ bedrooms: 0, priceFils: 29 });
  });
});
