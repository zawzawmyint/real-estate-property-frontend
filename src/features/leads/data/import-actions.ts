"use server";
import { createHash } from "node:crypto";
import { z } from "zod";
import { decodeImportFile, importIdentitySchema } from "@/lib/csv/import";
import { runLeadOperation } from "./action-boundary";
import { LeadApiError } from "./request";
import { requestImport, ImportValidationError } from "./import-request";
import {
  previewSchema,
  resultSchema,
  type ImportOutcome,
  type ImportPreview,
  type ImportResult,
} from "./import-types";
import type { ActionResult } from "./types";
import { duplicateAcknowledgementSchema } from "./duplicate-types";

const leadImportIdentitySchema = importIdentitySchema.extend({
  schemaVersion: z.union([z.literal(1), z.literal(2)]),
});

export async function recoverLeadImport(
  file: File,
  identity: unknown,
  expectedStaffId: string,
): Promise<ImportOutcome<ImportResult>> {
  return fileOutcome(
    await runLeadOperation(
      async (headers, markDispatched) => {
        const pending = importIdentitySchema.parse(identity);
        const csv = await decodeImportFile(file);
        if (
          createHash("sha256")
            .update("lead-import:v1\0" + csv)
            .digest("hex") !== pending.digest
        )
          throw new LeadApiError(
            409,
            "IMPORT_RECOVERY_FILE_MISMATCH",
            "Choose the original file to resolve the earlier import, or explicitly acknowledge the duplicate risk before starting again.",
          );
        const result = await requestImport(
          "commit",
          { ...pending, csv },
          headers,
          resultSchema,
          markDispatched,
        );
        if (result.submissionId !== pending.submissionId || !result.replayed)
          throw new LeadApiError(
            502,
            "INVALID_RESPONSE",
            "The earlier import could not be confirmed. Retry with the same file.",
          );
        return result;
      },
      {
        manager: true,
        expectedStaffId:
          typeof expectedStaffId === "string" ? expectedStaffId : "",
      },
    ),
  );
}

export async function previewLeadImport(
  file: File,
  expectedStaffId: string,
): Promise<ImportOutcome<ImportPreview>> {
  return fileOutcome(
    await runLeadOperation(
      async (headers) =>
        requestImport(
          "preview",
          { csv: await decodeImportFile(file) },
          headers,
          previewSchema,
        ),
      {
        manager: true,
        expectedStaffId:
          typeof expectedStaffId === "string" ? expectedStaffId : "",
      },
    ),
  );
}

export async function commitLeadImport(
  file: File,
  identity: unknown,
  expectedStaffId: string,
  acknowledgement?: unknown,
): Promise<ImportOutcome<ImportResult>> {
  let diagnostics: ImportValidationError | undefined;
  const result = await runLeadOperation(
    async (headers, markDispatched) => {
      const input = {
        ...leadImportIdentitySchema.parse(identity),
        csv: await decodeImportFile(file),
        ...(acknowledgement !== undefined
          ? {
              duplicateAcknowledgement:
                duplicateAcknowledgementSchema.parse(acknowledgement),
            }
          : {}),
      };
      try {
        const receipt = await requestImport(
          "commit",
          input,
          headers,
          resultSchema,
          markDispatched,
        );
        if (receipt.submissionId !== input.submissionId)
          throw new LeadApiError(
            502,
            "INVALID_RESPONSE",
            "The import response could not be confirmed.",
          );
        return receipt;
      } catch (error) {
        if (error instanceof ImportValidationError) diagnostics = error;
        throw error;
      }
    },
    {
      manager: true,
      expectedStaffId:
        typeof expectedStaffId === "string" ? expectedStaffId : "",
    },
  );
  return !result.ok && diagnostics
    ? {
        ...result,
        issues: diagnostics.issues,
        issueCount: diagnostics.issueCount,
      }
    : fileOutcome(result);
}

function fileOutcome<T>(result: ActionResult<T>): ActionResult<T> {
  return !result.ok && result.error.fieldErrors?.file?.[0]
    ? {
        ...result,
        error: { ...result.error, message: result.error.fieldErrors.file[0] },
      }
    : result;
}
