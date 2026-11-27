import { z } from "zod";
import { formatArea } from "@/features/properties/data/filters";
import type { operations } from "@/lib/api/generated/record-audit-log";

export const auditPath = "/crm/activity-log";
export const entities = [
  "property",
  "lead",
  "viewing",
  "task",
  "import",
] as const;
export const actions = [
  "property.created",
  "property.updated",
  "property.deleted",
  "property.photo_added",
  "property.photo_removed",
  "property.photos_reordered",
  "lead.created",
  "lead.updated",
  "lead.assigned",
  "lead.stage_changed",
  "lead.temperature_changed",
  "lead.note_added",
  "lead.call_logged",
  "viewing.created",
  "viewing.rescheduled",
  "viewing.cancelled",
  "viewing.completed",
  "task.created",
  "task.updated",
  "task.completed",
  "task.cancelled",
  "import.completed",
] as const;
const day = 86400000;

export function dubaiDate(ms: number) {
  return new Date(ms + 4 * 3600000).toISOString().slice(0, 10);
}

export function dateRange(start: string, end: string) {
  if (
    !z.iso.date().safeParse(start).success ||
    !z.iso.date().safeParse(end).success
  )
    return null;

  const duration = Date.parse(end) - Date.parse(start);
  if (duration < 0 || duration >= 93 * day) return null;

  return {
    from: start + "T00:00:00+04:00",
    to:
      new Date(Date.parse(end) + day).toISOString().slice(0, 10) +
      "T00:00:00+04:00",
  };
}

const integer = z
  .string()
  .regex(/^[1-9]\d*$/)
  .transform(Number)
  .pipe(z.int().positive());
export const auditFiltersSchema = z
  .strictObject({
    from: z.iso.datetime({ offset: true }),
    to: z.iso.datetime({ offset: true }),
    actorId: z
      .string()
      .min(1)
      .max(128)
      .refine((v) => !!v.trim())
      .optional(),
    actorKind: z.enum(["staff", "website", "system"]).optional(),
    entityType: z.enum(entities).optional(),
    entityId: z.uuid().optional(),
    action: z.enum(actions).optional(),
    importId: z.uuid().optional(),
    page: integer.default(1),
    pageSize: integer.pipe(z.number().max(100)).default(20),
  })
  .refine((v) => !v.actorId || !v.actorKind, {
    path: ["actorId"],
    message: "Choose a historical actor or an actor source, not both.",
  })
  .refine((v) => !v.entityId || !!v.entityType, {
    path: ["entityId"],
    message: "Choose a record type before filtering by record ID.",
  })
  .refine(
    (v) =>
      !v.action || !v.entityType || v.action.startsWith(v.entityType + "."),
    { path: ["action"], message: "Choose an action for this record type." },
  )
  .refine((v) => Number.isSafeInteger((v.page - 1) * v.pageSize))
  .refine((v) => {
    const duration = Date.parse(v.to) - Date.parse(v.from);
    return duration > 0 && duration <= 93 * day;
  });
type AuditQuery = NonNullable<
  operations["listAuditEvents"]["parameters"]["query"]
>;
export type AuditFilters = AuditQuery & { page: number; pageSize: number };
export type Query = Record<string, string | string[] | undefined>;

export function parseAuditFilters(
  query: Query,
  now = new Date(),
): { filters: AuditFilters } | { error: string } {
  const fallback =
    query.from === undefined && query.to === undefined
      ? dateRange(dubaiDate(+now - 6 * day), dubaiDate(+now))
      : null;
  const parsed = auditFiltersSchema.safeParse({ ...fallback, ...query });

  return parsed.success
    ? { filters: parsed.data }
    : {
        error:
          "Check the filters. Enter both dates within a 93-day range, choose compatible record and action filters, and use valid record or import identifiers.",
      };
}

export function auditQuery(filters: AuditFilters) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters))
    if (value !== undefined) query.set(key, String(value));

  return query.toString();
}

export function auditHref(filters: AuditFilters) {
  return auditPath + "?" + auditQuery(filters);
}

export function targetHref(
  type: (typeof entities)[number],
  id: string,
  available: boolean,
) {
  const paths = {
    property: "properties",
    lead: "leads",
    task: "tasks",
    viewing: "viewings",
  };

  return available && type !== "import" && z.uuid().safeParse(id).success
    ? "/crm/" + paths[type] + "/" + id
    : null;
}

export function auditTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dubai",
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date(value));
}

export function readable(value: string) {
  const words = value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_.]/g, " ")
    .toLowerCase();

  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function auditValue(
  field: string,
  value: string | string[] | number | boolean | null,
): string {
  if (value === null) return "No value";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.join(", ") || "None";
  if (field === "areaHundredths" && typeof value === "number")
    return formatArea(value / 100);
  if (
    field.endsWith("Fils") &&
    typeof value === "string" &&
    /^-?\d+$/.test(value)
  ) {
    const digits = value.replace("-", "").padStart(3, "0");
    return (
      "AED " +
      (value.startsWith("-") ? "-" : "") +
      BigInt(digits.slice(0, -2)).toLocaleString("en-GB") +
      "." +
      digits.slice(-2)
    );
  }
  if (
    ["startsAt", "endsAt", "dueAt"].includes(field) &&
    typeof value === "string" &&
    z.iso.datetime({ offset: true }).safeParse(value).success
  )
    return auditTime(value) + " Dubai";
  return String(value);
}
