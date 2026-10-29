import "server-only";
import { getBackendOrigin, getStaffRequestHeaders } from "@/lib/api/server";
import { requestDashboard } from "./request";

export async function getDashboard() {
  return requestDashboard(`${getBackendOrigin()}/api/v1/staff/dashboard`, {
    headers: await getStaffRequestHeaders(),
  });
}
