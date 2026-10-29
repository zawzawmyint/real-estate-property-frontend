import "server-only";
import { z } from "zod";
import { headers } from "next/headers";
import { getStaffSession } from "@/lib/auth/server";
import { getBackendOrigin, getStaffRequestHeaders } from "@/lib/api/server";
import { requestViewing, ViewingApiError } from "./request";
import type { Viewing, ViewingResult } from "./types";
export async function runViewingMutation(
  path: string,
  method: string,
  validate: () => unknown,
): Promise<ViewingResult> {
  let dispatched = false;
  try {
    if (!(await getStaffSession()))
      return {
        ok: false,
        error: {
          code: "UNAUTHENTICATED",
          status: 401,
          message: "Your session has expired. Sign in again to continue.",
        },
      };
    const auth = await getStaffRequestHeaders();
    if (!auth.Cookie)
      return {
        ok: false,
        error: {
          code: "UNAUTHENTICATED",
          status: 401,
          message: "Your session has expired. Sign in again to continue.",
        },
      };
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
          message: "Reload this page before trying again.",
        },
      };
    const input = validate();
    dispatched = true;
    const data = await requestViewing<Viewing>(
      `${getBackendOrigin()}/api/v1/${path}`,
      {
        method,
        headers: {
          ...auth,
          Origin: origin,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      },
    );
    if (
      typeof data.id !== "string" ||
      !Number.isInteger(data.version) ||
      !data.lead?.id ||
      !data.property?.id
    )
      throw new ViewingApiError(
        502,
        "INVALID_RESPONSE",
        "The saved viewing could not be confirmed.",
      );
    return { ok: true, data };
  } catch (error) {
    if (error instanceof z.ZodError)
      return {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          status: 400,
          message: "Check the viewing details and try again.",
        },
      };
    if (error instanceof ViewingApiError)
      return {
        ok: false,
        error: {
          code: error.code,
          status: error.status,
          message: error.message,
          ...(error.requestId ? { requestId: error.requestId } : {}),
          ...(error.existingViewingId
            ? { existingViewingId: error.existingViewingId }
            : {}),
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
          "The result could not be confirmed. Your entries have been preserved.",
        ...(dispatched ? { uncertain: true } : {}),
      },
    };
  }
}
