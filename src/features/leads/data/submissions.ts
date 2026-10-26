import type { ActionError } from "./types";

/** A later definite failure cannot prove an earlier uncertain write did not commit. */
export function receiptAfterFailure<T>(
  receipt: T | undefined,
  previouslyUncertain: boolean,
  error: Pick<ActionError, "status" | "uncertain">,
): T | undefined {
  return previouslyUncertain || error.uncertain ? receipt : undefined;
}

/** Definitive conflicts permit a new edited note; uncertain receipts keep their exact payload. */
export function receiptAfterNoteConflict<T extends { version: number }>(
  receipt: T,
  uncertain: boolean,
  authorizedVersion: number,
): T | undefined {
  return uncertain ? { ...receipt, version: authorizedVersion } : undefined;
}
