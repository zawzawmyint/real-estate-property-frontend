import "server-only";
import { z } from "zod";
import { getBackendOrigin } from "@/lib/api/server";
import { PropertyApiError } from "./request";
import { issueSchema } from "@/lib/csv/import";
export class ImportValidationError extends PropertyApiError {
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
): Promise<T> {
  const retryMessage =
    endpoint === "commit"
      ? "The import could not be confirmed. Retry confirmation with the same file."
      : "The preview could not be loaded. Try again.";
  let response: Response;
  try {
    response = await fetch(
      `${getBackendOrigin()}/api/v1/staff/properties/imports/${endpoint}`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify(input),
        cache: "no-store",
        signal: AbortSignal.timeout(20000),
      },
    );
  } catch {
    throw new PropertyApiError(0, "NETWORK_ERROR", retryMessage);
  }
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const details = z
      .object({
        error: z.object({
          code: z.string(),
          message: z.string(),
          requestId: z.string().optional(),
        }),
      })
      .safeParse(body);
    if (
      response.status === 422 &&
      details.success &&
      details.data.error.code === "IMPORT_VALIDATION_FAILED"
    ) {
      const diagnostics = z
        .object({
          issues: z.array(issueSchema).max(100),
          issueCount: z.number().int().min(1),
        })
        .safeParse(body);
      if (diagnostics.success)
        throw new ImportValidationError(
          diagnostics.data.issues,
          diagnostics.data.issueCount,
          details.data.error.requestId,
        );
    }
    throw new PropertyApiError(
      response.status,
      details.success ? details.data.error.code : "API_ERROR",
      response.status === 401
        ? "Your session has expired. Sign in again to continue."
        : response.status === 403
          ? "You do not have permission to import properties."
          : response.status >= 500
            ? retryMessage
            : details.success
              ? details.data.error.message
              : "The import request could not be completed.",
      details.success ? details.data.error.requestId : undefined,
    );
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    throw new PropertyApiError(
      502,
      "INVALID_RESPONSE",
      "The import response could not be confirmed.",
    );
  return parsed.data;
}
