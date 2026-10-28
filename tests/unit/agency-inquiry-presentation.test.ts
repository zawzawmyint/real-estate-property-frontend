import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";

vi.mock("@/features/leads/data/actions", () => ({
  sendAgencyInquiry: vi.fn(),
}));

import { AgencyInquiryCard } from "@/features/leads/public/agency-inquiry-card";

it("explains unknown agency mode before collecting contact details without promising follow-up", () => {
  const html = renderToStaticMarkup(
    createElement(AgencyInquiryCard, { isDemo: null, showDemoNotice: false }),
  );
  expect(html).toContain(
    "Agency details and demo status could not be confirmed.",
  );
  expect(html).toContain("before sharing personal contact information");
  expect(html).toContain(
    "If you are testing a demonstration, use fictional details.",
  );
  expect(html).toContain(
    "Submitting this form records the contact details and message you enter.",
  );
  expect(html).not.toContain("Your details will be used to respond");
  expect(html).not.toContain("so we can reply");
  expect(html).not.toContain("This is a demonstration.");
});

it("retains the explicit fictional-details notice in known demo mode", () => {
  const html = renderToStaticMarkup(
    createElement(AgencyInquiryCard, { isDemo: true }),
  );
  expect(html).toContain(
    "This is a demonstration. Please use fictional contact details.",
  );
  expect(html).not.toContain("demo status could not be confirmed");
});

it("keeps known live agency usage copy without an unknown-mode caution", () => {
  const html = renderToStaticMarkup(
    createElement(AgencyInquiryCard, { isDemo: false }),
  );
  expect(html).toContain(
    "Your details will be used to respond to this property enquiry.",
  );
  expect(html).not.toContain("demo status could not be confirmed");
  expect(html).not.toContain("fictional contact details");
});
