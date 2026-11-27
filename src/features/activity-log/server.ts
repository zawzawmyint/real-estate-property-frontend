import "server-only";
import { z } from "zod";
import { getBackendOrigin, getStaffRequestHeaders } from "@/lib/api/server";
import { auditQuery, type AuditFilters } from "./filters";
import { eventsSchema, actorsSchema } from "./response";

async function request<T>(suffix: string, query: string, schema: z.ZodType<T>) {
  const headers = await getStaffRequestHeaders();

  try {
    const response = await fetch(
      getBackendOrigin() + "/api/v1/staff/audit-log" + suffix + "?" + query,
      {
        headers: { Accept: "application/json", ...headers },
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(15000),
      },
    );
    if (!response.ok)
      return {
        status: [400, 401, 403].includes(response.status)
          ? response.status
          : 503,
      } as const;

    const parsed = schema.safeParse(await response.json());
    return parsed.success
      ? ({ data: parsed.data, status: 200 } as const)
      : ({ status: 503 } as const);
  } catch {
    return { status: 503 } as const;
  }
}

export function getEvents(filters: AuditFilters) {
  return request("", auditQuery(filters), eventsSchema);
}

export function getActors(query: string) {
  return request("/actors", query, actorsSchema);
}
