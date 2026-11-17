import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
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
  recoverLeadImport,
  commitLeadImport,
} from "@/features/leads/data/import-actions";
const csv = "name,phone,purpose,source\nAda,0501234567,sale,call";
const identity = {
  submissionId: "12b7aaf0-bd6b-4d07-a2e3-a657148c13e7",
  schemaVersion: 1,
  digest: createHash("sha256")
    .update("lead-import:v1\0" + csv)
    .digest("hex"),
};
beforeEach(() => {
  boundary.session.mockResolvedValue({ id: "staff", role: "manager" });
  boundary.cookies.mockResolvedValue({ get: () => ({ value: "signed" }) });
  boundary.headers.mockResolvedValue(
    new Headers({ Origin: "http://localhost:3100" }),
  );
  vi.stubEnv("API_URL", "http://localhost:4311");
  vi.stubGlobal("fetch", vi.fn());
});
afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
it("retries the original committed v1 identity before any upgraded preview", async () => {
  vi.mocked(fetch).mockResolvedValueOnce(
    Response.json({
      submissionId: identity.submissionId,
      createdCount: 1,
      leadIds: [identity.submissionId],
      replayed: true,
    }),
  );
  expect(
    await recoverLeadImport(new File([csv], "leads.csv"), identity, "staff"),
  ).toMatchObject({ ok: true, data: { replayed: true } });
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(fetch).toHaveBeenCalledWith(
    expect.stringContaining("/imports/commit"),
    expect.objectContaining({ body: JSON.stringify({ ...identity, csv }) }),
  );
});
it("does not send an unmatched file or silently create a new identity", async () => {
  expect(
    await recoverLeadImport(
      new File([csv + "\n"], "changed.csv"),
      identity,
      "staff",
    ),
  ).toMatchObject({
    ok: false,
    error: { code: "IMPORT_RECOVERY_FILE_MISMATCH" },
  });
  expect(fetch).not.toHaveBeenCalled();
});
it("keeps lost legacy recovery uncertain and does not preview automatically", async () => {
  vi.mocked(fetch).mockRejectedValueOnce(Error("lost"));
  expect(
    await recoverLeadImport(new File([csv], "leads.csv"), identity, "staff"),
  ).toMatchObject({ ok: false, error: { uncertain: true } });
  expect(fetch).toHaveBeenCalledTimes(1);
});
it("forwards a v2 acknowledgement without altering business identity", async () => {
  vi.mocked(fetch).mockResolvedValueOnce(
    Response.json({
      submissionId: identity.submissionId,
      createdCount: 1,
      leadIds: [identity.submissionId],
      replayed: false,
    }),
  );
  await commitLeadImport(
    new File([csv], "leads.csv"),
    { ...identity, schemaVersion: 2 },
    "staff",
    { reviewToken: "a".repeat(64) },
  );
  expect(fetch).toHaveBeenCalledWith(
    expect.stringContaining("/imports/commit"),
    expect.objectContaining({
      body: JSON.stringify({
        ...identity,
        schemaVersion: 2,
        csv,
        duplicateAcknowledgement: { reviewToken: "a".repeat(64) },
      }),
    }),
  );
});
