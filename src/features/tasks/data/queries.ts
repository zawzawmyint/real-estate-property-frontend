import { requestTask } from "./request";
import type { TaskEnvelope, TaskPage } from "./types";
import type { LeadList } from "@/features/leads/data/types";

export function getTask(id: string, signal?: AbortSignal) {
  return requestTask<TaskEnvelope>(
    `/api/v1/staff/tasks/${encodeURIComponent(id)}`,
    { signal },
  );
}
export function getTasks(query: string, signal?: AbortSignal) {
  return requestTask<TaskPage>(`/api/v1/staff/tasks?${query}`, { signal });
}
export function getTaskLeads(
  q: string,
  page = 1,
  signal?: AbortSignal,
  view: "mine" | "all" = "mine",
) {
  const query = new URLSearchParams({
    q: q.trim(),
    page: String(page),
    view,
  });
  return requestTask<LeadList>(`/api/v1/staff/leads?${query}`, { signal });
}
