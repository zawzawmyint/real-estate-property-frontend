import "server-only";
import { z } from "zod";
import { headers } from "next/headers";
import { getStaffSession } from "@/lib/auth/server";
import { getBackendOrigin, getStaffRequestHeaders } from "@/lib/api/server";
import { LeadApiError, requestLead } from "./request";
import type { ActionResult } from "./types";

type LeadOperationOptions = {
  manager?: boolean;
  publicHeaders?: Record<string, string>;
  expectedStaffId?: string;
};

export async function runLeadOperation<T>(
  operation: (
    headers: Record<string, string>,
    markDispatched: () => void,
  ) => Promise<T>,
  options: LeadOperationOptions = {},
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
            message: "Only Admins and Managers can perform this action.",
          },
        };
      if (
        options.expectedStaffId !== undefined &&
        staff.id !== options.expectedStaffId
      )
        return {
          ok: false,
          error: {
            code: "SESSION_CHANGED",
            status: 403,
            message:
              "Your staff session changed. Reload this page before importing.",
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
    const data = await operation(
      { ...auth, ...options.publicHeaders, Origin: origin },
      () => {
        dispatched = true;
      },
    );
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

export async function runLeadMutation<T>(
  path: string,
  method: string,
  validate: () => unknown,
  options: LeadOperationOptions = {},
): Promise<ActionResult<T>> {
  return runLeadOperation(async (auth, markDispatched) => {
    const input = validate();
    const url = `${getBackendOrigin()}/api/v1/${path}`;
    const body = JSON.stringify(input);
    markDispatched();
    const data = await requestLead<T>(url, {
      method,
      headers: { ...auth, "Content-Type": "application/json" },
      body,
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
    return data;
  }, options);
}
