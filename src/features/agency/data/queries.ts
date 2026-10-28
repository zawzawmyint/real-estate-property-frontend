import "server-only";
import { cache } from "react";
import { getBackendOrigin } from "@/lib/api/server";
import { ApiError } from "@/lib/api/transport";
import type { PublicAgency, PublicAgentDetail, PublicAgentList } from "./types";

const unavailable =
  "Agency information is temporarily unavailable. Please try again.";

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

async function requestPublicContent<T>(path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${getBackendOrigin()}/api/v1/public/${path}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      credentials: "omit",
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", unavailable);
  }

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = record(body) && record(body.error) ? body.error : {};
    throw new ApiError(
      response.status,
      typeof error.code === "string" ? error.code : "API_ERROR",
      response.status === 404
        ? "This public profile was not found."
        : unavailable,
      typeof error.requestId === "string" ? error.requestId : undefined,
    );
  }
  if (!record(body)) throw new ApiError(502, "INVALID_RESPONSE", unavailable);
  return body as T;
}

export const getPublicAgency = cache(() =>
  requestPublicContent<PublicAgency>("agency"),
);

export const getPublicAgents = cache(() =>
  requestPublicContent<PublicAgentList>("agents"),
);

export const getPublicAgent = cache(async (slug: string) => {
  if (slug.length > 80 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new ApiError(404, "NOT_FOUND", "This public profile was not found.");
  }
  return requestPublicContent<PublicAgentDetail>(
    `agents/${encodeURIComponent(slug)}`,
  );
});
