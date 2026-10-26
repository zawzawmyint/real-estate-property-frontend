import "server-only";
import { getBackendOrigin } from "@/lib/api/server";
import { requestProperty, requestStaffProperty } from "./request";
import type { CreateProperty, PatchProperty } from "./types";

type StaffHeaders = Record<string, string>;

const staffPath = () => `${getBackendOrigin()}/api/v1/staff/properties`;
const propertyPath = (id: string) => `${staffPath()}/${encodeURIComponent(id)}`;

export function createProperty(input: CreateProperty, headers: StaffHeaders) {
  return requestStaffProperty(staffPath(), {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function updateProperty(
  id: string,
  input: PatchProperty,
  headers: StaffHeaders,
) {
  return requestStaffProperty(propertyPath(id), {
    method: "PATCH",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function deleteProperty(id: string, headers: StaffHeaders) {
  return requestProperty<void>(propertyPath(id), { method: "DELETE", headers });
}

export function uploadPropertyPhoto(
  id: string,
  file: File,
  headers: StaffHeaders,
) {
  return requestStaffProperty(`${propertyPath(id)}/photos`, {
    method: "POST",
    headers: { ...headers, "Content-Type": file.type },
    body: file,
  });
}

export function reorderPropertyPhotos(
  id: string,
  photoIds: string[],
  headers: StaffHeaders,
) {
  return requestStaffProperty(`${propertyPath(id)}/photos/order`, {
    method: "PATCH",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ photoIds }),
  });
}

export function removePropertyPhoto(
  id: string,
  photoId: string,
  headers: StaffHeaders,
) {
  return requestStaffProperty(
    `${propertyPath(id)}/photos/${encodeURIComponent(photoId)}`,
    { method: "DELETE", headers },
  );
}
