import { z } from "zod";
import {
  auditFiltersSchema,
  dateRange,
  dubaiDate,
  type AuditFilters,
} from "./filters";

export function auditFormSchema(filters: AuditFilters) {
  const initialStart = dubaiDate(Date.parse(filters.from));
  const initialEnd = dubaiDate(Date.parse(filters.to) - 1);

  return z
    .strictObject({
      start: z.iso.date("Choose a valid start date."),
      end: z.iso.date("Choose a valid end date."),
      entity: z.string(),
      action: z.string(),
      entityId: z.string(),
      actorId: z.string(),
      kind: z.string(),
      importId: z.string(),
    })
    .transform((values, ctx) => {
      const dates =
        values.start === initialStart && values.end === initialEnd
          ? { from: filters.from, to: filters.to }
          : dateRange(values.start, values.end);

      if (!dates) {
        ctx.addIssue({
          code: "custom",
          path: ["end"],
          message:
            "Choose an end date on or after the start, spanning up to 93 Dubai calendar dates.",
        });
        return z.NEVER;
      }

      const parsed = auditFiltersSchema.safeParse({
        ...dates,
        pageSize: String(filters.pageSize),
        entityType: values.entity || undefined,
        action: values.action || undefined,
        entityId: values.entityId || undefined,
        actorId: values.actorId || undefined,
        actorKind: values.kind || undefined,
        importId: values.importId || undefined,
      });

      if (parsed.success) return parsed.data;

      const fields: Record<string, string> = {
        entityType: "entity",
        actorKind: "kind",
        from: "start",
        to: "end",
      };

      for (const issue of parsed.error.issues) {
        const field = String(issue.path[0] ?? "end");
        ctx.addIssue({
          code: "custom",
          path: [fields[field] ?? field],
          message: issue.message,
        });
      }

      return z.NEVER;
    });
}
