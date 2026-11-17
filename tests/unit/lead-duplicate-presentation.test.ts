import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { LeadDuplicateWarning } from "@/features/leads/crm/lead-duplicate-warning";
import { LeadImportDuplicateWarning } from "@/features/leads/crm/lead-import-duplicate-warning";
import { LeadDuplicatePanel } from "@/features/leads/crm/lead-duplicate-panel";
const match = {
  id: "12b7aaf0-bd6b-4d07-a2e3-a657148c13e7",
  name: "Existing buyer",
  phone: "0501234567",
  stage: "new" as const,
  assignedAgent: null,
};
it("preserves drafts and files when reviewing matches and announces warnings politely", () => {
  const review = {
    canonicalPhone: "+971501234567",
    totalMatches: 1,
    matches: [match],
    truncated: false,
    reviewToken: "a".repeat(64),
  };
  const single = renderToStaticMarkup(
    createElement(LeadDuplicateWarning, { review }),
  );
  const batch = renderToStaticMarkup(
    createElement(LeadImportDuplicateWarning, {
      review: {
        affectedRows: 1,
        existingMatchRows: 1,
        withinFileRows: 0,
        warningCount: 1,
        warnings: [
          {
            rowNumber: 2,
            canonicalPhone: review.canonicalPhone,
            existingMatchCount: 1,
            matches: [match],
            sameFileRowNumbers: [],
            sameFileRowCount: 0,
          },
        ],
        truncated: false,
        reviewToken: review.reviewToken,
      },
      acknowledged: false,
      onChange: () => {},
      disabled: false,
    }),
  );
  for (const html of [single, batch]) {
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('role="status"');
    expect(html).not.toContain('role="alert"');
  }
});
it("does not claim zero matches before checking an ambiguous legacy phone", () => {
  const html = renderToStaticMarkup(
    createElement(LeadDuplicatePanel, {
      id: match.id,
      phone: "123",
      count: 0,
      disabled: true,
    }),
  );
  expect(html).not.toContain("0 possible matches");
  expect(html).toContain("Older phone numbers may need correction");
});
