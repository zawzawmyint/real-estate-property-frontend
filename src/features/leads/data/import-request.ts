import "server-only";
import { z } from "zod";
import { getBackendOrigin } from "@/lib/api/server";
import { issueSchema } from "@/lib/csv/import";
import { LeadApiError } from "./request";

export class ImportValidationError extends LeadApiError {
  constructor(
    public issues: z.infer<typeof issueSchema>[],
    public issueCount: number,
    requestId?: string,
  ) {
    super(
      422,
      "IMPORT_VALIDATION_FAILED",
      "Fix every invalid row before importing.",
      requestId,
    );
  }
}

export async function requestImport<T>(
  endpoint: "preview" | "commit",
  input: unknown,
  headers: Record<string, string>,
  schema: z.ZodType<T>,
  markDispatched?: () => void,
): Promise<T> {
  const url = `${getBackendOrigin()}/api/v1/staff/leads/imports/${endpoint}`;
  const body = JSON.stringify(input);
  let response: Response;
  try {
    markDispatched?.();
    response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...headers,
      },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });
  } catch {
    throw new LeadApiError(
      0,
      "NETWORK_ERROR",
      endpoint === "commit"
        ? "The import could not be confirmed. Retry confirmation with the same file."
        : "The preview could not be loaded. Try again.",
    );
  }
  const responseBody: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const details = z
      .object({
        error: z.object({
          code: z.string(),
          message: z.string(),
          requestId: z.string().optional(),
        }),
      })
      .safeParse(responseBody);
    if (
      response.status === 422 &&
      details.success &&
      details.data.error.code === "IMPORT_VALIDATION_FAILED"
    ) {
      const diagnostics = z
        .object({
          issues: z.array(issueSchema).min(1).max(100),
          issueCount: z.number().int().min(1),
        })
        .refine((d) => d.issueCount >= d.issues.length)
        .safeParse(responseBody);
      if (diagnostics.success)
        throw new ImportValidationError(
          diagnostics.data.issues,
          diagnostics.data.issueCount,
          details.data.error.requestId,
        );
    }
    throw new LeadApiError(
      response.status,
      details.success ? details.data.error.code : "API_ERROR",
      response.status === 401
        ? "Your session has expired. Sign in again to continue."
        : response.status === 403
          ? "You do not have permission to import leads."
          : response.status >= 500
            ? endpoint === "commit"
              ? "The import could not be confirmed. Retry confirmation with the same file."
              : "The preview could not be loaded. Try again."
            : details.success
              ? details.data.error.message
              : "The import request could not be completed.",
      details.success ? details.data.error.requestId : undefined,
    );
  }
  const parsed = schema.safeParse(responseBody);
  if (!parsed.success)
    throw new LeadApiError(
      502,
      "INVALID_RESPONSE",
      "The import response could not be confirmed.",
    );
  return parsed.data;
}
