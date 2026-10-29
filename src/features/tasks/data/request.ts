import { ApiError } from "@/lib/api/transport";
import { z } from "zod";
export class TaskApiError extends ApiError {
  existingTaskId?: string;
}
export function taskReadRecovery(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) return "login";
    if ([403, 404].includes(error.status)) return "inaccessible";
  }
  return "retry";
}
export async function requestTask<T>(
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
    throw new TaskApiError(
      0,
      "NETWORK_ERROR",
      "The response could not be confirmed. Your entries have been preserved.",
    );
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new TaskApiError(
      response.status,
      body?.error?.code || "API_ERROR",
      response.status === 401
        ? "Your session has expired. Sign in again to continue."
        : response.status >= 500
          ? "The task service is unavailable. Try again."
          : body?.error?.message || "The request could not be completed.",
      body?.error?.requestId,
    );
    if (
      response.status === 409 &&
      error.code === "TASK_RECEIPT_CONFLICT" &&
      z.uuid().safeParse(body?.error?.existingTaskId).success
    )
      error.existingTaskId = body.error.existingTaskId;
    throw error;
  }
  if (!body || typeof body !== "object")
    throw new TaskApiError(
      502,
      "INVALID_RESPONSE",
      "The result could not be confirmed.",
    );
  return body as T;
}
