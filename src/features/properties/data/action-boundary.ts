import "server-only";
import { z } from "zod";
import { headers } from "next/headers";
import { getStaffSession } from "@/lib/auth/server";
import { getStaffRequestHeaders } from "@/lib/api/server";
import { PropertyApiError } from "./request";
import type { PropertyActionResult } from "./types";

export async function runPropertyMutation<T>(
  operation: (staffHeaders: Record<string, string>) => Promise<T>,
  options: { create?: boolean; adminOnly?: boolean } = {},
): Promise<PropertyActionResult<T>> {
  let dispatched = false;

  try {
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
    if (staff.role === "agent" || (options.adminOnly && staff.role !== "admin"))
      return {
        ok: false,
        error: {
          code: "FORBIDDEN",
          status: 403,
          message: "You do not have permission to perform this action.",
        },
      };

    const origin = (await headers()).get("origin");

    // Next checks action origins; Express also requires its configured exact
    // APP_ORIGIN. Forward that one header, never an arbitrary browser header set.
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
            "The request origin could not be verified. Reload the page and try again.",
        },
      };

    const staffHeaders = await getStaffRequestHeaders();

    if (!staffHeaders.Cookie)
      return {
        ok: false,
        error: {
          code: "UNAUTHENTICATED",
          status: 401,
          message: "Your session has expired. Sign in again to continue.",
        },
      };

    dispatched = true;

    return {
      ok: true,
      data: await operation({ ...staffHeaders, Origin: origin }),
    };
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
    if (error instanceof PropertyApiError)
      return {
        ok: false,
        error: {
          code: error.code,
          message: error.message,
          status: error.status,
          ...(error.requestId ? { requestId: error.requestId } : {}),
          ...(options.create &&
          dispatched &&
          (error.status === 0 || error.status >= 500)
            ? { uncertain: true }
            : {}),
        },
      };

    return {
      ok: false,
      error: {
        code: "SERVICE_UNAVAILABLE",
        message: "The property service is unavailable. Please try again.",
        ...(options.create && dispatched ? { uncertain: true } : {}),
      },
    };
  }
}
