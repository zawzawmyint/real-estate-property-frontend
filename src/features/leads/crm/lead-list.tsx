"use client";
import { DataTable, type DataColumn } from "@/components/crm/data-table";
import { CollectionPagination } from "@/components/crm/collection-pagination";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { LeadList as LeadListData } from "../data/types";
import { leadQuery, leadsHref, type LeadFilters } from "../data/filters";
import { AssignmentDialog } from "./assignment-dialog";
import {
  StageBadge,
  SourceBadge,
  LeadDate,
  AssigneeContext,
  budgetLabel,
} from "./lead-presentation";
type LeadRow = LeadListData["items"][number];

export function LeadList({
  result,
  filters,
  manager,
}: {
  result: LeadListData;
  filters: LeadFilters;
  manager: boolean;
}) {
  const [announcement, setAnnouncement] = useState("");
  const query = leadQuery(filters);
  const filtered = Boolean(
    filters.q || filters.stage || filters.source || filters.agentId,
  );
  const detail = (id: string) =>
    `/crm/leads/${id}?from=${encodeURIComponent(query)}`;
  const columns: DataColumn<LeadRow>[] = [
    {
      id: "lead",
      header: "Lead",
      className: "max-w-56 py-5",
      cell: (lead) => (
        <>
          <Link
            href={detail(lead.id)}
            className="font-semibold text-primary underline-offset-4 hover:underline break-words"
          >
            {lead.name}
          </Link>
          <p className="mt-1 break-all text-xs text-muted-foreground">
            {lead.phone || lead.email}
          </p>
        </>
      ),
    },
    {
      id: "property",
      header: "Property / Preference",
      className: "max-w-52",
      cell: (lead) => (
        <>
          <p className="break-words">
            {lead.property?.title || "No property selected"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {lead.purpose === "sale" ? "Buy" : "Rent"} ·{" "}
            {budgetLabel(lead.budgetFils, lead.purpose)}
          </p>
        </>
      ),
    },
    {
      id: "source",
      header: "Source",
      cell: (lead) => <SourceBadge source={lead.source} />,
    },
    {
      id: "stage",
      header: "Stage",
      cell: (lead) => <StageBadge stage={lead.stage} />,
    },
    ...(manager
      ? [
          {
            id: "assignee",
            header: "Assigned agent",
            className: "max-w-40 whitespace-normal",
            cell: (lead: LeadRow) => (
              <AssigneeContext lead={lead} manager={manager} />
            ),
          },
        ]
      : []),
    {
      id: "received",
      header: "Received",
      className: "text-xs text-muted-foreground",
      cell: (lead) => <LeadDate value={lead.createdAt} />,
    },
    ...(manager
      ? [
          {
            id: "assignment",
            header: <span className="sr-only">Assignment actions</span>,
            cell: (lead: LeadRow) => (
              <AssignmentDialog
                lead={lead}
                onSaved={(_, message) => setAnnouncement(message)}
              />
            ),
          },
        ]
      : []),
  ];
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <p>
          {result.total} {result.total === 1 ? "lead" : "leads"}
          {filtered ? " matching filters" : ""}
        </p>
        {manager && result.unassignedCount !== null && (
          <Badge variant="outline">{result.unassignedCount} unassigned</Badge>
        )}
      </div>
      <p role="status" className="sr-only">
        {announcement}
      </p>
      <DataTable
        rows={result.items}
        columns={columns}
        getRowKey={(lead) => lead.id}
        label="Leads"
        empty={
          <div className="rounded-xl border border-dashed border-border bg-card px-6 py-14 text-center">
            <h2 className="text-xl font-semibold">
              {filtered
                ? "No leads match your filters."
                : filters.view === "unassigned"
                  ? "All inquiries have been assigned."
                  : filters.view === "mine"
                    ? "No leads assigned to you yet."
                    : "No leads yet."}
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              {filtered
                ? "Try broadening your search or clearing filters."
                : "New leads will appear here when they are received."}
            </p>
            {filtered && (
              <Link
                href={leadsHref({
                  view: filters.view,
                  sort: "newest",
                  page: 1,
                })}
                className="mt-4 inline-flex min-h-11 items-center text-sm text-primary underline"
              >
                Clear filters
              </Link>
            )}
          </div>
        }
        renderMobile={(lead) => (
          <article className="min-w-0 rounded-xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <Link
                href={detail(lead.id)}
                className="min-w-0 break-words font-semibold text-primary"
              >
                {lead.name}
              </Link>
              <StageBadge stage={lead.stage} />
            </div>
            <p className="mt-2 break-all text-sm text-muted-foreground">
              {lead.phone || lead.email}
            </p>
            <p className="mt-5 break-words text-sm">
              {lead.property?.title || "No property selected"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {lead.purpose === "sale" ? "Buy" : "Rent"} ·{" "}
              {budgetLabel(lead.budgetFils, lead.purpose)}
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
              <SourceBadge source={lead.source} />
              <LeadDate value={lead.createdAt} />
            </div>
            {manager && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="min-w-0 break-words text-xs text-muted-foreground">
                  <AssigneeContext lead={lead} manager={manager} />
                </p>
                <AssignmentDialog
                  lead={lead}
                  onSaved={(_, message) => setAnnouncement(message)}
                />
              </div>
            )}
          </article>
        )}
      />
      <CollectionPagination
        page={result.page}
        pageSize={20}
        total={result.total}
        href={(page) => leadsHref({ ...filters, page })}
        showTotal
      />
    </div>
  );
}
