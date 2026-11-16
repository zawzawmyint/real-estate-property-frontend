import { expect, it } from "vitest";
import { decodeImportFile } from "@/lib/csv/import";
import {
  recoverPending,
  chooseIdentity,
} from "@/components/crm/csv-import-state";
const identity = {
  submissionId: "12b7aaf0-bd6b-4d07-a2e3-a657148c13e7",
  digest: "a".repeat(64),
  schemaVersion: 1 as const,
};
it("preserves exact UTF-8 BOM bytes and rejects malformed encoding and NUL", async () => {
  expect(
    await decodeImportFile(
      new File([new Uint8Array([239, 187, 191, 97])], "a.csv"),
    ),
  ).toBe("\uFEFFa");
  await expect(
    decodeImportFile(new File([new Uint8Array([255])], "a.csv")),
  ).rejects.toThrow();
  await expect(decodeImportFile(new File(["a\0"], "a.csv"))).rejects.toThrow();
  await expect(
    decodeImportFile(new File([new Uint8Array(1048577)], "a.csv")),
  ).rejects.toThrow();
});
it("recovers only valid identity metadata and requires acknowledgement for corruption", () => {
  expect(recoverPending(JSON.stringify(identity))).toEqual({
    pending: identity,
    risk: false,
  });
  expect(recoverPending("garbage")).toEqual({ pending: null, risk: true });
  expect(recoverPending(null)).toEqual({ pending: null, risk: false });
});
it("keeps the same submission for matching content and guards a different batch", () => {
  expect(chooseIdentity(identity, identity.digest, 1, false, false)).toEqual(
    identity,
  );
  expect(() =>
    chooseIdentity(identity, "b".repeat(64), 1, false, false),
  ).toThrow();
  expect(() => chooseIdentity(null, identity.digest, 1, true, false)).toThrow();
  expect(
    chooseIdentity(identity, "b".repeat(64), 1, false, true).submissionId,
  ).not.toBe(identity.submissionId);
});
import { pendingStorageKey } from "@/components/crm/csv-import-state";
it("separates staff and feature recovery keys without retaining imported fields", () => {
  expect(pendingStorageKey("properties", "staff-a")).not.toBe(
    pendingStorageKey("properties", "staff-b"),
  );
  expect(pendingStorageKey("properties", "staff-a")).not.toBe(
    pendingStorageKey("leads", "staff-a"),
  );
  expect(
    recoverPending(JSON.stringify({ ...identity, csv: "private" })),
  ).toEqual({ pending: null, risk: true });
  expect(
    recoverPending(JSON.stringify({ ...identity, schemaVersion: 2 })),
  ).toEqual({ pending: { ...identity, schemaVersion: 2 }, risk: false });
});

it("accepts the exact byte limit, rejects an empty file, and preserves multibyte content", async () => {
  const exact = "a".repeat(1048576);
  expect(await decodeImportFile(new File([exact], "a.csv"))).toBe(exact);
  expect(await decodeImportFile(new File(["\uFEFFاسم,é\r\n"], "a.csv"))).toBe(
    "\uFEFFاسم,é\r\n",
  );
  await expect(decodeImportFile(new File([], "a.csv"))).rejects.toThrow();
});
