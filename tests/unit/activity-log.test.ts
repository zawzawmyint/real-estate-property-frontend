import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ChangeDetails } from "@/features/activity-log/change-details";
import { eventsSchema } from "@/features/activity-log/response";
import { auditFormSchema } from "@/features/activity-log/input";
import { expect, it } from "vitest";
import {
  parseAuditFilters,
  dateRange,
  targetHref,
  auditValue,
} from "@/features/activity-log/filters";

it("uses seven Dubai dates even when the UTC date differs", () => {
  expect(parseAuditFilters({}, new Date("2026-11-26T21:00:00Z"))).toMatchObject(
    {
      filters: {
        from: "2026-11-21T00:00:00+04:00",
        to: "2026-11-28T00:00:00+04:00",
      },
    },
  );
});

const appliedFilters = {
  from: "2026-11-01T12:30:01Z",
  to: "2026-11-02T15:20:02Z",
  page: 3,
  pageSize: 20,
};
const formValues = {
  start: "2026-11-01",
  end: "2026-11-02",
  entity: "",
  action: "",
  entityId: "",
  actorId: "",
  kind: "",
  importId: "",
};

it("validates filter form values without rounding unchanged direct-link instants", () => {
  const schema = auditFormSchema(appliedFilters);

  expect(schema.parse(formValues)).toEqual({ ...appliedFilters, page: 1 });
  expect(schema.parse({ ...formValues, end: "2026-11-03" })).toMatchObject({
    from: "2026-11-01T00:00:00+04:00",
    to: "2026-11-04T00:00:00+04:00",
    page: 1,
  });
});

it("keeps historical actor and business filters while resetting the page", () => {
  const id = "01234567-89ab-4def-abcd-0123456789ab";
  const parsed = auditFormSchema(appliedFilters).parse({
    ...formValues,
    entity: "lead",
    entityId: id,
    action: "lead.created",
    actorId: "deleted-staff-account",
    importId: id,
  });

  expect(parsed).toMatchObject({
    ...appliedFilters,
    page: 1,
    entityType: "lead",
    entityId: id,
    action: "lead.created",
    actorId: "deleted-staff-account",
    importId: id,
  });
});

it.each([
  [{ start: "" }, "start"],
  [{ end: "2026-11-00" }, "end"],
  [{ end: "2026-10-01" }, "end"],
  [{ end: "2027-11-01" }, "end"],
  [{ entity: "property", entityId: "invalid" }, "entityId"],
  [{ importId: "invalid" }, "importId"],
  [{ entityId: "01234567-89ab-4def-abcd-0123456789ab" }, "entityId"],
  [{ entity: "task", action: "lead.created" }, "action"],
  [{ actorId: "historical-actor", kind: "staff" }, "actorId"],
])(
  "associates filter validation with the affected field: %j",
  (changes, field) => {
    const result = auditFormSchema(appliedFilters).safeParse({
      ...formValues,
      ...changes,
    });

    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues.some((issue) => issue.path[0] === field)).toBe(
        true,
      );
  },
);
it("validates inclusive calendar windows and preserves precise instants", () => {
  expect(dateRange("2024-02-30", "2024-03-01")).toBeNull();
  expect(dateRange("2026-01-01", "2026-04-03")).toBeTruthy();
  expect(dateRange("2026-01-01", "2026-04-04")).toBeNull();
  const from = "2026-11-01T12:30:01Z",
    to = "2026-11-02T15:20:02Z";
  expect(parseAuditFilters({ from, to })).toMatchObject({
    filters: { from, to },
  });
});

it.each([
  { actorId: "one", actorKind: "staff" },
  { action: "lead.created", entityType: "task" },
  { entityId: "invalid" },
  { page: ["1", "2"] },
  { page: "9999999999999999" },
  { extra: "test" },
])("rejects invalid filters %j", (filters) => {
  expect(parseAuditFilters(filters)).toHaveProperty("error");
});

it("escapes recorded text and only displays the field name for markers", () => {
  const html = renderToStaticMarkup(
    createElement(ChangeDetails, {
      changes: [
        { field: "description", redacted: true },
        {
          field: "title",
          redacted: false,
          before: null,
          after: "<script>alert(1)</script>",
        },
      ],
    }),
  );
  expect(html).toContain("Value hidden");
  expect(html).toContain("&lt;script&gt;");
  expect(html).not.toContain("<script>");
});

it("rejects redaction markers containing raw values and incomplete coverage", () => {
  const id = "01234567-89ab-4def-abcd-0123456789ab";
  const stamp = "2026-11-26T12:00:00Z";
  const event = {
    id,
    schemaVersion: 1,
    occurredAt: stamp,
    actor: { kind: "system", id: null, name: null, role: null },
    entity: { type: "property", id, label: "Property", available: false },
    action: "property.deleted",
    import: null,
    changes: [{ field: "ownerPhone", redacted: true }],
  };
  const page = {
    items: [event],
    total: 1,
    page: 1,
    pageSize: 20,
    coverage: { startedAt: stamp, version: 1, historicalBackfill: false },
  };
  expect(eventsSchema.safeParse(page).success).toBe(true);
  expect(eventsSchema.safeParse({ ...page, coverage: null }).success).toBe(
    false,
  );
  expect(
    eventsSchema.safeParse({
      ...page,
      items: [
        {
          ...event,
          changes: [{ field: "ownerPhone", redacted: true, after: "private" }],
        },
      ],
    }).success,
  ).toBe(false);
});

it("formats fils exactly and only links available business records", () => {
  expect(auditValue("priceFils", "9876543210123456789")).toBe(
    "AED 98,765,432,101,234,567.89",
  );
  expect(auditValue("flag", false)).toBe("No");
  expect(auditValue("count", 0)).toBe("0");
  expect(auditValue("count", null)).toBe("No value");
  expect(targetHref("property", "../../bad", true)).toBeNull();
  expect(
    targetHref("property", "01234567-89ab-4def-abcd-0123456789ab", false),
  ).toBeNull();
});

it("formats stored property area in square feet", () => {
  expect(auditValue("areaHundredths", 123456)).toBe("1,234.56 sqft");
  expect(auditValue("areaHundredths", 0)).toBe("0 sqft");
});

it("only localizes timestamps for viewing and task date fields", () => {
  const value = "2026-11-26T00:00:00Z";
  expect(auditValue("title", value)).toBe(value);
  for (const field of ["startsAt", "endsAt", "dueAt"])
    expect(auditValue(field, value)).toBe("26 Nov 2026, 04:00:00 Dubai");
});
