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
  previewPropertyImport as previewAction,
  commitPropertyImport as commitAction,
} from "@/features/properties/data/import-actions";
const identity = {
  submissionId: "12b7aaf0-bd6b-4d07-a2e3-a657148c13e7",
  schemaVersion: 1,
  digest: "a".repeat(64),
};
const preview = {
  schemaVersion: 1,
  digest: identity.digest,
  valid: true,
  totalRows: 1,
  validRows: 1,
  issueCount: 0,
  issues: [],
  columns: [
    "title",
    "purpose",
    "type",
    "description",
    "price_aed",
    "city",
    "community",
    "bedrooms",
    "bathrooms",
    "area_sqft",
    "owner_name",
    "owner_phone",
  ],
  previewRows: [
    { rowNumber: 2, values: ["Home", "sale", ...Array(10).fill("")] },
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
    await previewPropertyImport(
      new File(["\uFEFFtitle,purpose\r\nHome,sale"], "a.csv"),
    ),
  ).toEqual({ ok: true, data: preview });
  expect(fetch).toHaveBeenCalledWith(
    "http://localhost:4311/api/v1/staff/properties/imports/preview",
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
    expect((await previewPropertyImport(new File(["x"], "a.csv"))).ok).toBe(
      false,
    );
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
    await commitPropertyImport(new File(["x"], "a.csv"), identity),
  ).toMatchObject({
    ok: false,
    issues,
    issueCount: 150,
    error: { code: "IMPORT_VALIDATION_FAILED", status: 422 },
  });
  vi.mocked(fetch).mockRejectedValueOnce(Error("lost"));
  expect(
    await commitPropertyImport(new File(["x"], "a.csv"), identity),
  ).toMatchObject({ ok: false, error: { uncertain: true } });
});
it.each(["network", "503"])(
  "offers preview recovery after a %s failure without uncertainty or automatic retry",
  async (failure) => {
    if (failure === "network")
      vi.mocked(fetch).mockRejectedValueOnce(Error("connection lost"));
    else
      vi.mocked(fetch).mockResolvedValueOnce(
        Response.json(
          { error: { code: "SERVICE_UNAVAILABLE", message: "Unavailable" } },
          { status: 503 },
        ),
      );

    const result = await previewPropertyImport(new File(["x"], "a.csv"));

    expect(result).toEqual({
      ok: false,
      error: {
        code: failure === "network" ? "NETWORK_ERROR" : "SERVICE_UNAVAILABLE",
        status: failure === "network" ? 0 : 503,
        message: "The preview could not be loaded. Try again.",
      },
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  },
);
it.each(["network", "503"])(
  "preserves uncertain same-file confirmation recovery after a %s failure without automatic retry",
  async (failure) => {
    if (failure === "network")
      vi.mocked(fetch).mockRejectedValueOnce(Error("connection lost"));
    else
      vi.mocked(fetch).mockResolvedValueOnce(
        Response.json(
          { error: { code: "SERVICE_UNAVAILABLE", message: "Unavailable" } },
          { status: 503 },
        ),
      );

    const result = await commitPropertyImport(
      new File(["x"], "a.csv"),
      identity,
    );

    expect(result).toEqual({
      ok: false,
      error: {
        code: failure === "network" ? "NETWORK_ERROR" : "SERVICE_UNAVAILABLE",
        status: failure === "network" ? 0 : 503,
        message:
          "The import could not be confirmed. Retry confirmation with the same file.",
        uncertain: true,
      },
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  },
);
it("rejects malformed successful previews and forged confirmation fields", async () => {
  vi.mocked(fetch).mockResolvedValueOnce(
    Response.json({
      ...preview,
      previewRows: [{ rowNumber: 2, values: ["short"] }],
    }),
  );
  expect(await previewPropertyImport(new File(["x"], "a.csv"))).toMatchObject({
    ok: false,
    error: { code: "INVALID_RESPONSE" },
  });
  vi.mocked(fetch).mockClear();
  expect(
    await commitPropertyImport(new File(["x"], "a.csv"), {
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
      await previewPropertyImport(new File([content], "a.csv"), "staff"),
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
    await previewPropertyImport(new File(["x"], "a.csv"), "staff"),
  ).toMatchObject({ ok: false, error: { code: "SESSION_CHANGED" } });
  expect(
    await commitPropertyImport(new File(["x"], "a.csv"), identity, "staff"),
  ).toMatchObject({ ok: false, error: { code: "SESSION_CHANGED" } });
  expect(fetch).not.toHaveBeenCalled();
});

function previewPropertyImport(file: File, staffId = "staff") {
  return previewAction(file, staffId);
}
function commitPropertyImport(
  file: File,
  identity: unknown,
  staffId = "staff",
) {
  return commitAction(file, identity, staffId);
}
