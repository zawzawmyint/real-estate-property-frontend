import { expect, it } from "vitest";
import { endDayLabel } from "@/features/viewings/data/calendar";
import {
  dubaiDate,
  timeLabel,
  validDate,
  weekDays,
  weekQuery,
} from "@/features/viewings/data/calendar";
it("groups UTC midnight boundaries by Dubai day independently of device timezone", () => {
  expect(dubaiDate("2026-10-28T21:30:00Z")).toBe("2026-10-29");
  expect(timeLabel("2026-10-28T21:30:00Z")).toBe("01:30");
});
it("uses Monday weeks across month and year boundaries", () => {
  expect(weekDays("2027-01-01")).toEqual([
    "2026-12-28",
    "2026-12-29",
    "2026-12-30",
    "2026-12-31",
    "2027-01-01",
    "2027-01-02",
    "2027-01-03",
  ]);
  const query = new URLSearchParams(
    weekQuery("2027-01-01", "cancelled", "lead", 2),
  );
  expect(Object.fromEntries(query)).toEqual({
    from: "2026-12-28T00:00:00+04:00",
    to: "2027-01-04T00:00:00+04:00",
    page: "2",
    pageSize: "50",
    status: "cancelled",
    leadId: "lead",
  });
});
it("rejects rollover and malformed URL dates", () => {
  expect(validDate("2026-02-30")).toBe(false);
  expect(validDate("2026-1-01")).toBe(false);
  expect(validDate("2028-02-29")).toBe(true);
});
it("labels overnight read views with the explicit Dubai end day across years", () => {
  expect(
    endDayLabel("2026-12-31T23:30:00+04:00", "2027-01-01T00:30:00+04:00"),
  ).toBe("Ends Fri 1 Jan (2027-01-01)");
  expect(
    endDayLabel("2026-12-31T23:00:00+04:00", "2026-12-31T23:30:00+04:00"),
  ).toBe("");
  expect(endDayLabel("2026-12-31T19:30:00Z", "2026-12-31T20:30:00Z")).toBe(
    "Ends Fri 1 Jan (2027-01-01)",
  );
});
