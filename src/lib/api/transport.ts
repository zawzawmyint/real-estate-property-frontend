export type HealthResponse = { status: "ok"; service: "real-estate-api" };

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** One concrete contract today; add generated business contracts when endpoints exist. */
export async function requestHealth(
  origin: string,
  timeoutMs = 5_000,
): Promise<HealthResponse> {
  const response = await fetch(`${origin}/api/v1/health`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
  });
  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const error =
      isRecord(body) && isRecord(body.error) ? body.error : undefined;

    throw new ApiError(
      response.status,
      typeof error?.code === "string" ? error.code : "API_ERROR",
      typeof error?.message === "string"
        ? error.message
        : "The agency service is unavailable",
      typeof error?.requestId === "string"
        ? error.requestId
        : (response.headers.get("X-Request-Id") ?? undefined),
    );
  }
  if (
    !isRecord(body) ||
    body.status !== "ok" ||
    body.service !== "real-estate-api"
  )
    throw new Error("Invalid health response from agency service");

  return { status: "ok", service: "real-estate-api" };
}
