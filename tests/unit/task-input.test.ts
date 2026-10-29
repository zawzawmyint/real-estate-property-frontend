import { expect, it } from "vitest";
import {
  taskDateFields,
  taskDueAt,
  taskFormSchema,
  createSchema,
} from "@/features/tasks/data/input";

it("converts explicit Dubai wall time rather than device time", () => {
  expect(taskDueAt({ date: "2030-01-01", time: "00:30" })).toBe(
    "2029-12-31T20:30:00.000Z",
  );
  expect(taskDateFields("2030-01-01T20:30:27.123Z")).toEqual({
    date: "2030-01-02",
    time: "00:30",
  });
});

it("retains seconds and milliseconds for unchanged overdue date fields", () => {
  const original = "2020-01-01T07:30:27.123Z";
  const fields = {
    title: "Corrected call",
    notes: "",
    date: "2020-01-01",
    time: "11:30",
  };
  expect(taskDueAt(fields, original)).toBe(original);
  expect(taskFormSchema(original).safeParse(fields).success).toBe(true);
  expect(taskFormSchema().safeParse(fields).success).toBe(false);
});

it("rejects invalid calendar dates, blank titles and excessive notes", () => {
  const fields = {
    title: "Call buyer",
    notes: "",
    date: "2090-02-28",
    time: "11:30",
  };
  expect(taskFormSchema().safeParse(fields).success).toBe(true);
  for (const patch of [
    { title: " " },
    { date: "2090-02-30" },
    { time: "24:00" },
    { notes: "a".repeat(2001) },
  ])
    expect(taskFormSchema().safeParse({ ...fields, ...patch }).success).toBe(
      false,
    );
});

it("runtime mutation schema rejects unknown fields and offset-free timestamps", () => {
  const input = {
    submissionId: "12b7aaf0-bd6b-4d07-a2e3-a657148c13e7",
    leadId: "12b7aaf0-bd6b-4d07-a2e3-a657148c13e7",
    expectedLeadVersion: 1,
    title: "Call buyer",
    dueAt: "2090-01-01T10:00:00Z",
  };
  expect(createSchema.safeParse(input).success).toBe(true);
  expect(createSchema.safeParse({ ...input, actor: "admin" }).success).toBe(
    false,
  );
  expect(
    createSchema.safeParse({ ...input, dueAt: "2090-01-01T10:00:00" }).success,
  ).toBe(false);
});
