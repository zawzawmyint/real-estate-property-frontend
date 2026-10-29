import "server-only";
import { getBackendOrigin, getStaffRequestHeaders } from "@/lib/api/server";
import { requestTask } from "./request";
import type { TaskEnvelope, TaskPage } from "./types";
export async function getStaffTasks(query: string) {
  return requestTask<TaskPage>(
    `${getBackendOrigin()}/api/v1/staff/tasks?${query}`,
    { headers: await getStaffRequestHeaders() },
  );
}
export async function getStaffTask(id: string) {
  return requestTask<TaskEnvelope>(
    `${getBackendOrigin()}/api/v1/staff/tasks/${encodeURIComponent(id)}`,
    { headers: await getStaffRequestHeaders() },
  );
}
