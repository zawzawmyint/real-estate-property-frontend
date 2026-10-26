import "server-only";
import { parseApiOrigin } from "@/lib/env";
import { requestStaffSession } from "../auth/transport";
import { cookies as nextCookies } from "next/headers";
import { requestProperty } from "@/features/properties/data/request";
import {
  type PublicPropertyDetail,
  type PublicPropertySummary,
  type PropertyList,
  type StaffProperty,
} from "@/features/properties/data/types";

export function getBackendOrigin() {
  return parseApiOrigin(process.env.API_URL);
}

export function getStaffSessionFromBackend(
  cookies: readonly { name: string; value: string }[],
) {
  return requestStaffSession(
    parseApiOrigin(process.env.API_URL),
    cookies,
    process.env.NODE_ENV === "production",
  );
}

export function getPublicProperties(query = "") {
  return requestProperty<PropertyList<PublicPropertySummary>>(
    `${parseApiOrigin(process.env.API_URL)}/api/v1/properties${query ? `?${query.replace(/^\?/, "")}` : ""}`,
  );
}

export function getPublicProperty(id: string) {
  return requestProperty<PublicPropertyDetail>(
    `${parseApiOrigin(process.env.API_URL)}/api/v1/properties/${encodeURIComponent(id)}`,
  );
}

export async function getStaffRequestHeaders(): Promise<
  Record<string, string>
> {
  const store = await nextCookies();
  const name =
    process.env.NODE_ENV === "production"
      ? "__Host-agency.session"
      : "agency.session";
  const session = store.get(name);

  return session ? { Cookie: `${name}=${session.value}` } : {};
}

export async function getStaffProperties(query = "") {
  return requestProperty<PropertyList<StaffProperty>>(
    `${parseApiOrigin(process.env.API_URL)}/api/v1/staff/properties${query ? `?${query.replace(/^\?/, "")}` : ""}`,
    { headers: await getStaffRequestHeaders() },
  );
}

export async function getStaffProperty(id: string) {
  return requestProperty<StaffProperty>(
    `${parseApiOrigin(process.env.API_URL)}/api/v1/staff/properties/${encodeURIComponent(id)}`,
    { headers: await getStaffRequestHeaders() },
  );
}
