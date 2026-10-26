import type { StaffRole } from "@/lib/auth/roles";
import { stages } from "./input";
export type LeadFilters = {
  view: "unassigned" | "all" | "mine";
  q?: string;
  stage?: string;
  source?: string;
  agentId?: string;
  sort: "newest" | "oldest" | "updated";
  page: number;
};
export function parseLeadFilters(
  params: URLSearchParams,
  role: StaffRole,
): LeadFilters {
  const value = Object.fromEntries(params);
  const view = value.view || (role === "agent" ? "mine" : "unassigned");
  const sort = value.sort || "newest";
  if (
    !["unassigned", "all", "mine"].includes(view) ||
    !["newest", "oldest", "updated"].includes(sort) ||
    (value.stage && !stages.includes(value.stage as never)) ||
    (value.source && !["website", "call", "walk_in"].includes(value.source)) ||
    (value.q?.length ?? 0) > 120 ||
    (value.page && !/^\d+$/.test(value.page)) ||
    (role === "agent" && (view !== "mine" || value.agentId)) ||
    (value.agentId && view !== "all")
  )
    throw new Error("Invalid lead filters");
  const page = Number(value.page || 1);
  if (!Number.isSafeInteger(page) || page < 1 || page > 1e6)
    throw new Error("Invalid page");
  return {
    view: view as LeadFilters["view"],
    ...(value.q ? { q: value.q } : {}),
    ...(value.stage ? { stage: value.stage } : {}),
    ...(value.source ? { source: value.source } : {}),
    ...(value.agentId ? { agentId: value.agentId } : {}),
    sort: sort as LeadFilters["sort"],
    page,
  };
}
export function leadQuery(filters: LeadFilters) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters))
    if (value !== undefined && value !== "") params.set(key, String(value));
  return params.toString();
}
export function leadsHref(filters: LeadFilters) {
  return `/crm/leads?${leadQuery(filters)}`;
}
export function safeLeadReturn(value: unknown, role: StaffRole) {
  if (typeof value !== "string" || value.length > 2000) return "/crm/leads";
  try {
    return leadsHref(parseLeadFilters(new URLSearchParams(value), role));
  } catch {
    return "/crm/leads";
  }
}
