import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  agencyInquiryFormSchema,
  agencyInquirySchema,
} from "@/features/leads/data/input";

const boundary = vi.hoisted(() => ({ headers: vi.fn(), session: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  headers: boundary.headers,
  cookies: vi.fn(),
}));
vi.mock("@/lib/auth/server", () => ({ getStaffSession: boundary.session }));
import { sendAgencyInquiry } from "@/features/leads/data/actions";

const input = {
  submissionId: "206ba2a9-3ee6-467c-8c28-dc2b7dca63ef",
  name: "  Ada  ",
  purpose: "rent" as const,
  email: "ADA@example.com",
  phone: null,
  message: "  Looking for an apartment.  ",
};
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("API_URL", "http://localhost:4311");
  vi.stubEnv("INQUIRY_RELAY_SECRET", "test-only-agency-inquiry-relay-secret");
  vi.stubEnv("INQUIRY_TRUSTED_CLIENT_HEADER", "");
  boundary.headers.mockResolvedValue(
    new Headers({
      Origin: "http://localhost:3100",
      "x-forwarded-for": "127.0.0.1",
    }),
  );
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(Response.json({ received: true })),
  );
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

it("requires explicit intent, message and a usable contact on the contact form", () => {
  const values = {
    name: "Ada",
    purpose: "sale",
    phone: "",
    email: "ada@example.com",
    message: "Looking to buy.",
  };
  expect(agencyInquiryFormSchema.safeParse(values).success).toBe(true);
  for (const invalid of [
    { ...values, purpose: "" },
    { ...values, message: " " },
    { ...values, email: "" },
    { ...values, phone: "abc", email: "" },
  ])
    expect(agencyInquiryFormSchema.safeParse(invalid).success).toBe(false);
});

it("rejects client routing/property fields and normalizes safe inquiry values", () => {
  expect(agencyInquirySchema.parse(input)).toEqual({
    ...input,
    name: "Ada",
    email: "ada@example.com",
    message: "Looking for an apartment.",
  });
  for (const extra of [
    { assignedAgentId: "agent" },
    { propertyId: "property" },
    { source: "call" },
    { stage: "won" },
  ])
    expect(agencyInquirySchema.safeParse({ ...input, ...extra }).success).toBe(
      false,
    );
});

it.each([
  ["non-breaking spaces", "\u00a0", " "],
  ["narrow non-breaking spaces", "\u202f", " "],
  ["figure spaces", "\u2007", " "],
  ["tabs", "\t", " "],
  ["line breaks", "\r\n", "  "],
])(
  "normalizes pasted phone %s in form and action inputs",
  (_, separator, normalized) => {
    const phone = ` \u00a0+971${separator}50${separator}123${separator}4567\u202f `;
    const expected = `+971${normalized}50${normalized}123${normalized}4567`;
    expect(
      agencyInquiryFormSchema.parse({ ...input, phone, email: "" }).phone,
    ).toBe(expected);
    expect(
      agencyInquirySchema.parse({ ...input, phone, email: null }).phone,
    ).toBe(expected);
  },
);

it.each([
  "\u00a0\u202f\t",
  "+--",
  "+971\u200b501234567",
  "123abc",
  "1".repeat(41),
])("rejects unusable phone input %j after normalization", (phone) => {
  expect(
    agencyInquiryFormSchema.safeParse({ ...input, phone, email: "" }).success,
  ).toBe(false);
  expect(
    agencyInquirySchema.safeParse({ ...input, phone, email: null }).success,
  ).toBe(false);
});

it("dispatches the normalized phone for a phone-only enquiry", async () => {
  expect(
    await sendAgencyInquiry({
      ...input,
      phone: "+971\u00a050\u202f123\u20074567",
      email: null,
    }),
  ).toMatchObject({ ok: true });
  const [, init] = vi.mocked(fetch).mock.calls[0]!;
  expect(JSON.parse(String((init as RequestInit).body))).toMatchObject({
    phone: "+971 50 123 4567",
    email: null,
  });
});

it("sends the anonymous inquiry through trusted relay without a staff session or cookie", async () => {
  expect(await sendAgencyInquiry(input)).toEqual({
    ok: true,
    data: { received: true },
  });
  const [url, init] = vi.mocked(fetch).mock.calls[0]!;
  expect(url).toBe("http://localhost:4311/api/v1/public/inquiries");
  const options = init as RequestInit;
  expect(JSON.parse(String(options.body))).toEqual({
    ...input,
    name: "Ada",
    email: "ada@example.com",
    message: "Looking for an apartment.",
  });
  expect(options.headers).not.toHaveProperty("Cookie");
  expect(options.headers).toHaveProperty("x-inquiry-relay-signature");
  expect(boundary.session).not.toHaveBeenCalled();
});

it("keeps uncertain responses explicit and preserves server Retry-After", async () => {
  vi.mocked(fetch).mockRejectedValueOnce(new Error("connection lost"));
  expect(await sendAgencyInquiry(input)).toMatchObject({
    ok: false,
    error: { uncertain: true },
  });
  expect(fetch).toHaveBeenCalledTimes(1);
  vi.mocked(fetch).mockResolvedValueOnce(
    Response.json(
      { error: { code: "RATE_LIMITED", message: "Try later" } },
      { status: 429, headers: { "Retry-After": "42" } },
    ),
  );
  expect(await sendAgencyInquiry(input)).toMatchObject({
    ok: false,
    error: { status: 429, retryAfter: 42 },
  });
});

it("fails safely before dispatch when relay configuration is unavailable", async () => {
  vi.stubEnv("INQUIRY_RELAY_SECRET", "");
  expect(await sendAgencyInquiry(input)).toMatchObject({
    ok: false,
    error: { status: 503 },
  });
  expect(fetch).not.toHaveBeenCalled();
});
