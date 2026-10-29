import { taskDateFields, taskDueAt, type TaskFields } from "../data/input";
import type { Task } from "../data/types";

type EditableTask = Pick<Task, "title" | "notes" | "dueAt">;
export type TaskEditConflict = {
  field: "title" | "notes" | "dueAt";
  label: string;
  saved: string;
  draft: string;
};

export function taskEditFields(task: EditableTask): TaskFields {
  return {
    title: task.title,
    notes: task.notes || "",
    ...taskDateFields(task.dueAt),
  };
}

export function reconcileTaskEdit(
  original: EditableTask,
  latest: EditableTask,
  draft: TaskFields,
  dirty: Partial<Record<keyof TaskFields, boolean>>,
) {
  const baseline = taskEditFields(original);
  const saved = taskEditFields(latest);
  const values = { ...saved };
  const conflicts: TaskEditConflict[] = [];
  for (const field of ["title", "notes"] as const) {
    if (!dirty[field]) continue;
    values[field] = draft[field];
    if (saved[field] !== baseline[field] && saved[field] !== draft[field])
      conflicts.push({
        field,
        label: field === "title" ? "Title" : "Notes",
        saved: saved[field],
        draft: draft[field],
      });
  }
  // A time belongs to its date: never combine one draft half with one saved half.
  if (dirty.date || dirty.time) {
    values.date = draft.date;
    values.time = draft.time;
    let sameInstant = false;
    try {
      sameInstant = taskDueAt(draft, original.dueAt) === latest.dueAt;
    } catch {
      /* Preserve invalid drafts for field validation. */
    }
    if (latest.dueAt !== original.dueAt && !sameInstant)
      conflicts.push({
        field: "dueAt",
        label: "Due date & time · Dubai",
        saved: `${saved.date} at ${saved.time}`,
        draft: `${draft.date || "No date"} at ${draft.time || "No time"}`,
      });
  }
  return { values, conflicts };
}
