import { afterEach, expect, it, vi } from "vitest";
import {
  scheduleInstants,
  scheduleSchema,
  statusSchema,
} from "@/features/viewings/data/input";
const fields = {
  propertyId: "12b7aaf0-bd6b-4d07-a2e3-a657148c13e7",
  date: "2026-12-31",
  start: "23:30",
  end: "00:30",
};
afterEach(() => vi.useRealTimers());
it("turns Dubai fields into offset-bearing instants including next-day end", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-28T10:00:00Z"));
  expect(scheduleSchema.safeParse(fields).success).toBe(true);
  expect(scheduleInstants(fields)).toEqual({
    startsAt: "2026-12-31T23:30:00+04:00",
    endsAt: "2027-01-01T00:30:00+04:00",
  });
});
it("rejects past starts, invalid dates and out-of-bounds durations", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-28T10:00:00Z"));
  for (const value of [
    { ...fields, date: "2026-02-30" },
    { ...fields, date: "2026-01-01" },
    { ...fields, end: "23:31" },
    { ...fields, end: "23:30" },
    { ...fields, end: "05:00" },
  ])
    expect(scheduleSchema.safeParse(value).success).toBe(false);
});
it("requires trimmed feedback for completion and no feedback for cancellation", () => {
  expect(
    statusSchema.safeParse({
      expectedVersion: 1,
      status: "completed",
      feedback: "   ",
    }).success,
  ).toBe(false);
  expect(
    statusSchema.parse({
      expectedVersion: 1,
      status: "completed",
      feedback: "  Interested  ",
    }),
  ).toEqual({
    expectedVersion: 1,
    status: "completed",
    feedback: "Interested",
  });
  expect(
    statusSchema.safeParse({ expectedVersion: 1, status: "cancelled" }).success,
  ).toBe(true);
});
