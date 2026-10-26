import { requestStaffProperty } from "./request";

export function getProperty(id: string) {
  return requestStaffProperty(
    `/api/v1/staff/properties/${encodeURIComponent(id)}`,
  );
}
