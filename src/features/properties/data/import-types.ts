import { z } from "zod";
import { issueSchema } from "@/lib/csv/import";
import type { components } from "@/lib/api/generated/properties";
import type { PropertyActionError, PropertyActionResult } from "./types";
export type ImportPreview = components["schemas"]["PropertyImportPreview"];
export type ImportResult = components["schemas"]["PropertyImportResult"];
export type ImportIssue = z.infer<typeof issueSchema>;
export type ImportOutcome<T> =
  | PropertyActionResult<T>
  | {
      ok: false;
      error: PropertyActionError;
      issues: ImportIssue[];
      issueCount: number;
    };
export const previewSchema = z
  .object({
    schemaVersion: z.literal(1),
    digest: z.string().regex(/^[a-f0-9]{64}$/),
    valid: z.boolean(),
    totalRows: z.number().int().min(0).max(500),
    validRows: z.number().int().min(0).max(500),
    issueCount: z.number().int().min(0),
    issues: z.array(issueSchema).max(100),
    columns: z.tuple([
      z.literal("title"),
      z.literal("purpose"),
      z.literal("type"),
      z.literal("description"),
      z.literal("price_aed"),
      z.literal("city"),
      z.literal("community"),
      z.literal("bedrooms"),
      z.literal("bathrooms"),
      z.literal("area_sqft"),
      z.literal("owner_name"),
      z.literal("owner_phone"),
    ]),
    previewRows: z
      .array(
        z.object({
          rowNumber: z.number().int().min(2),
          values: z.array(z.string()).length(12),
        }),
      )
      .max(20),
  })
  .refine(
    (p) =>
      p.validRows <= p.totalRows &&
      p.issueCount >= p.issues.length &&
      (!p.valid ||
        (p.issueCount === 0 && p.validRows === p.totalRows && p.totalRows > 0)),
  );
export const resultSchema = z
  .object({
    submissionId: z.uuid(),
    createdCount: z.number().int().min(1).max(500),
    propertyIds: z.array(z.uuid()).min(1).max(500),
    replayed: z.boolean(),
  })
  .refine((r) => r.createdCount === r.propertyIds.length);
