import { requestViewing } from "./request";
import type { Viewing, ViewingPage } from "./types";
import type {
  PropertyList,
  StaffProperty,
} from "@/features/properties/data/types";
export function getViewing(id: string) {
  return requestViewing<Viewing>(
    `/api/v1/staff/viewings/${encodeURIComponent(id)}`,
  );
}
export function getViewings(query: string) {
  return requestViewing<ViewingPage>(`/api/v1/staff/viewings?${query}`);
}
export function getBookableProperties(q = "", page = 1, signal?: AbortSignal) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: "12",
    publishingState: "published",
    availability: "available",
  });
  const search = q.trim();
  if (search) params.set("q", search);
  return requestViewing<PropertyList<StaffProperty>>(
    `/api/v1/staff/properties?${params}`,
    { signal },
  );
}
