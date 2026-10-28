import { z } from "zod";

export const stages = [
  "new",
  "contacted",
  "viewing_scheduled",
  "offer",
  "won",
  "lost",
] as const;
export const stageLabels: Record<(typeof stages)[number], string> = {
  new: "New",
  contacted: "Contacted",
  viewing_scheduled: "Viewing Scheduled",
  offer: "Offer",
  won: "Won",
  lost: "Lost",
};
export const sourceLabels = {
  website: "Website",
  call: "Call",
  walk_in: "Walk-in",
};
const phone = z
  .string()
  .transform((value) => value.replace(/\s/g, " ").trim())
  .pipe(
    z
      .string()
      .min(3, "Enter a phone number with at least 3 characters.")
      .max(40, "Keep the phone number within 40 characters.")
      .regex(/^[+\d ()-]+$/, "Use digits, spaces, +, - or parentheses.")
      .regex(/\d/, "Include at least one digit in the phone number."),
  );
const email = z.string().trim().toLowerCase().pipe(z.email().max(254));
const optional = <T extends z.ZodType<string>>(schema: T) =>
  schema.nullable().optional();
const contact = {
  name: z.string().trim().min(1, "Enter a name.").max(120),
  phone: optional(phone),
  email: optional(email),
};
function requireContact(
  value: { phone?: string | null; email?: string | null },
  ctx: z.RefinementCtx,
) {
  if (!value.phone && !value.email)
    ctx.addIssue({
      code: "custom",
      path: ["phone"],
      message: "Enter a phone number or email address.",
    });
}
export const inquirySchema = z
  .strictObject({
    submissionId: z.uuid(),
    ...contact,
    message: optional(z.string().trim().min(1).max(2000)),
  })
  .superRefine(requireContact);
export const agencyInquirySchema = z
  .strictObject({
    submissionId: z.uuid(),
    ...contact,
    purpose: z.enum(["sale", "rent"]),
    message: z.string().trim().min(1, "Tell us how we can help.").max(2000),
  })
  .superRefine(requireContact);
export const createLeadSchema = z
  .strictObject({
    submissionId: z.uuid(),
    ...contact,
    purpose: z.enum(["sale", "rent"]),
    source: z.enum(["call", "walk_in"]),
    budgetFils: z.number().int().min(1).max(1e12).nullable().optional(),
    propertyId: z.uuid().nullable().optional(),
    assignedAgentId: z.string().min(1).nullable().optional(),
  })
  .superRefine(requireContact);
export const patchLeadSchema = z
  .strictObject({
    expectedVersion: z.number().int().positive(),
    name: contact.name.optional(),
    phone: contact.phone,
    email: contact.email,
    purpose: z.enum(["sale", "rent"]).optional(),
    budgetFils: z.number().int().min(1).max(1e12).nullable().optional(),
    propertyId: z.uuid().nullable().optional(),
  })
  .refine(
    (value) =>
      Object.entries(value).some(
        ([key, val]) => key !== "expectedVersion" && val !== undefined,
      ),
    "Provide a change.",
  );
export const stageSchema = z.strictObject({
  expectedVersion: z.number().int().positive(),
  stage: z.enum(stages),
});
export const assignmentSchema = z.strictObject({
  expectedVersion: z.number().int().positive(),
  assignedAgentId: z.string().min(1).nullable(),
});
export const noteSchema = z.strictObject({
  submissionId: z.uuid(),
  expectedVersion: z.number().int().positive(),
  kind: z.enum(["note", "call"]),
  body: z.string().trim().min(1, "Write an entry.").max(5000),
});
export function budgetToFils(value: string) {
  if (!value.trim()) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(value))
    throw new Error("Use at most two decimal places.");
  const [whole, fraction = ""] = value.split(".");
  const fils = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(fils) || fils < 1 || fils > 1e12)
    throw new Error("Enter a budget between AED 0.01 and 10,000,000,000.");
  return fils;
}
const blankPhone = z.union([z.literal(""), phone]);
const blankEmail = z.union([z.literal(""), email]);
export const contactFormSchema = z
  .object({ name: contact.name, phone: blankPhone, email: blankEmail })
  .superRefine(requireContact);
export const leadFormSchema = z
  .object({
    name: contact.name,
    phone: blankPhone,
    email: blankEmail,
    purpose: z.enum(["sale", "rent"]),
    budget: z.string().refine((value) => {
      try {
        budgetToFils(value);
        return true;
      } catch {
        return false;
      }
    }, "Enter a positive AED budget with at most two decimal places."),
    propertyId: z.union([z.literal(""), z.uuid()]),
    source: z.enum(["call", "walk_in"]),
    assignedAgentId: z.string(),
  })
  .superRefine(requireContact);
export const inquiryFormSchema = z
  .object({
    name: contact.name,
    phone: blankPhone,
    email: blankEmail,
    message: z.string().trim().max(2000),
  })
  .superRefine(requireContact);
export type LeadFormValues = z.infer<typeof leadFormSchema>;
export type InquiryValues = z.infer<typeof inquiryFormSchema>;
export const agencyInquiryFormSchema = z
  .object({
    name: contact.name,
    phone: blankPhone,
    email: blankEmail,
    purpose: z.enum(["sale", "rent"], {
      error: "Choose whether you are looking to buy or rent.",
    }),
    message: z.string().trim().min(1, "Tell us how we can help.").max(2000),
  })
  .superRefine(requireContact);
export type AgencyInquiryValues = z.infer<typeof agencyInquiryFormSchema>;
