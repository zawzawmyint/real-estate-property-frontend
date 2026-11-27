import { z } from "zod";
import type { components } from "@/lib/api/generated/record-audit-log";
import { actions, entities } from "./filters";
import { staffRoles } from "@/lib/auth/roles";

type Contract = components["schemas"];
const role = z.enum(staffRoles);
const identity = z.object({ id: z.string().min(1), name: z.string(), role });
const page = {
  page: z.int().positive(),
  pageSize: z.int().min(1).max(100),
  total: z.int().nonnegative(),
};

export const actorsSchema = z.object({
  ...page,
  items: z.array(identity),
}) satisfies z.ZodType<Contract["AuditActorPage"]>;

const value = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  z.array(z.string()),
]);

const change = z.discriminatedUnion("redacted", [
  z.strictObject({ field: z.string(), redacted: z.literal(true) }),
  z.strictObject({
    field: z.string(),
    redacted: z.literal(false),
    before: value,
    after: value,
  }),
]);

const eventSchema = z.object({
  id: z.uuid(),
  schemaVersion: z.literal(1),
  occurredAt: z.iso.datetime({ offset: true }),
  actor: z.union([
    identity.extend({ kind: z.literal("staff") }),
    z.object({
      kind: z.enum(["website", "system"]),
      name: z.null(),
      role: z.null(),
      id: z.null(),
    }),
  ]),
  entity: z.object({
    type: z.enum(entities),
    id: z.uuid(),
    label: z.string(),
    available: z.boolean(),
  }),
  action: z.enum(actions),
  changes: z.array(change),
  import: z
    .object({
      id: z.uuid(),
      kind: z.enum(["property", "lead"]),
      createdCount: z.int().nonnegative().nullable(),
    })
    .nullable(),
});

export const eventsSchema = z.object({
  ...page,
  items: z.array(eventSchema),
  coverage: z.object({
    startedAt: z.iso.datetime({ offset: true }),
    version: z.literal(1),
    historicalBackfill: z.literal(false),
  }),
}) satisfies z.ZodType<Contract["AuditPage"]>;

export type AuditEvent = z.infer<typeof eventSchema>;
export type AuditActors = z.infer<typeof actorsSchema>;
