import { ApiError } from "@/lib/api/transport";
import type { DashboardSummary } from "./types";
import { dashboardSchema } from "./schema";

export class DashboardApiError extends ApiError {}

export async function requestDashboard(
  url: string,
  init: RequestInit = {},
): Promise<DashboardSummary> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      cache: "no-store",
      headers: { Accept: "application/json", ...init.headers },
      signal: init.signal ?? AbortSignal.timeout(20000),
    });
  } catch {
    throw new DashboardApiError(
      0,
      "NETWORK_ERROR",
      "The dashboard could not be loaded. Please try again.",
    );
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new DashboardApiError(
      response.status,
      typeof body?.error?.code === "string" ? body.error.code : "API_ERROR",
      response.status === 401
        ? "Your session has expired. Sign in again to continue."
        : response.status === 403
          ? "You do not have access to this overview."
          : "The dashboard is unavailable. Please try again.",
    );
  }
  const parsed = dashboardSchema.safeParse(body);
  if (!parsed.success) {
    throw new DashboardApiError(
      502,
      "INVALID_RESPONSE",
      "The dashboard response could not be confirmed. Please try again.",
    );
  }
  return parsed.data;
}
