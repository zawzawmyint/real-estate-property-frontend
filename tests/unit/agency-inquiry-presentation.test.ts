import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";

vi.mock("@/features/leads/data/actions", () => ({
  sendAgencyInquiry: vi.fn(),
}));

import { AgencyInquiryCard } from "@/features/leads/public/agency-inquiry-card";

it("keeps Contact's native intent select and unselected prompt by default", () => {
  const html = renderToStaticMarkup(
    createElement(AgencyInquiryCard, { isDemo: false }),
  );

  expect(html).toContain("Send a property enquiry");
  expect(html).toMatch(
    /<select(?=[^>]*id="agency-purpose")(?=[^>]*name="purpose")[^>]*>/,
  );
  expect(html).toContain('<option value="" disabled="" selected="">');
  expect(html).not.toContain('type="radio"');
  expect(html).toMatch(/<textarea[^>]*rows="3"/);
});

it("offers labelled, initially unselected Buy/Rent radios in the directory", () => {
  const html = renderToStaticMarkup(
    createElement(AgencyInquiryCard, {
      isDemo: false,
      presentation: "directory",
    }),
  );

  expect(html).toContain("Enquiry with our agency.");
  expect(html).toContain("I&#x27;m looking to");
  expect(html).toContain('for="agency-purpose"');
  expect(html).toContain('for="agency-purpose-rent"');
  expect(html).toMatch(
    /<input[^>]*id="agency-purpose"[^>]*type="radio"[^>]*name="purpose"[^>]*value="sale"/,
  );
  expect(html).toMatch(
    /<input[^>]*id="agency-purpose-rent"[^>]*type="radio"[^>]*name="purpose"[^>]*value="rent"/,
  );
  expect(html).not.toContain("checked=");
  expect(html).not.toContain("<select");
});

it.each(["contact", "directory"] as const)(
  "%s keeps one native form, stable labels and pre-hydration submission guards",
  (presentation) => {
    const html = renderToStaticMarkup(
      createElement(AgencyInquiryCard, { isDemo: true, presentation }),
    );

    expect(html.match(/<form\b/g)).toHaveLength(1);
    for (const name of ["name", "phone", "email", "message"])
      expect(html).toContain(`name="${name}"`);
    for (const id of ["name", "phone", "email", "message"])
      expect(html).toContain(`for="agency-${id}"`);
    expect(html).toMatch(/<fieldset disabled=""/);
    expect(html).toMatch(
      /<button(?=[^>]*disabled="")(?=[^>]*type="submit")[^>]*>/,
    );
    expect(html).toContain('aria-describedby="agency-contact-help"');
    const ids = Array.from(html.matchAll(/\sid="([^"]+)"/g), ([, id]) => id);
    expect(new Set(ids).size).toBe(ids.length);
  },
);

it.each(["contact", "directory"] as const)(
  "%s explains unknown agency mode before collecting contact details without promising follow-up",
  (presentation) => {
    const html = renderToStaticMarkup(
      createElement(AgencyInquiryCard, {
        isDemo: null,
        showDemoNotice: false,
        presentation,
      }),
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
  },
);

it.each(["contact", "directory"] as const)(
  "%s retains the explicit fictional-details notice in known demo mode",
  (presentation) => {
    const html = renderToStaticMarkup(
      createElement(AgencyInquiryCard, { isDemo: true, presentation }),
    );
    expect(html).toContain(
      "This is a demonstration. Please use fictional contact details.",
    );
    expect(html).not.toContain("demo status could not be confirmed");
  },
);

it.each(["contact", "directory"] as const)(
  "%s keeps known live agency usage copy without an unknown-mode caution",
  (presentation) => {
    const html = renderToStaticMarkup(
      createElement(AgencyInquiryCard, { isDemo: false, presentation }),
    );
    expect(html).toContain(
      "Your details will be used to respond to this property enquiry.",
    );
    expect(html).not.toContain("demo status could not be confirmed");
    expect(html).not.toContain("fictional contact details");
  },
);
