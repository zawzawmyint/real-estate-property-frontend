import { z } from "zod";

const version = z.number().int().positive();
const title = z.string().trim().min(1, "Enter a task title.").max(160);
const notes = z.string().trim().max(2000).nullable();
const instant = z.iso.datetime({ offset: true }).refine((value) => {
  const year = new Date(value).getUTCFullYear();
  return year >= 2000 && year <= 9999;
});
export const createSchema = z.strictObject({
  submissionId: z.uuid(),
  leadId: z.uuid(),
  expectedLeadVersion: version,
  title,
  notes: notes.optional(),
  dueAt: instant,
});
export const updateSchema = z.strictObject({
  expectedVersion: version,
  expectedLeadVersion: version,
  title,
  notes,
  dueAt: instant,
});
export const statusSchema = z.strictObject({
  expectedVersion: version,
  status: z.enum(["completed", "cancelled"]),
});

export function taskDateFields(instant: string) {
  const shifted = new Date(Date.parse(instant) + 4 * 3_600_000).toISOString();
  return { date: shifted.slice(0, 10), time: shifted.slice(11, 16) };
}

export function taskDueAt(
  fields: { date: string; time: string },
  originalDueAt?: string,
) {
  if (originalDueAt) {
    const original = taskDateFields(originalDueAt);
    if (fields.date === original.date && fields.time === original.time)
      return originalDueAt;
  }
  return new Date(`${fields.date}T${fields.time}:00+04:00`).toISOString();
}

export function taskFormSchema(originalDueAt?: string) {
  return z
    .object({
      title,
      notes: z.string().trim().max(2000),
      date: z.string().refine((value) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
        const time = Date.parse(`${value}T00:00:00Z`);
        return (
          Number.isFinite(time) &&
          Number(value.slice(0, 4)) >= 2000 &&
          new Date(time).toISOString().slice(0, 10) === value
        );
      }, "Enter a valid due date."),
      time: z
        .string()
        .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Enter a valid due time."),
    })
    .superRefine((fields, context) => {
      try {
        const dueAt = taskDueAt(fields, originalDueAt);
        if (dueAt !== originalDueAt && Date.parse(dueAt) <= Date.now())
          context.addIssue({
            code: "custom",
            path: ["time"],
            message: "Choose a future due date and time.",
          });
      } catch {
        // Individual date/time fields report malformed inputs.
      }
    });
}

export type TaskFields = z.infer<ReturnType<typeof taskFormSchema>>;
