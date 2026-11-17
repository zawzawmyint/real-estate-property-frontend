import { z } from "zod";
import { issueSchema } from "@/lib/csv/import";
import type { components } from "@/lib/api/generated/leads";
import type { ActionError, ActionResult } from "./types";
import { importDuplicateReviewSchema } from "./duplicate-types";

export type ImportPreview = z.infer<typeof previewSchema>;
export type ImportResult = components["schemas"]["LeadImportResult"];
export type ImportIssue = z.infer<typeof issueSchema>;
export type ImportOutcome<T> =
  | ActionResult<T>
  | {
      ok: false;
      error: ActionError;
      issues: ImportIssue[];
      issueCount: number;
    };

export const previewSchema = z
  .strictObject({
    schemaVersion: z.literal(2),
    duplicateReview: importDuplicateReviewSchema,
    digest: z.string().regex(/^[a-f0-9]{64}$/),
    valid: z.boolean(),
    totalRows: z.number().int().min(1).max(500),
    validRows: z.number().int().min(0).max(500),
    issueCount: z.number().int().min(0),
    issues: z.array(issueSchema).max(100),
    columns: z.tuple([
      z.literal("name"),
      z.literal("phone"),
      z.literal("email"),
      z.literal("purpose"),
      z.literal("budget_aed"),
      z.literal("source"),
    ]),
    previewRows: z
      .array(
        z.strictObject({
          rowNumber: z.number().int().min(2),
          values: z.array(z.string()).length(6),
        }),
      )
      .max(20),
  })
  .refine(
    (p) =>
      p.validRows <= p.totalRows &&
      p.issueCount >= p.issues.length &&
      (p.valid
        ? p.issueCount === 0 && p.validRows === p.totalRows
        : p.issueCount > 0 &&
          p.issues.length > 0 &&
          p.validRows < p.totalRows) &&
      p.previewRows.every((row) => row.rowNumber <= p.totalRows + 1) &&
      new Set(p.previewRows.map((row) => row.rowNumber)).size ===
        p.previewRows.length,
  );

export const resultSchema = z
  .strictObject({
    submissionId: z.uuid(),
    createdCount: z.number().int().min(1).max(500),
    leadIds: z.array(z.uuid()).min(1).max(500),
    replayed: z.boolean(),
  })
  .refine(
    (r) =>
      r.createdCount === r.leadIds.length &&
      new Set(r.leadIds).size === r.leadIds.length,
  );
