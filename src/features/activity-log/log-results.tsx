import Link from "next/link";
import { CollectionPagination } from "@/components/crm/collection-pagination";
import { DataTable, type DataColumn } from "@/components/crm/data-table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  auditHref,
  auditTime,
  readable,
  targetHref,
  type AuditFilters,
} from "./filters";
import type { AuditEvent } from "./response";
import { getEvents } from "./server";
import { ChangeDetails } from "./change-details";
import { ResponseDenied } from "./access";

function target(row: AuditEvent, filters: AuditFilters) {
  const { type, id, label, available } = row.entity;
  const href = targetHref(type, id, available);

  return (
    <div className="grid max-w-sm gap-1 whitespace-normal wrap-anywhere">
      {href ? (
        <Link className="underline" href={href}>
          {label}
        </Link>
      ) : (
        <span>{label}</span>
      )}
      {!href && type !== "import" && <small>Record unavailable</small>}
      {row.import && (
        <>
          {row.import.createdCount !== null && (
            <span>{row.import.createdCount} records created</span>
          )}
          <Link
            className="underline"
            href={auditHref({
              from: filters.from,
              to: filters.to,
              pageSize: filters.pageSize,
              page: 1,
              importId: row.import.id,
            })}
          >
            View import activity
          </Link>
        </>
      )}
    </div>
  );
}

export async function LogResults({ filters }: { filters: AuditFilters }) {
  const result = await getEvents(filters);

  if (result.status === 401 || result.status === 403)
    return <ResponseDenied status={result.status} />;

  if (!result.data)
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Activity log unavailable. Use Refresh to try again with these filters.
        </AlertDescription>
      </Alert>
    );

  const data = result.data;
  const columns: DataColumn<AuditEvent>[] = [
    {
      id: "time",
      header: "Time (Dubai)",
      cell: (r) => (
        <time dateTime={r.occurredAt}>{auditTime(r.occurredAt)}</time>
      ),
    },
    {
      id: "actor",
      header: "Actor",
      cell: (r) =>
        r.actor.kind === "staff"
          ? r.actor.name + " (" + readable(r.actor.role) + ")"
          : readable(r.actor.kind),
    },
    { id: "action", header: "Action", cell: (r) => readable(r.action) },
    { id: "target", header: "Record", cell: (r) => target(r, filters) },
    {
      id: "changes",
      header: "Changes",
      cell: (r) => <ChangeDetails changes={r.changes} />,
    },
  ];

  return (
    <section aria-label="Recorded activity" className="grid min-w-0 gap-4">
      <p className="text-sm text-muted-foreground">
        Changes recorded from {auditTime(data.coverage.startedAt)} Dubai.
      </p>
      <DataTable
        label="Activity log events"
        variant="workspace"
        rows={data.items}
        columns={columns}
        getRowKey={(r) => r.id}
        empty={<p role="status">No recorded changes match these filters.</p>}
        renderMobile={(row) => (
          <dl className="grid gap-3 rounded-xl border bg-card p-4">
            {columns.map((c) => (
              <div key={c.id} className="min-w-0 wrap-anywhere">
                <dt className="text-sm text-muted-foreground">{c.header}</dt>
                <dd>{c.cell(row)}</dd>
              </div>
            ))}
          </dl>
        )}
      />
      <CollectionPagination
        variant="workspace"
        page={data.page}
        pageSize={data.pageSize}
        total={data.total}
        href={(page) => auditHref({ ...filters, page })}
      />
    </section>
  );
}
