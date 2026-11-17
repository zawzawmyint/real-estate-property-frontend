import { z } from "zod";
import { stages } from "./input";
import type { components } from "@/lib/api/generated/leads";

export const duplicateAcknowledgementSchema = z.strictObject({
  reviewToken: z.string().regex(/^[a-f0-9]{64}$/),
});
export const duplicateLeadSchema = z.strictObject({
  id: z.uuid(),
  name: z.string(),
  phone: z.string(),
  stage: z.enum(stages),
  assignedAgent: z
    .object({ id: z.string(), name: z.string(), available: z.boolean() })
    .nullable(),
});
export const duplicateReviewSchema = z
  .strictObject({
    canonicalPhone: z.string().regex(/^\+[1-9]\d{1,14}$/),
    totalMatches: z.number().int().nonnegative(),
    matches: z.array(duplicateLeadSchema).max(20),
    truncated: z.boolean(),
    reviewToken: duplicateAcknowledgementSchema.shape.reviewToken,
  })
  .refine(
    (value) =>
      value.matches.length === Math.min(value.totalMatches, 20) &&
      value.truncated === value.totalMatches > value.matches.length &&
      new Set(value.matches.map((match) => match.id)).size ===
        value.matches.length,
  );
export type DuplicateReview = components["schemas"]["DuplicateReview"];

export const importDuplicateReviewSchema = z
  .strictObject({
    affectedRows: z.number().int().min(0).max(500),
    existingMatchRows: z.number().int().min(0).max(500),
    withinFileRows: z.number().int().min(0).max(500),
    warningCount: z.number().int().min(0).max(500),
    warnings: z
      .array(
        z
          .strictObject({
            rowNumber: z.number().int().min(2).max(501),
            canonicalPhone: duplicateReviewSchema.shape.canonicalPhone,
            existingMatchCount: z.number().int().nonnegative(),
            matches: z.array(duplicateLeadSchema).max(5),
            sameFileRowNumbers: z
              .array(z.number().int().min(2).max(501))
              .max(20),
            sameFileRowCount: z.number().int().min(0).max(499),
          })
          .refine(
            (row) =>
              row.matches.length === Math.min(row.existingMatchCount, 5) &&
              row.sameFileRowNumbers.length ===
                Math.min(row.sameFileRowCount, 20) &&
              !row.sameFileRowNumbers.includes(row.rowNumber) &&
              (row.existingMatchCount > 0 || row.sameFileRowCount > 0),
          ),
      )
      .max(100),
    truncated: z.boolean(),
    reviewToken: duplicateAcknowledgementSchema.shape.reviewToken,
  })
  .refine(
    (value) =>
      value.warningCount === value.affectedRows &&
      value.warnings.length === Math.min(value.warningCount, 100) &&
      value.truncated === value.warningCount > value.warnings.length &&
      value.existingMatchRows <= value.affectedRows &&
      value.withinFileRows <= value.affectedRows,
  );
export type ImportDuplicateReview =
  components["schemas"]["ImportDuplicateReview"];
