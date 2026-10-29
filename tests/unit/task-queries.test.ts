import { expect, it } from "vitest";
import {
  parseTaskFilters,
  taskApiQuery,
  taskHref,
} from "@/features/tasks/data/filters";

it("defaults to bounded open tasks and rejects incompatible overdue URLs", () => {
  expect(parseTaskFilters({})).toEqual({
    status: "open",
    due: "all",
    page: 1,
    valid: true,
  });
  expect(parseTaskFilters({ status: "completed", due: "overdue" }).valid).toBe(
    false,
  );
  expect(parseTaskFilters({ page: ["1", "2"] }).valid).toBe(false);
  expect(parseTaskFilters({ page: "1000001" }).valid).toBe(false);
  expect(taskApiQuery(parseTaskFilters({ due: "today" }))).toBe(
    "status=open&due=today&page=1&pageSize=20",
  );
});

it("lead task pagination preserves viewing keys and uses independent task keys", () => {
  const params = new URLSearchParams(
    "date=2026-10-29&status=scheduled&taskDue=overdue",
  );
  const filters = parseTaskFilters(Object.fromEntries(params), true);
  expect(filters).toMatchObject({
    status: "open",
    due: "overdue",
    valid: true,
  });
  const href = taskHref("/crm/leads/lead", filters, 2, params, true);
  const url = new URL(href, "http://local");
  expect(url.searchParams.get("date")).toBe("2026-10-29");
  expect(url.searchParams.get("status")).toBe("scheduled");
  expect(url.searchParams.get("taskPage")).toBe("2");
});
