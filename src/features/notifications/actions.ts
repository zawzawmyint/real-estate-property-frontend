"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { getBackendOrigin, getStaffRequestHeaders } from "@/lib/api/server";
import { getStaffSession } from "@/lib/auth/server";

type ReadResult =
  | { ok: true }
  | { ok: false; error: "session" | "request" | "missing" | "unavailable" };

export async function markNotificationRead(
  id: string,
  accountId: string,
): Promise<ReadResult> {
  try {
    const staff = await getStaffSession();
    const auth = await getStaffRequestHeaders();
    if (!staff || staff.id !== accountId || !auth.Cookie)
      return { ok: false, error: "session" };

    const origin = (await headers()).get("origin");
    if (
      !z.uuid().safeParse(id).success ||
      !origin ||
      !/^https?:\/\//.test(origin) ||
      URL.parse(origin)?.origin !== origin
    ) {
      return { ok: false, error: "request" };
    }

    const response = await fetch(
      `${getBackendOrigin()}/api/v1/staff/notifications/${id}/read`,
      {
        method: "PATCH",
        headers: { ...auth, Origin: origin },
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(5_000),
      },
    );

    if (response.status === 204) return { ok: true };
    if (response.status === 404) return { ok: false, error: "missing" };
    if (response.status === 401) return { ok: false, error: "session" };
    if (response.status === 403) {
      const body = await response.json().catch(() => null);
      return {
        ok: false,
        error: body?.error?.code === "INVALID_ORIGIN" ? "request" : "session",
      };
    }
  } catch {
    // Network failures and uncertain responses can be retried by the user.
  }
  return { ok: false, error: "unavailable" };
}
