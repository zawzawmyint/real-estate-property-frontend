import { z } from "zod";
import { validDate, shiftDay } from "./calendar";
const version = z.number().int().positive();
const instant = z.iso.datetime({ offset: true });
export const createSchema = z.object({
  submissionId: z.uuid(),
  leadId: z.uuid(),
  propertyId: z.uuid(),
  expectedLeadVersion: version,
  startsAt: instant,
  endsAt: instant,
});
export const rescheduleSchema = z.object({
  expectedVersion: version,
  expectedLeadVersion: version,
  startsAt: instant,
  endsAt: instant,
});
export const statusSchema = z.discriminatedUnion("status", [
  z.object({ expectedVersion: version, status: z.literal("cancelled") }),
  z.object({
    expectedVersion: version,
    status: z.literal("completed"),
    feedback: z.string().trim().min(1, "Enter feedback.").max(4000),
  }),
]);
export const scheduleSchema = z
  .object({
    propertyId: z.uuid("Select a property."),
    date: z.string().refine(validDate, "Enter a valid date."),
    start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Enter a valid time."),
    end: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Enter a valid time."),
  })
  .superRefine((value, ctx) => {
    if (!validDate(value.date)) return;
    const start = Date.parse(`${value.date}T${value.start}:00+04:00`);
    const endDate =
      value.end < value.start ? shiftDay(value.date, 1) : value.date;
    const duration =
      (Date.parse(`${endDate}T${value.end}:00+04:00`) - start) / 60000;
    if (start <= Date.now())
      ctx.addIssue({
        code: "custom",
        path: ["start"],
        message: "Choose a future start time.",
      });
    if (duration < 15 || duration > 240)
      ctx.addIssue({
        code: "custom",
        path: ["end"],
        message: "Choose a duration of 15–240 minutes.",
      });
  });
export type ScheduleFields = z.infer<typeof scheduleSchema>;
export function scheduleInstants(value: ScheduleFields) {
  return {
    startsAt: `${value.date}T${value.start}:00+04:00`,
    endsAt: `${value.end < value.start ? shiftDay(value.date, 1) : value.date}T${value.end}:00+04:00`,
  };
}
