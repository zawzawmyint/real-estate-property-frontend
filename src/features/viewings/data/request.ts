import { ApiError } from "@/lib/api/transport";
import { z } from "zod";
export class ViewingApiError extends ApiError {
  existingViewingId?: string;
}
export function viewingReadRecovery(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) return "login";
    if ([403, 404].includes(error.status)) return "inaccessible";
  }
  return "retry";
}
export async function requestViewing<T>(
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
    throw new ViewingApiError(
      0,
      "NETWORK_ERROR",
      "The response could not be confirmed. Your entries have been preserved.",
    );
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new ViewingApiError(
      response.status,
      body?.error?.code || "API_ERROR",
      response.status === 401
        ? "Your session has expired. Sign in again to continue."
        : response.status >= 500
          ? "The viewing service is unavailable. Try again."
          : body?.error?.message || "The request could not be completed.",
      body?.error?.requestId,
    );
    if (
      response.status === 409 &&
      error.code === "VIEWING_RECEIPT_CONFLICT" &&
      z.uuid().safeParse(body?.error?.existingViewingId).success
    )
      error.existingViewingId = body.error.existingViewingId;
    throw error;
  }
  if (!body || typeof body !== "object")
    throw new ViewingApiError(
      502,
      "INVALID_RESPONSE",
      "The result could not be confirmed.",
    );
  return body as T;
}
