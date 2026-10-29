import { expect, it } from "vitest";
import { LeadApiError } from "@/features/leads/data/request";
import {
  ViewingApiError,
  viewingReadRecovery,
} from "@/features/viewings/data/request";
it.each([LeadApiError, ViewingApiError])(
  "maps access failures from either appointment or lead reconciliation reads",
  (ErrorType) => {
    expect(
      viewingReadRecovery(new ErrorType(401, "UNAUTHENTICATED", "Expired")),
    ).toBe("login");
    expect(
      viewingReadRecovery(new ErrorType(403, "FORBIDDEN", "Forbidden")),
    ).toBe("inaccessible");
    expect(
      viewingReadRecovery(new ErrorType(404, "NOT_FOUND", "Not found")),
    ).toBe("inaccessible");
    expect(
      viewingReadRecovery(new ErrorType(503, "UNAVAILABLE", "Unavailable")),
    ).toBe("retry");
  },
);
it("keeps network and unknown failures retryable", () => {
  expect(
    viewingReadRecovery(new ViewingApiError(0, "NETWORK_ERROR", "Lost")),
  ).toBe("retry");
  expect(viewingReadRecovery(new Error("Unexpected"))).toBe("retry");
});
