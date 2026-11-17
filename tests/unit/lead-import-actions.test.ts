import { afterEach, beforeEach, expect, it, vi } from "vitest";
const boundary = vi.hoisted(() => ({
  session: vi.fn(),
  cookies: vi.fn(),
  headers: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/server", () => ({ getStaffSession: boundary.session }));
vi.mock("next/headers", () => ({
  cookies: boundary.cookies,
  headers: boundary.headers,
}));
import {
  previewLeadImport as previewAction,
  commitLeadImport as commitAction,
} from "@/features/leads/data/import-actions";
const identity = {
  submissionId: "12b7aaf0-bd6b-4d07-a2e3-a657148c13e7",
  schemaVersion: 1,
  digest: "a".repeat(64),
};
const preview = {
  schemaVersion: 2,
  duplicateReview: {
    affectedRows: 0,
    existingMatchRows: 0,
    withinFileRows: 0,
    warningCount: 0,
    warnings: [],
    truncated: false,
    reviewToken: "a".repeat(64),
  },
  digest: identity.digest,
  valid: true,
  totalRows: 1,
  validRows: 1,
  issueCount: 0,
  issues: [],
  columns: ["name", "phone", "email", "purpose", "budget_aed", "source"],
  previewRows: [
    { rowNumber: 2, values: ["Ada", "001234", "", "sale", "", "call"] },
  ],
};
beforeEach(() => {
  vi.clearAllMocks();
  boundary.session.mockResolvedValue({ id: "staff", role: "manager" });
  boundary.cookies.mockResolvedValue({ get: () => ({ value: "signed" }) });
  boundary.headers.mockResolvedValue(
    new Headers({ Origin: "http://localhost:3100" }),
  );
  vi.stubEnv("API_URL", "http://localhost:4311");
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(preview)));
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
it("forwards exact decoded content with allowlisted credentials for managers", async () => {
  expect(
    await previewLeadImport(
      new File(["\uFEFFtitle,purpose\r\nHome,sale"], "a.csv"),
    ),
  ).toEqual({ ok: true, data: preview });
  expect(fetch).toHaveBeenCalledWith(
    "http://localhost:4311/api/v1/staff/leads/imports/preview",
    expect.objectContaining({
      body: JSON.stringify({ csv: "\uFEFFtitle,purpose\r\nHome,sale" }),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Cookie: "agency.session=signed",
        Origin: "http://localhost:3100",
      },
    }),
  );
});
it.each([null, { id: "staff", role: "agent" }])(
  "denies absent sessions and agents before sending CSV",
  async (staff) => {
    boundary.session.mockResolvedValue(staff);
    expect((await previewLeadImport(new File(["x"], "a.csv"))).ok).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  },
);
it("keeps bounded commit diagnostics and marks lost responses uncertain", async () => {
  const issues = [{ rowNumber: 502, column: "title", message: "Required" }];
  vi.mocked(fetch).mockResolvedValueOnce(
    Response.json(
      {
        error: {
          code: "IMPORT_VALIDATION_FAILED",
          message: "Fix every invalid row before importing.",
          requestId: "r",
        },
        issues,
        issueCount: 150,
      },
      { status: 422 },
    ),
  );
  expect(
    await commitLeadImport(new File(["x"], "a.csv"), identity),
  ).toMatchObject({
    ok: false,
    issues,
    issueCount: 150,
    error: { code: "IMPORT_VALIDATION_FAILED", status: 422 },
  });
  vi.mocked(fetch).mockRejectedValueOnce(Error("lost"));
  expect(
    await commitLeadImport(new File(["x"], "a.csv"), identity),
  ).toMatchObject({ ok: false, error: { uncertain: true } });
});
it("rejects malformed successful previews and forged confirmation fields", async () => {
  vi.mocked(fetch).mockResolvedValueOnce(
    Response.json({
      ...preview,
      previewRows: [{ rowNumber: 2, values: ["short"] }],
    }),
  );
  expect(await previewLeadImport(new File(["x"], "a.csv"))).toMatchObject({
    ok: false,
    error: { code: "INVALID_RESPONSE" },
  });
  vi.mocked(fetch).mockClear();
  expect(
    await commitLeadImport(new File(["x"], "a.csv"), {
      ...identity,
      actorId: "other",
    }),
  ).toMatchObject({ ok: false, error: { code: "VALIDATION_ERROR" } });
  expect(fetch).not.toHaveBeenCalled();
});
it.each([
  [new Uint8Array([255]), "Choose a valid UTF-8 CSV file."],
  ["x\0", "CSV must not contain NUL characters."],
  ["", "Choose a nonempty CSV up to 1 MiB."],
])(
  "returns actionable associated file diagnostics",
  async (content, message) => {
    expect(
      await previewLeadImport(new File([content], "a.csv"), "staff"),
    ).toMatchObject({
      ok: false,
      error: { message, fieldErrors: { file: [message] } },
    });
    expect(fetch).not.toHaveBeenCalled();
  },
);
it("rejects a stale tab when another staff member is now signed in", async () => {
  boundary.session.mockResolvedValue({ id: "other", role: "manager" });
  expect(
    await previewLeadImport(new File(["x"], "a.csv"), "staff"),
  ).toMatchObject({ ok: false, error: { code: "SESSION_CHANGED" } });
  expect(
    await commitLeadImport(new File(["x"], "a.csv"), identity, "staff"),
  ).toMatchObject({ ok: false, error: { code: "SESSION_CHANGED" } });
  expect(fetch).not.toHaveBeenCalled();
});

it.each([null, { id: "staff", role: "agent" }])(
  "denies commit for absent sessions and Agents before dispatch",
  async (staff) => {
    boundary.session.mockResolvedValue(staff);
    expect(
      (await commitLeadImport(new File(["x"], "a.csv"), identity)).ok,
    ).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  },
);
it("denies missing credentials and invalid origins for both import operations", async () => {
  for (const failure of ["cookie", "origin"]) {
    boundary.cookies.mockResolvedValue({
      get: () => (failure === "cookie" ? undefined : { value: "signed" }),
    });
    boundary.headers.mockResolvedValue(
      new Headers({
        Origin:
          failure === "origin"
            ? "https://example.com/path"
            : "http://localhost:3100",
      }),
    );
    expect((await previewLeadImport(new File(["x"], "a.csv"))).ok).toBe(false);
    expect(
      (await commitLeadImport(new File(["x"], "a.csv"), identity)).ok,
    ).toBe(false);
  }
  expect(fetch).not.toHaveBeenCalled();
});

function previewLeadImport(file: File, staffId = "staff") {
  return previewAction(file, staffId);
}
function commitLeadImport(file: File, identity: unknown, staffId = "staff") {
  return commitAction(file, identity, staffId);
}

it.each([undefined, null, 12, "", "other"])(
  "fails closed for invalid or changed rendered actor %s in both actions",
  async (staffId) => {
    const file = new File(["x"], "a.csv");
    for (const result of [
      await previewAction(file, staffId as string),
      await commitAction(file, identity, staffId as string),
    ]) {
      expect(result).toMatchObject({
        ok: false,
        error: {
          code: "SESSION_CHANGED",
          message: expect.stringMatching(/staff session changed.*Reload/i),
        },
      });
    }
    expect(fetch).not.toHaveBeenCalled();
  },
);
it("does not imply writes for preview network failures or invalid files", async () => {
  vi.mocked(fetch).mockRejectedValueOnce(Error("offline"));
  const result = await previewLeadImport(new File(["x"], "a.csv"));
  expect(result).toMatchObject({ ok: false, error: { code: "NETWORK_ERROR" } });
  if (!result.ok) expect(result.error.uncertain).toBeUndefined();
  vi.mocked(fetch).mockClear();
  const invalid = await commitLeadImport(new File([""], "a.csv"), identity);
  expect(invalid).toMatchObject({
    ok: false,
    error: { code: "VALIDATION_ERROR" },
  });
  if (!invalid.ok) expect(invalid.error.uncertain).toBeUndefined();
  expect(fetch).not.toHaveBeenCalled();
});
it.each([
  {
    submissionId: identity.submissionId,
    createdCount: 2,
    leadIds: [identity.submissionId],
    replayed: false,
  },
  {
    submissionId: identity.submissionId,
    createdCount: 1,
    leadIds: ["invalid"],
    replayed: false,
  },
  {
    submissionId: "b51c438e-3742-4a8c-8015-92d15be9445e",
    createdCount: 1,
    leadIds: [identity.submissionId],
    replayed: false,
  },
  {
    submissionId: identity.submissionId,
    createdCount: 2,
    leadIds: [identity.submissionId, identity.submissionId],
    replayed: false,
  },
])("treats malformed or mismatched receipts as uncertain", async (receipt) => {
  vi.mocked(fetch).mockResolvedValueOnce(Response.json(receipt));
  expect(
    await commitLeadImport(new File(["x"], "a.csv"), identity),
  ).toMatchObject({
    ok: false,
    error: { code: "INVALID_RESPONSE", uncertain: true },
  });
});
it("accepts a matching receipt and sends no actor or normalized data", async () => {
  const receipt = {
    submissionId: identity.submissionId,
    createdCount: 1,
    leadIds: [identity.submissionId],
    replayed: true,
  };
  vi.mocked(fetch).mockResolvedValueOnce(Response.json(receipt));
  expect(
    await commitLeadImport(new File(["exact\r\n"], "a.csv"), identity),
  ).toEqual({ ok: true, data: receipt });
  expect(fetch).toHaveBeenCalledWith(
    expect.stringContaining("/leads/imports/commit"),
    expect.objectContaining({
      body: JSON.stringify({ ...identity, csv: "exact\r\n" }),
    }),
  );
});
it.each([
  { ...preview, columns: ["name", "email"] },
  { ...preview, totalRows: 501 },
  { ...preview, validRows: 2 },
  { ...preview, valid: false, issueCount: 0 },
  { ...preview, previewRows: [{ rowNumber: 2, values: Array(12).fill("") }] },
])(
  "rejects inconsistent preview contracts without uncertainty",
  async (response) => {
    vi.mocked(fetch).mockResolvedValueOnce(Response.json(response));
    const result = await previewLeadImport(new File(["x"], "a.csv"));
    expect(result).toMatchObject({
      ok: false,
      error: { code: "INVALID_RESPONSE" },
    });
    if (!result.ok) expect(result.error.uncertain).toBeUndefined();
  },
);
it.each([503, 500])(
  "marks dispatched commit %s failures uncertain",
  async (status) => {
    vi.mocked(fetch).mockResolvedValueOnce(Response.json({}, { status }));
    expect(
      await commitLeadImport(new File(["x"], "a.csv"), identity),
    ).toMatchObject({ ok: false, error: { uncertain: true } });
  },
);
it("rejects unbounded and inconsistent validation diagnostics", async () => {
  for (const diagnostics of [
    {
      issues: Array(101).fill({
        rowNumber: 2,
        column: "name",
        message: "Required",
      }),
      issueCount: 101,
    },
    {
      issues: [{ rowNumber: 2, column: "name", message: "Required" }],
      issueCount: 0,
    },
  ]) {
    vi.mocked(fetch).mockResolvedValueOnce(
      Response.json(
        {
          error: { code: "IMPORT_VALIDATION_FAILED", message: "Fix rows" },
          ...diagnostics,
        },
        { status: 422 },
      ),
    );
    const result = await commitLeadImport(new File(["x"], "a.csv"), identity);
    expect(result.ok).toBe(false);
    expect(result).not.toHaveProperty("issues");
  }
});
