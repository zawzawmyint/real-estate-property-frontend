import "server-only";
import { getBackendOrigin, getStaffRequestHeaders } from "@/lib/api/server";
import { requestViewing } from "./request";
import type { Viewing, ViewingPage } from "./types";
export async function getStaffViewings(query: string) {
  return requestViewing<ViewingPage>(
    `${getBackendOrigin()}/api/v1/staff/viewings?${query}`,
    { headers: await getStaffRequestHeaders() },
  );
}
export async function getStaffViewing(id: string) {
  return requestViewing<Viewing>(
    `${getBackendOrigin()}/api/v1/staff/viewings/${encodeURIComponent(id)}`,
    { headers: await getStaffRequestHeaders() },
  );
}
