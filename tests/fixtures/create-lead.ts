import { expect, type APIRequestContext } from "@playwright/test";

/** Fixture setup deliberately creates separate leads, acknowledging real guards. */
export async function createReviewedLead(
  request: APIRequestContext,
  options: { headers: Record<string, string>; data: Record<string, unknown> },
) {
  let response = await request.post("/api/v1/staff/leads", options);
  for (let attempt = 0; attempt < 3 && response.status() === 409; attempt++) {
    const conflict = await response.json();
    if (conflict.error?.code !== "LEAD_DUPLICATE_REVIEW_REQUIRED") break;
    expect(typeof conflict.duplicateReview?.reviewToken).toBe("string");
    response = await request.post("/api/v1/staff/leads", {
      ...options,
      data: {
        ...options.data,
        duplicateAcknowledgement: {
          reviewToken: conflict.duplicateReview.reviewToken,
        },
      },
    });
  }
  return response;
}
