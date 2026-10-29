import { expect, it } from "vitest";
import {
  reconcileTaskEdit,
  taskEditFields,
} from "@/features/tasks/crm/edit-reconciliation";
import { taskDueAt } from "@/features/tasks/data/input";

const original = {
  title: "Call buyer",
  notes: "Original notes",
  dueAt: "2090-01-01T07:30:27.123Z",
};

it("merges untouched colleague notes and due time into a title-only draft", () => {
  const latest = {
    ...original,
    notes: "Colleague notes",
    dueAt: "2090-02-03T09:15:49.456Z",
  };
  const result = reconcileTaskEdit(
    original,
    latest,
    { ...taskEditFields(original), title: "My title" },
    { title: true },
  );
  expect(result.conflicts).toEqual([]);
  expect(result.values).toEqual({
    ...taskEditFields(latest),
    title: "My title",
  });
  expect(taskDueAt(result.values, latest.dueAt)).toBe(latest.dueAt);
});

it("reports both saved and draft text when a dirty field changed remotely", () => {
  const result = reconcileTaskEdit(
    original,
    { ...original, title: "Colleague title", notes: "Colleague notes" },
    { ...taskEditFields(original), title: "My title" },
    { title: true },
  );
  expect(result.values.notes).toBe("Colleague notes");
  expect(result.values.title).toBe("My title");
  expect(result.conflicts).toEqual([
    {
      field: "title",
      label: "Title",
      saved: "Colleague title",
      draft: "My title",
    },
  ]);
});

it("preserves date and time atomically and reports concurrent due changes", () => {
  const draft = { ...taskEditFields(original), date: "2090-03-10" };
  const latest = { ...original, dueAt: "2090-02-03T09:15:00.000Z" };
  const result = reconcileTaskEdit(original, latest, draft, { date: true });
  expect(result.values.date).toBe(draft.date);
  expect(result.values.time).toBe(draft.time);
  expect(result.conflicts.map((item) => item.field)).toEqual(["dueAt"]);
});

it("a dirty time preserves the draft date too", () => {
  const draft = { ...taskEditFields(original), time: "15:45" };
  const result = reconcileTaskEdit(
    original,
    { ...original, dueAt: "2090-04-01T10:30:00.000Z" },
    draft,
    { time: true },
  );
  expect(result.values).toEqual(draft);
  expect(result.conflicts[0]?.field).toBe("dueAt");
});

it("does not conflict when saved content already equals the draft", () => {
  const latest = { ...original, title: "My title", notes: null };
  const result = reconcileTaskEdit(
    original,
    latest,
    { ...taskEditFields(original), title: "My title", notes: "" },
    { title: true, notes: true },
  );
  expect(result.conflicts).toEqual([]);
  expect(result.values).toEqual(taskEditFields(latest));
});

it("preserves an unchanged due instant exactly when merging dirty notes", () => {
  const result = reconcileTaskEdit(
    original,
    original,
    { ...taskEditFields(original), notes: "My notes" },
    { notes: true },
  );
  expect(result.values.notes).toBe("My notes");
  expect(taskDueAt(result.values, original.dueAt)).toBe(original.dueAt);
  expect(result.conflicts).toEqual([]);
});
