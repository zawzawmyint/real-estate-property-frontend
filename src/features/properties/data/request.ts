import { ApiError } from "@/lib/api/transport";
import type { StaffProperty } from "./types";

export class PropertyApiError extends ApiError {}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

export async function requestProperty<T>(
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
      signal: init.signal ?? AbortSignal.timeout(20_000),
    });
  } catch {
    throw new PropertyApiError(
      0,
      "NETWORK_ERROR",
      "The property service could not be reached. Check the saved record before retrying a change.",
    );
  }

  if (response.status === 204) return undefined as T;

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const error = record(body) && record(body.error) ? body.error : {};
    const code = typeof error.code === "string" ? error.code : "API_ERROR";
    const message =
      response.status === 401
        ? "Your session has expired. Sign in again to continue."
        : response.status === 403
          ? "You do not have permission to perform this action."
          : response.status >= 500
            ? "The property service is unavailable. Please try again."
            : typeof error.message === "string"
              ? error.message
              : "The request could not be completed.";

    throw new PropertyApiError(
      response.status,
      code,
      message,
      typeof error.requestId === "string" ? error.requestId : undefined,
    );
  }
  if (!record(body))
    throw new PropertyApiError(
      502,
      "INVALID_RESPONSE",
      "The property service returned an invalid response.",
    );

  return body as T;
}

export async function requestStaffProperty(
  url: string,
  init: RequestInit = {},
) {
  const property = await requestProperty<StaffProperty>(url, init);

  // A malformed 2xx create is uncertain: never navigate to an undefined ID or
  // let a retry silently create a duplicate record.
  if (
    !record(property) ||
    typeof property.id !== "string" ||
    !property.id ||
    typeof property.title !== "string" ||
    !Array.isArray(property.photos) ||
    !["draft", "published", "archived"].includes(property.publishingState)
  ) {
    throw new PropertyApiError(
      502,
      "INVALID_RESPONSE",
      "The saved property could not be confirmed. Check inventory before retrying.",
    );
  }

  return property;
}
