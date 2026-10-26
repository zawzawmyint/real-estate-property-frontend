import { z } from "zod";
import { type CreateProperty, type StaffProperty } from "./types";

export const propertyPurposes = ["sale", "rent"] as const;
export const propertyTypes = [
  "apartment",
  "villa",
  "townhouse",
  "penthouse",
] as const;
export const publishingStates = ["draft", "published", "archived"] as const;
export const availabilityStates = ["available", "sold", "rented"] as const;

function decimalHundredths(
  value: string,
  maximum: number,
  label: string,
): number {
  const text = value.trim();

  if (!/^\d+(?:\.\d{1,2})?$/.test(text))
    throw new Error(
      `${label} must be a positive number with at most two decimal places.`,
    );

  const [whole = "", fraction = ""] = text.split(".");
  const result = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));

  if (result < 1n || result > BigInt(maximum))
    throw new Error(`${label} is outside the allowed range.`);

  return Number(result);
}

export function parseAedToFils(value: string): number {
  return decimalHundredths(value, 1_000_000_000_000, "Price");
}

export function parseAedFilterToFils(value: string): number {
  if (/^0+(?:\.0{1,2})?$/.test(value.trim())) return 0;

  return parseAedToFils(value);
}

export function filsToAed(value: number): string {
  if (!Number.isSafeInteger(value) || value < 0)
    throw new Error("Invalid price.");

  return `${Math.floor(value / 100)}.${String(value % 100).padStart(2, "0")}`;
}

export function parseArea(value: string): string {
  return filsToAed(decimalHundredths(value, 100_000_000, "Area"));
}

const optionalText = (max: number) => z.string().trim().max(max).default("");
const numeric = (label: string, parser: (value: string) => unknown) =>
  z
    .string()
    .trim()
    .default("")
    .superRefine((value, context) => {
      if (!value) return;

      try {
        parser(value);
      } catch (error) {
        context.addIssue({
          code: "custom",
          message:
            error instanceof Error ? error.message : `${label} is invalid.`,
        });
      }
    });

function rooms(value: string): number {
  if (!/^\d+$/.test(value) || Number(value) > 20)
    throw new Error("Enter a whole number from 0 to 20.");

  return Number(value);
}

export const propertyFormSchema = z.object({
  title: z.string().trim().min(1, "Enter a title.").max(160),
  purpose: z.enum(propertyPurposes),
  type: z.union([z.enum(propertyTypes), z.literal("")]).default(""),
  description: optionalText(10000),
  price: numeric("Price", parseAedToFils),
  city: optionalText(120),
  community: optionalText(120),
  bedrooms: numeric("Bedrooms", rooms),
  bathrooms: numeric("Bathrooms", rooms),
  areaSqft: numeric("Area", parseArea),
  ownerName: optionalText(120),
  ownerPhone: optionalText(40).refine(
    (value) =>
      !value ||
      (value.length >= 3 && /^[+\d\s()-]+$/.test(value) && /\d/.test(value)),
    "Enter a valid owner phone number.",
  ),
  featured: z.boolean().default(false),
});

export type PropertyFormValues = z.output<typeof propertyFormSchema>;

export function toPropertyInput(values: PropertyFormValues): CreateProperty {
  return {
    title: values.title,
    purpose: values.purpose,
    type: values.type || null,
    description: values.description || null,
    priceFils: values.price ? parseAedToFils(values.price) : null,
    city: values.city || null,
    community: values.community || null,
    bedrooms: values.bedrooms ? rooms(values.bedrooms) : null,
    bathrooms: values.bathrooms ? rooms(values.bathrooms) : null,
    areaSqft: values.areaSqft ? parseArea(values.areaSqft) : null,
    ownerName: values.ownerName || null,
    ownerPhone: values.ownerPhone || null,
    featured: values.featured,
  };
}

export function propertyFormDefaults(
  property?: StaffProperty,
): PropertyFormValues {
  return {
    title: property?.title ?? "",
    purpose: property?.purpose ?? "sale",
    type: property?.type ?? "",
    description: property?.description ?? "",
    price: property?.priceFils == null ? "" : filsToAed(property.priceFils),
    city: property?.city ?? "",
    community: property?.community ?? "",
    bedrooms: property?.bedrooms?.toString() ?? "",
    bathrooms: property?.bathrooms?.toString() ?? "",
    areaSqft: property?.areaSqft ?? "",
    ownerName: property?.ownerName ?? "",
    ownerPhone: property?.ownerPhone ?? "",
    featured: property?.featured ?? false,
  };
}

export function publishingRequirements(
  values: PropertyFormValues,
  photoCount: number,
): Partial<Record<keyof PropertyFormValues | "photos", string>> {
  const errors: Partial<Record<keyof PropertyFormValues | "photos", string>> =
    {};

  for (const key of [
    "type",
    "description",
    "price",
    "city",
    "community",
    "bedrooms",
    "bathrooms",
    "areaSqft",
    "ownerName",
    "ownerPhone",
  ] as const) {
    if (values[key] === "") errors[key] = "Required before publishing.";
  }

  if (!photoCount)
    errors.photos = "Add at least one saved photo before publishing.";

  return errors;
}
