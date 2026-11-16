"use server";
import type { PropertyActionResult } from "./types";
import { runPropertyMutation } from "./action-boundary";
import { decodeImportFile, importIdentitySchema } from "@/lib/csv/import";
import { requestImport, ImportValidationError } from "./import-request";
import {
  previewSchema,
  resultSchema,
  type ImportOutcome,
  type ImportPreview,
  type ImportResult,
} from "./import-types";
export async function previewPropertyImport(
  file: File,
  expectedStaffId: string,
): Promise<ImportOutcome<ImportPreview>> {
  const result = await runPropertyMutation(
    async (headers) =>
      requestImport(
        "preview",
        { csv: await decodeImportFile(file) },
        headers,
        previewSchema,
      ),
    {
      expectedStaffId:
        typeof expectedStaffId === "string" ? expectedStaffId : "",
    },
  );
  return fileOutcome(result);
}
export async function commitPropertyImport(
  file: File,
  identity: unknown,
  expectedStaffId: string,
): Promise<ImportOutcome<ImportResult>> {
  let diagnostics: ImportValidationError | undefined;
  const result = await runPropertyMutation(
    async (headers) => {
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
        );
        if (receipt.submissionId !== input.submissionId)
          throw Error("Invalid receipt");
        return receipt;
      } catch (error) {
        if (error instanceof ImportValidationError) diagnostics = error;
        throw error;
      }
    },
    {
      create: true,
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

function fileOutcome<T>(
  result: PropertyActionResult<T>,
): PropertyActionResult<T> {
  if (!result.ok && result.error.fieldErrors?.file?.[0])
    return {
      ...result,
      error: { ...result.error, message: result.error.fieldErrors.file[0] },
    };
  return result;
}
