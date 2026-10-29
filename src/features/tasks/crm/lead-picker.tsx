"use client";
import { useEffect, useState } from "react";
import { TextField } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { LeadDetail, LeadList } from "@/features/leads/data/types";
import { getLead } from "@/features/leads/data/queries";
import { stageLabels } from "@/features/leads/data/input";
import { getTaskLeads } from "../data/queries";
import { taskEligibility } from "./presentation";

export function TaskLeadPicker({
  manager,
  selected,
  disabled,
  onSelect,
  onError,
}: {
  manager: boolean;
  selected: LeadDetail | null;
  disabled: boolean;
  onSelect: (lead: LeadDetail) => void;
  onError: (error: unknown) => void;
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<LeadList | null>(null);
  const [busy, setBusy] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setBusy(true);
      try {
        const result = await getTaskLeads(
          query,
          page,
          controller.signal,
          manager ? "all" : "mine",
        );
        if (!controller.signal.aborted) {
          setData(result);
          setMessage("");
        }
      } catch {
        if (!controller.signal.aborted)
          setMessage(
            "Leads could not be loaded. Change the search to try again.",
          );
      } finally {
        if (!controller.signal.aborted) setBusy(false);
      }
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, page, manager]);
  return (
    <div className="space-y-4">
      <TextField
        id="task-lead-search"
        label="Search leads"
        placeholder="Search by lead name"
        value={query}
        disabled={disabled || pendingId !== null}
        onChange={(event) => {
          setQuery(event.target.value);
          setPage(1);
        }}
      />
      {message && (
        <Alert variant="destructive">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
      <fieldset
        disabled={disabled || busy || pendingId !== null}
        aria-busy={busy}
        className="min-w-0 space-y-2"
      >
        <legend className="sr-only">Choose a lead</legend>
        {data?.items.map((lead) => (
          <label
            key={lead.id}
            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${selected?.id === lead.id ? "border-primary bg-muted" : "border-border"}`}
          >
            <input
              type="radio"
              name="task-lead"
              className="mt-1 accent-primary"
              checked={(pendingId ?? selected?.id) === lead.id}
              onChange={async () => {
                setPendingId(lead.id);
                setBusy(true);
                try {
                  onSelect(await getLead(lead.id));
                } catch (error) {
                  onError(error);
                } finally {
                  setPendingId(null);
                  setBusy(false);
                }
              }}
            />
            <span className="min-w-0 text-sm">
              <span className="block font-medium break-words">{lead.name}</span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {lead.assignedAgent?.name || "Unassigned"} ·{" "}
                {stageLabels[lead.stage]}
              </span>
              {taskEligibility(lead) && (
                <span className="mt-1 block text-xs text-muted-foreground">
                  Review lead eligibility before creating a task
                </span>
              )}
            </span>
          </label>
        ))}
        {data?.items.length === 0 && (
          <p className="py-4 text-sm text-muted-foreground">
            No matching leads. Try another name.
          </p>
        )}
      </fieldset>
      {data && data.total > data.pageSize && (
        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || busy || pendingId !== null || page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous leads
          </Button>
          <span className="text-xs text-muted-foreground">Page {page}</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={
              disabled ||
              busy ||
              pendingId !== null ||
              page * data.pageSize >= data.total
            }
            onClick={() => setPage(page + 1)}
          >
            Next leads
          </Button>
        </div>
      )}
    </div>
  );
}
