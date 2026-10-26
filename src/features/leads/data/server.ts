import "server-only";
import { getBackendOrigin, getStaffRequestHeaders } from "@/lib/api/server";
import { requestLead } from "./request";
import type { Activity, LeadDetail, LeadList, Page } from "./types";
export async function getStaffLeads(query: string) {
  return requestLead<LeadList>(
    `${getBackendOrigin()}/api/v1/staff/leads?${query}`,
    { headers: await getStaffRequestHeaders() },
  );
}
export async function getStaffLead(id: string) {
  return requestLead<LeadDetail>(
    `${getBackendOrigin()}/api/v1/staff/leads/${encodeURIComponent(id)}`,
    { headers: await getStaffRequestHeaders() },
  );
}
export async function getStaffActivity(id: string) {
  return requestLead<Page<Activity>>(
    `${getBackendOrigin()}/api/v1/staff/leads/${encodeURIComponent(id)}/activity?page=1`,
    { headers: await getStaffRequestHeaders() },
  );
}
