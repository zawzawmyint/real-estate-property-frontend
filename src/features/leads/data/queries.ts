import { requestLead } from "./request";
import type {
  PropertyList,
  StaffProperty,
} from "@/features/properties/data/types";
import type {
  Activity,
  LeadDetail,
  Page,
  PropertyMatchPage,
  PropertyMatchQuery,
  StaffSummary,
} from "./types";
export function getLead(id: string) {
  return requestLead<LeadDetail>(
    `/api/v1/staff/leads/${encodeURIComponent(id)}`,
  );
}
export function getActivity(id: string, page = 1) {
  return requestLead<Page<Activity>>(
    `/api/v1/staff/leads/${encodeURIComponent(id)}/activity?page=${page}`,
  );
}
export function getLeadPropertyMatches(
  id: string,
  query: PropertyMatchQuery,
  signal?: AbortSignal,
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query))
    if (value !== undefined) params.set(key, String(value));

  return requestLead<PropertyMatchPage>(
    `/api/v1/staff/leads/${encodeURIComponent(id)}/property-matches?${params}`,
    { signal: signal && AbortSignal.any([signal, AbortSignal.timeout(20000)]) },
  );
}
export function getCandidates(q = "", page = 1, signal?: AbortSignal) {
  return requestLead<Page<StaffSummary>>(
    `/api/v1/staff/leads/assignment-candidates?${new URLSearchParams({ q, page: String(page) })}`,
    { signal },
  );
}
export async function getPropertyCandidates(
  q = "",
  page = 1,
  signal?: AbortSignal,
) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: "12",
    availability: "available",
  });
  const search = q.trim();
  if (search) params.set("q", search);
  const data = await requestLead<PropertyList<StaffProperty>>(
    `/api/v1/staff/properties?${params}`,
    { signal },
  );
  return {
    ...data,
    items: data.items
      .filter((item) => item.publishingState !== "archived")
      .map((item) => ({
        id: item.id,
        name: item.title,
        purpose: item.purpose,
      })),
  };
}
