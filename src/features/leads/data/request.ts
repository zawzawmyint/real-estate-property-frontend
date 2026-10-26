import { ApiError } from "@/lib/api/transport";
export class LeadApiError extends ApiError {
  constructor(
    status: number,
    code: string,
    message: string,
    requestId?: string,
    public readonly retryAfter?: number,
  ) {
    super(status, code, message, requestId);
  }
}
export async function requestLead<T>(
  url: string,
  init: RequestInit = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      cache: "no-store",
      credentials: "same-origin",
      headers: { Accept: "application/json", ...init.headers },
      signal: init.signal ?? AbortSignal.timeout(20000),
    });
  } catch {
    throw new LeadApiError(
      0,
      "NETWORK_ERROR",
      "The response could not be confirmed. Your entries have been preserved.",
    );
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const error = body?.error;
    throw new LeadApiError(
      response.status,
      typeof error?.code === "string" ? error.code : "API_ERROR",
      response.status === 401
        ? "Your session has expired. Sign in again to continue."
        : response.status >= 500
          ? "The lead service is unavailable. Please try again."
          : typeof error?.message === "string"
            ? error.message
            : "The request could not be completed.",
      typeof error?.requestId === "string" ? error.requestId : undefined,
      Number(response.headers.get("Retry-After")) || undefined,
    );
  }
  if (!body || typeof body !== "object")
    throw new LeadApiError(
      502,
      "INVALID_RESPONSE",
      "The response could not be confirmed.",
    );
  return body as T;
}
