import type { StaffRole } from "@/lib/auth/roles";
import { leadQuery, parseLeadFilters, type LeadFilters } from "./filters";
import { requestLead } from "./request";
import type { LeadList, LeadSummary } from "./types";

export type PipelineStage = LeadSummary["stage"];
export type PipelineColumnData = {
  stage: PipelineStage;
  result: LeadList | null;
  error?: string;
};

export function parsePipelineFilters(
  query: string,
  role: StaffRole,
): LeadFilters {
  const params = new URLSearchParams(query);
  if (!params.has("view"))
    params.set("view", role === "agent" ? "mine" : "all");
  params.delete("stage");
  params.delete("page");
  return parseLeadFilters(params, role);
}

export function pipelineQuery(
  filters: LeadFilters,
  stage: PipelineStage,
  page = 1,
) {
  return leadQuery({ ...filters, stage, page });
}

export function pipelineHref(filters: LeadFilters) {
  return `/crm/leads/pipeline?${leadQuery({ ...filters, stage: undefined, page: 1 })}`;
}

export function loadPipelineColumn(
  filters: LeadFilters,
  stage: PipelineStage,
  page = 1,
) {
  return requestLead<LeadList>(
    `/api/v1/staff/leads?${pipelineQuery(filters, stage, page)}`,
  );
}

export function appendPipelinePage(
  current: LeadList,
  next: LeadList,
): LeadList {
  const items = new Map(current.items.map((lead) => [lead.id, lead]));
  for (const lead of next.items) {
    const existing = items.get(lead.id);
    if (!existing || existing.version <= lead.version) items.set(lead.id, lead);
  }
  return { ...next, items: [...items.values()] };
}
