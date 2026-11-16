"use server";
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
): Promise<ImportOutcome<ImportResult>> {
  let diagnostics: ImportValidationError | undefined;
  const result = await runLeadOperation(
    async (headers, markDispatched) => {
      const input = {
        ...importIdentitySchema.parse(identity),
        csv: await decodeImportFile(file),
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
