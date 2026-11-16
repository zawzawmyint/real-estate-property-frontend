export type PendingImport = {
  submissionId: string;
  digest: string;
  schemaVersion: number;
};
export function recoverPending(raw: string | null): {
  pending: PendingImport | null;
  risk: boolean;
} {
  if (raw === null) return { pending: null, risk: false };
  try {
    const p: unknown = JSON.parse(raw);
    if (typeof p !== "object" || !p) throw Error();
    const value = p as PendingImport;
    if (
      Object.keys(value).sort().join() !==
        "digest,schemaVersion,submissionId" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        value.submissionId,
      ) ||
      !/^[a-f0-9]{64}$/.test(value.digest) ||
      !Number.isSafeInteger(value.schemaVersion) ||
      value.schemaVersion < 1
    )
      throw Error();
    return { pending: value, risk: false };
  } catch {
    return { pending: null, risk: true };
  }
}
export function chooseIdentity(
  pending: PendingImport | null,
  digest: string,
  schemaVersion: number,
  risk: boolean,
  acknowledged: boolean,
): PendingImport {
  if (pending?.digest === digest && pending.schemaVersion === schemaVersion)
    return pending;
  if ((pending || risk) && !acknowledged)
    throw Error(
      "A previous import may have completed. Starting another batch can create duplicates.",
    );
  return { submissionId: crypto.randomUUID(), digest, schemaVersion };
}
export function pendingStorageKey(namespace: string, staffId: string) {
  return `agency:csv-import:${encodeURIComponent(namespace)}:${encodeURIComponent(staffId)}`;
}
