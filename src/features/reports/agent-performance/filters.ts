import type { operations } from "@/lib/api/generated/agent-performance";
import { reportPath } from "./report-path";

type ReportQuery = NonNullable<
  operations["getAgentPerformanceReport"]["parameters"]["query"]
>;
export type ReportFilters = Required<Omit<ReportQuery, "agentId">> &
  Pick<ReportQuery, "agentId">;
export type ReportSearchParams = Record<string, string | string[] | undefined>;

const day = 86_400_000;
const dubaiOffset = 4 * 3_600_000;

function calendarDate(value: string) {
  if (!/^(?!0000)\d{4}-\d{2}-\d{2}$/.test(value)) return NaN;
  const date = new Date(`${value}T00:00:00.000Z`);
  const milliseconds = date.getTime();
  return Number.isFinite(milliseconds) &&
    date.toISOString().startsWith(`${value}T`)
    ? milliseconds
    : NaN;
}

export function parseReportFilters(
  query: ReportSearchParams,
  now = new Date(),
): { today: string } & ({ filters: ReportFilters } | { error: string }) {
  const today = new Date(now.getTime() + dubaiOffset)
    .toISOString()
    .slice(0, 10);
  if (
    Object.entries(query).some(
      ([key, value]) =>
        !["from", "to", "agentId", "page", "pageSize"].includes(key) ||
        (value !== undefined && (typeof value !== "string" || !value.trim())),
    )
  ) {
    return {
      today,
      error: "Remove any repeated, empty or unrecognized report filters.",
    };
  }

  const { from, to, agentId, page = "1", pageSize = "25" } = query;
  if (typeof from === "string" && typeof to === "string") {
    const length = (calendarDate(to) - calendarDate(from)) / day + 1;
    if (!Number.isFinite(length) || length < 1 || length > 366 || to > today) {
      return {
        today,
        error:
          "Enter valid dates in order, spanning up to 366 days and ending by today in Dubai.",
      };
    }
  } else if (from !== undefined || to !== undefined) {
    return { today, error: "Enter both a start date and an end date." };
  }

  const pageNumber = Number(page);
  if (
    typeof page !== "string" ||
    !/^[1-9]\d*$/.test(page) ||
    !Number.isSafeInteger(pageNumber) ||
    (pageSize !== "25" && pageSize !== "50")
  ) {
    return {
      today,
      error: "Enter a positive page number and a page size of 25 or 50.",
    };
  }
  if (
    agentId !== undefined &&
    (typeof agentId !== "string" || agentId.length > 128)
  ) {
    return {
      today,
      error: "Choose a valid agent or clear the agent selection.",
    };
  }

  return {
    today,
    filters: {
      from: typeof from === "string" ? from : `${today.slice(0, 8)}01`,
      to: typeof to === "string" ? to : today,
      agentId,
      page: pageNumber,
      pageSize: pageSize === "25" ? 25 : 50,
    },
  };
}

export function reportQuery(filters: ReportFilters) {
  const query = new URLSearchParams({ from: filters.from, to: filters.to });
  if (filters.agentId !== undefined) query.set("agentId", filters.agentId);
  if (filters.page !== 1) query.set("page", String(filters.page));
  if (filters.pageSize !== 25) query.set("pageSize", String(filters.pageSize));
  return query.toString();
}

export function reportHref(filters: ReportFilters) {
  return `${reportPath}?${reportQuery(filters)}`;
}

export function formatFollowUpDuration(seconds: number | null) {
  if (seconds === null) return "—";
  const units = [
    [Math.floor(seconds / 86400), "d"],
    [Math.floor((seconds % 86400) / 3600), "h"],
    [Math.floor((seconds % 3600) / 60), "m"],
    [seconds % 60, "s"],
  ] as const;
  return (
    units
      .filter(([value]) => value > 0)
      .map(([value, unit]) => `${value}${unit}`)
      .join(" ") || "0s"
  );
}
