import { z } from "zod";
import type { components } from "@/lib/api/generated/public-chat";

export const chatMessageLimit = 500;

export const chatMessage = z
  .string()
  .trim()
  .min(1, "Enter a question.")
  .max(chatMessageLimit, "Keep your question to 500 characters.");

type ApiReply = components["schemas"]["PublicChatReply"];
type ListingFields =
  | "id"
  | "title"
  | "community"
  | "purpose"
  | "priceFils"
  | "bedrooms"
  | "isDemo";
type DisplayReply = Omit<ApiReply, "properties"> & {
  properties: Pick<ApiReply["properties"][number], ListingFields>[];
};

const listing = z.object({
  id: z.uuid(),
  title: z.string().min(1).max(160),
  community: z.string().min(1).max(120),
  purpose: z.enum(["sale", "rent"]),
  priceFils: z.number().int().min(1).max(1_000_000_000_000),
  bedrooms: z.number().int().min(0).max(20),
  isDemo: z.boolean(),
});

export const chatReply = z
  .object({
    kind: z.enum(["faq", "properties", "clarify", "no_answer"]),
    message: z.string().min(1).max(1500),
    sources: z
      .array(
        z.object({
          id: z.string().min(1),
          title: z.string().min(1),
          path: z.enum(["/contact", "/properties"]),
        }),
      )
      .max(3),
    properties: z.array(listing).max(3),
  })
  .refine(
    ({ kind, sources, properties }) =>
      (kind === "faq" ? sources.length > 0 : sources.length === 0) &&
      (kind === "properties" || properties.length === 0),
  ) satisfies z.ZodType<DisplayReply>;

export type PublicChatReply = z.infer<typeof chatReply>;
