import {
  availabilityStates,
  propertyPurposes,
  propertyTypes,
  publishingStates,
} from "./input";

export type PropertyFilters = {
  purpose?: "sale" | "rent";
  type?: "apartment" | "villa" | "townhouse" | "penthouse";
  location?: string;
  minPriceFils?: number;
  maxPriceFils?: number;
  minBedrooms?: number;
  featured?: boolean;
  sort?: "newest" | "price_asc" | "price_desc" | "updated_desc";
  page?: number;
  pageSize?: number;
  q?: string;
  publishingState?: "draft" | "published" | "archived";
  availability?: "available" | "sold" | "rented";
};

export class PropertyFilterError extends Error {}

const publicKeys = [
  "purpose",
  "type",
  "location",
  "minPriceFils",
  "maxPriceFils",
  "minBedrooms",
  "featured",
  "sort",
  "page",
  "pageSize",
];

export function parsePropertyFilters(
  params: URLSearchParams,
  staff = false,
): PropertyFilters {
  const result: Record<string, string | number | boolean> = {
    ...(staff ? {} : { purpose: "sale" }),
    sort: staff ? "updated_desc" : "newest",
    page: 1,
    pageSize: 12,
  };
  const allowed = staff
    ? [...publicKeys, "q", "publishingState", "availability"]
    : publicKeys;

  for (const [key, raw] of params) {
    if (
      !allowed.includes(key) ||
      params.getAll(key).length !== 1 ||
      raw.trim() === ""
    )
      throw new PropertyFilterError(`Invalid ${key} filter.`);

    const value = raw.trim();

    if (
      [
        "minPriceFils",
        "maxPriceFils",
        "minBedrooms",
        "page",
        "pageSize",
      ].includes(key)
    ) {
      const min = key === "page" || key === "pageSize" ? 1 : 0;
      const max =
        key === "page"
          ? 10000
          : key === "pageSize"
            ? 48
            : key === "minBedrooms"
              ? 20
              : 1_000_000_000_000;
      const number = Number(value);

      if (
        !/^\d+$/.test(value) ||
        !Number.isSafeInteger(number) ||
        number < min ||
        number > max
      )
        throw new PropertyFilterError(`Invalid ${key} filter.`);

      result[key] = number;
    } else if (key === "featured") {
      if (value !== "true" && value !== "false")
        throw new PropertyFilterError("Invalid featured filter.");

      result[key] = value === "true";
    } else {
      const enums: Record<string, readonly string[]> = {
        purpose: propertyPurposes,
        type: propertyTypes,
        publishingState: publishingStates,
        availability: availabilityStates,
        sort: staff
          ? ["newest", "price_asc", "price_desc", "updated_desc"]
          : ["newest", "price_asc", "price_desc"],
      };

      if (
        (enums[key] && !enums[key].includes(value)) ||
        value.length > (key === "q" ? 160 : 120)
      )
        throw new PropertyFilterError(`Invalid ${key} filter.`);

      result[key] = value;
    }
  }

  if (
    typeof result.minPriceFils === "number" &&
    typeof result.maxPriceFils === "number" &&
    result.minPriceFils > result.maxPriceFils
  )
    throw new PropertyFilterError(
      "Minimum price must not exceed maximum price.",
    );

  return result as PropertyFilters;
}

export function parsePublicFilters(params: URLSearchParams): PropertyFilters {
  return parsePropertyFilters(params);
}

export function serializePropertyFilters(
  filters: PropertyFilters,
): URLSearchParams {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filters))
    if (value !== undefined && value !== "") params.set(key, String(value));

  return params;
}

export function searchParamsToURL(
  params: Record<string, string | string[] | undefined>,
): URLSearchParams {
  const result = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) value.forEach((item) => result.append(key, item));
    else if (value !== undefined) result.append(key, value);
  }

  return result;
}

export function formatPrice(fils: number, purpose?: string): string {
  return `AED ${new Intl.NumberFormat("en-AE", { maximumFractionDigits: 2 }).format(fils / 100)}${purpose === "rent" ? "/year" : ""}`;
}

export function formatArea(area: string | number): string {
  return `${new Intl.NumberFormat("en-AE", { maximumFractionDigits: 2 }).format(Number(area))} sqft`;
}

export function formatBedrooms(bedrooms: number): string {
  return bedrooms === 0 ? "Studio" : `${bedrooms} beds`;
}
