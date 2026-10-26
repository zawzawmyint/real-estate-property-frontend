import type { components } from "@/lib/api/generated/properties";

export type PropertyPhoto = components["schemas"]["Photo"];

export type PublicPropertySummary =
  components["schemas"]["PublicPropertySummary"];

export type PublicPropertyDetail =
  components["schemas"]["PublicPropertyDetail"];

export type StaffProperty = components["schemas"]["StaffProperty"];

export type CreateProperty = components["schemas"]["CreateProperty"];

export type PatchProperty = components["schemas"]["PatchProperty"];

export type PropertyList<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type PropertyActionError = {
  code: string;
  message: string;
  status?: number;
  requestId?: string;
  fieldErrors?: Record<string, string[]>;
  uncertain?: boolean;
};

export type PropertyActionResult<T> =
  { ok: true; data: T } | { ok: false; error: PropertyActionError };
