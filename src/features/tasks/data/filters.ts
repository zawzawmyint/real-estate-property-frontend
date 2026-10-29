export type TaskFilters = {
  status: "open" | "completed" | "cancelled" | "all";
  due: "all" | "overdue" | "today" | "upcoming";
  page: number;
  valid: boolean;
};

export function parseTaskFilters(
  values: Record<string, string | string[] | undefined>,
  lead = false,
): TaskFilters {
  const prefix = lead ? "task" : "";
  const key = (name: string) =>
    prefix ? `${prefix}${name.charAt(0).toUpperCase()}${name.slice(1)}` : name;
  const status = values[key("status")] ?? "open";
  const due = values[key("due")] ?? "all";
  const page = values[key("page")] ?? "1";
  const valid =
    typeof status === "string" &&
    ["open", "completed", "cancelled", "all"].includes(status) &&
    typeof due === "string" &&
    ["all", "overdue", "today", "upcoming"].includes(due) &&
    typeof page === "string" &&
    /^[1-9]\d*$/.test(page) &&
    Number(page) <= 1_000_000 &&
    !(due === "overdue" && status !== "open");
  return {
    status: (typeof status === "string"
      ? status
      : "open") as TaskFilters["status"],
    due: (typeof due === "string" ? due : "all") as TaskFilters["due"],
    page:
      typeof page === "string" && /^[1-9]\d*$/.test(page) ? Number(page) : 1,
    valid,
  };
}

export function taskApiQuery(filters: TaskFilters, leadId?: string) {
  const query = new URLSearchParams({
    status: filters.status,
    due: filters.due,
    page: String(filters.page),
    pageSize: "20",
  });
  if (leadId) query.set("leadId", leadId);
  return query.toString();
}

export function taskHref(
  pathname: string,
  filters: TaskFilters,
  page = 1,
  existing = new URLSearchParams(),
  lead = false,
) {
  const query = new URLSearchParams(existing);
  query.set(lead ? "taskStatus" : "status", filters.status);
  query.set(lead ? "taskDue" : "due", filters.due);
  query.set(lead ? "taskPage" : "page", String(page));
  return `${pathname}?${query}`;
}
