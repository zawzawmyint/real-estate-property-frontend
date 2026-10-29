import "server-only";
import { z } from "zod";
import { headers } from "next/headers";
import { getStaffSession } from "@/lib/auth/server";
import { getBackendOrigin, getStaffRequestHeaders } from "@/lib/api/server";
import { requestTask, TaskApiError } from "./request";
import type { TaskEnvelope, TaskActionResult } from "./types";
export async function runTaskMutation(
  path: string,
  method: string,
  validate: () => unknown,
): Promise<TaskActionResult> {
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
    const data = await requestTask<TaskEnvelope>(
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
      typeof data.task?.id !== "string" ||
      !Number.isInteger(data.task.version) ||
      !data.task.lead?.id ||
      !data.task.title ||
      !data.asOf
    )
      throw new TaskApiError(
        502,
        "INVALID_RESPONSE",
        "The saved task could not be confirmed.",
      );
    return { ok: true, data };
  } catch (error) {
    if (error instanceof z.ZodError)
      return {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          status: 400,
          message: "Check the task details and try again.",
        },
      };
    if (error instanceof TaskApiError)
      return {
        ok: false,
        error: {
          code: error.code,
          status: error.status,
          message: error.message,
          ...(error.requestId ? { requestId: error.requestId } : {}),
          ...(error.existingTaskId
            ? { existingTaskId: error.existingTaskId }
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
