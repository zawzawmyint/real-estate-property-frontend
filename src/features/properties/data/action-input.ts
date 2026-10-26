import { z } from "zod";
import { isValidPropertyPhoto } from "./photo-input";
import {
  availabilityStates,
  propertyPurposes,
  propertyTypes,
  publishingStates,
} from "./input";

// Parse the API payload, not display-unit form values. Express independently
// applies its authoritative schema and resource/lifecycle rules.
const text = (max: number) => z.string().trim().min(1).max(max);
const fields = {
  title: text(160),
  purpose: z.enum(propertyPurposes),
  type: z.enum(propertyTypes).nullable(),
  description: text(10_000).nullable(),
  priceFils: z.number().int().min(1).max(1_000_000_000_000).nullable(),
  city: text(120).nullable(),
  community: text(120).nullable(),
  bedrooms: z.number().int().min(0).max(20).nullable(),
  bathrooms: z.number().int().min(0).max(20).nullable(),
  areaSqft: z
    .string()
    .regex(/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/)
    .refine((value) => Number(value) > 0 && Number(value) <= 1_000_000)
    .nullable(),
  ownerName: text(120).nullable(),
  ownerPhone: text(40)
    .min(3)
    .regex(/^[+\d ()-]+$/)
    .regex(/\d/)
    .nullable(),
  featured: z.boolean(),
};
export const propertyIdSchema = z.uuid();
export const createPropertySchema = z
  .strictObject(fields)
  .partial()
  .required({ title: true, purpose: true });
export const patchPropertySchema = z
  .strictObject({
    ...fields,
    publishingState: z.enum(publishingStates),
    availability: z.enum(availabilityStates),
  })
  .partial()
  .refine(
    (value) => Object.values(value).some((entry) => entry !== undefined),
    "Provide at least one change.",
  );
export const photoOrderSchema = z
  .array(propertyIdSchema)
  .max(12)
  .refine(
    (ids) => new Set(ids).size === ids.length,
    "Photo IDs must be unique.",
  );
export const photoFileSchema = z
  .instanceof(File)
  .refine(
    isValidPropertyPhoto,
    "Use JPEG, PNG or WebP images up to 5 MiB each.",
  );
