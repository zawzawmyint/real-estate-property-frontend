import openapiTS from "openapi-typescript";
import { expect, it } from "vitest";

type PhoneContract = {
  type?: unknown;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  description?: string;
};

it.each([
  { domain: "public-agency", names: ["PublicAgency", "PublicAgentDetail"] },
  {
    domain: "leads",
    names: [
      "LeadSummary",
      "LeadDetail",
      "AgencyInquiryInput",
      "InquiryInput",
      "LeadCreateInput",
      "LeadPatchInput",
    ],
  },
])(
  "keeps $domain phone contracts consistent with canonical validation",
  async ({ domain, names }) => {
    const phones = new Map<string, PhoneContract>();
    await openapiTS(
      new URL(`../../docs/contracts/${domain}.openapi.yaml`, import.meta.url),
      {
        transform(schema, metadata) {
          const match = metadata.path?.match(
            /^#\/components\/schemas\/([^/]+)\/(?:phone|publicPhone)$/,
          );
          const name = match?.[1];
          if (name && !phones.has(name))
            phones.set(name, structuredClone(schema));
          return undefined;
        },
      },
    );
    for (const name of names) {
      const phone = phones.get(name)!;
      expect(phone, name).toBeDefined();
      expect(phone.type).toEqual(["string", "null"]);
      expect(phone.minLength).toBe(3);
      const pattern = new RegExp(phone.pattern!);
      expect(pattern.test("+971  50-123")).toBe(true);
      for (const invalid of ["abc123", "+ () -", "+971.50", "+971\u200b50"])
        expect(pattern.test(invalid), invalid).toBe(false);
      if (name.endsWith("Input")) {
        expect(phone.maxLength).toBeUndefined();
        expect(phone.description).toContain("JavaScript whitespace");
        expect(pattern.test("\t+971\u00a0\u202f50-123\n")).toBe(true);
      } else {
        expect(phone.maxLength).toBe(40);
        expect(phone.description).toContain("digit");
        expect(pattern.test("+971\u00a050-123")).toBe(false);
      }
    }
  },
);
