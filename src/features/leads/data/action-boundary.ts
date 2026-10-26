import "server-only";
import { z } from "zod";
import { headers } from "next/headers";
import { getStaffSession } from "@/lib/auth/server";
import { getBackendOrigin, getStaffRequestHeaders } from "@/lib/api/server";
import { LeadApiError, requestLead } from "./request";
import type { ActionResult } from "./types";

export async function runLeadMutation<T>(
  path: string,
  method: string,
  validate: () => unknown,
  options: {
    manager?: boolean;
    publicHeaders?: Record<string, string>;
    receipt?: boolean;
  } = {},
): Promise<ActionResult<T>> {
  let dispatched = false;
  try {
    let auth: Record<string, string> = {};
    if (!options.publicHeaders) {
      const staff = await getStaffSession();
      if (!staff)
        return {
          ok: false,
          error: {
            code: "UNAUTHENTICATED",
            status: 401,
            message: "Your session has expired. Sign in again to continue.",
          },
        };
      if (options.manager && staff.role === "agent")
        return {
          ok: false,
          error: {
            code: "FORBIDDEN",
            status: 403,
            message: "Only Admins and Managers can assign leads.",
          },
        };
      auth = await getStaffRequestHeaders();
      if (!auth.Cookie)
        return {
          ok: false,
          error: {
            code: "UNAUTHENTICATED",
            status: 401,
            message: "Your session has expired. Sign in again to continue.",
          },
        };
    }
    const origin = (await headers()).get("origin");
    if (
      !origin ||
      !/^https?:\/\//.test(origin) ||
      new URL(origin).origin !== origin
    )
      return {
        ok: false,
        error: {
          code: "INVALID_ORIGIN",
          status: 403,
          message:
            "The request origin could not be verified. Reload and try again.",
        },
      };
    const input = validate();
    dispatched = true;
    const data = await requestLead<T>(`${getBackendOrigin()}/api/v1/${path}`, {
      method,
      headers: {
        ...auth,
        ...options.publicHeaders,
        Origin: origin,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });
    if (
      path.startsWith("staff/leads") &&
      !path.endsWith("/notes") &&
      (typeof (data as { id?: unknown }).id !== "string" ||
        !Number.isInteger((data as { version?: unknown }).version))
    )
      throw new LeadApiError(
        502,
        "INVALID_RESPONSE",
        "The saved lead could not be confirmed.",
      );
    if (
      path.startsWith("public/") &&
      (data as { received?: unknown }).received !== true
    )
      throw new LeadApiError(
        502,
        "INVALID_RESPONSE",
        "The inquiry could not be confirmed.",
      );
    if (path.endsWith("/notes")) {
      const result = data as { note?: { id?: unknown }; leadVersion?: unknown };
      if (
        typeof result.note?.id !== "string" ||
        !Number.isInteger(result.leadVersion)
      )
        throw new LeadApiError(
          502,
          "INVALID_RESPONSE",
          "The saved entry could not be confirmed.",
        );
    }
    return { ok: true, data };
  } catch (error) {
    if (error instanceof z.ZodError)
      return {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          status: 400,
          message: "Check the highlighted fields and try again.",
          fieldErrors: z.flattenError(error).fieldErrors,
        },
      };
    if (error instanceof LeadApiError)
      return {
        ok: false,
        error: {
          code: error.code,
          status: error.status,
          message: error.message,
          ...(error.requestId ? { requestId: error.requestId } : {}),
          ...(error.retryAfter ? { retryAfter: error.retryAfter } : {}),
          ...(dispatched && (error.status === 0 || error.status >= 500)
            ? { uncertain: true }
            : {}),
        },
      };
    return {
      ok: false,
      error: {
        code: "SERVICE_UNAVAILABLE",
        message:
          "The lead service is unavailable. Your entries have been preserved.",
        ...(dispatched ? { uncertain: true } : {}),
      },
    };
  }
}
