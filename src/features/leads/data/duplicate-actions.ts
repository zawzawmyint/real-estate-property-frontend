"use server";
import { z } from "zod";
import { getBackendOrigin } from "@/lib/api/server";
import { runLeadOperation } from "./action-boundary";
import { duplicateReviewSchema } from "./duplicate-types";
import { LeadApiError, requestLead } from "./request";

export async function checkLeadDuplicates(input: unknown) {
  return runLeadOperation(async (headers) => {
    const body = z
      .strictObject({
        phone: z.string().trim().min(3).max(40),
        excludeLeadId: z.uuid().optional(),
      })
      .parse(input);
    const data = await requestLead<unknown>(
      `${getBackendOrigin()}/api/v1/staff/leads/duplicate-check`,
      {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    const parsed = duplicateReviewSchema.safeParse(data);
    if (!parsed.success)
      throw new LeadApiError(
        502,
        "INVALID_RESPONSE",
        "Matching leads could not be checked. Retry the check.",
      );
    return parsed.data;
  });
}
