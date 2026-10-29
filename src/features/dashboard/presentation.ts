import type { DashboardSummary } from "./types";

const sourceLabels = { website: "Website", call: "Call", walk_in: "Walk-in" };
const stageLabels = {
  new: "New",
  contacted: "Contacted",
  viewing_scheduled: "Viewing Scheduled",
  offer: "Offer",
  won: "Won",
  lost: "Lost",
};

export const formatCount = (count: number) => count.toLocaleString("en-GB");
export const formatConversion = (value: number | null) =>
  value === null ? "—" : `${value.toFixed(1)}%`;
export const sourceCounts = (items: DashboardSummary["leadsBySource"]) =>
  items.map(({ source, count }) => ({ label: sourceLabels[source], count }));
export const stageCounts = (items: DashboardSummary["pipelineByStage"]) =>
  items.map(({ stage, count }) => ({ label: stageLabels[stage], count }));

export function formatDashboardWeek(start: string, endExclusive: string) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Dubai",
  });
  return `${formatter.format(new Date(start))}–${formatter.format(new Date(new Date(endExclusive).getTime() - 1))} · Dubai time`;
}

export function formatUpdatedAt(value: string) {
  return `${new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "Asia/Dubai" }).format(new Date(value))} GST`;
}
