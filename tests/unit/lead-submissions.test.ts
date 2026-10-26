import { expect, it } from "vitest";
import {
  receiptAfterFailure,
  receiptAfterNoteConflict,
} from "@/features/leads/data/submissions";

it.each([401, 403, 409, 429, 503])(
  "retains the original manual-create receipt after uncertain commit followed by %s",
  (status) => {
    const original = {
      id: "original-submission",
      payload: { name: "Preserved client", email: "client@example.com" },
    };
    const next = receiptAfterFailure(original, true, { status });
    expect(next).toBe(original);
    expect(next?.payload).toBe(original.payload);
  },
);
it("holds a newly uncertain create, while allowing corrected definite validation failures to use a fresh submission", () => {
  const original = { id: "original", payload: { name: "Client" } };
  expect(
    receiptAfterFailure(original, false, { status: 503, uncertain: true }),
  ).toBe(original);
  expect(receiptAfterFailure(original, false, { status: 400 })).toBeUndefined();
});
it("releases a definite note conflict so the next explicit save captures the edited current draft", () => {
  const old = {
    id: "old-submission",
    entry: { kind: "note", body: "Original draft" },
    version: 1,
  };
  expect(receiptAfterNoteConflict(old, false, 3)).toBeUndefined();
  const currentDraft = {
    kind: "call",
    body: "Edited after reviewing conflict",
  };
  const newSubmission = receiptAfterNoteConflict(old, false, 3) ?? {
    id: "new-submission",
    entry: currentDraft,
    version: 3,
  };
  expect(newSubmission).toMatchObject({
    id: "new-submission",
    entry: currentDraft,
    version: 3,
  });
});
it("keeps uncertain note identity and payload locked while reconciling a new authorized version", () => {
  const original = {
    id: "same-submission",
    entry: { kind: "call", body: "Possibly committed" },
    version: 1,
  };
  expect(receiptAfterNoteConflict(original, true, 4)).toEqual({
    ...original,
    version: 4,
  });
  expect(receiptAfterNoteConflict(original, true, 4)?.entry).toBe(
    original.entry,
  );
});
