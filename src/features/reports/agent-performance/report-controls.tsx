"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import type { FormEvent, MouseEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { SelectField, TextField } from "@/components/forms/fields";
import { FilterPanel } from "@/components/layout/filter-panel";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";
import { useStaffAccount } from "@/features/auth/staff-account";
import { useClientReady } from "@/lib/use-client-ready";
import { parseReportFilters, reportHref, type ReportFilters } from "./filters";
import type { AgentPerformanceReport } from "./response";
import { reportPath } from "./report-path";

const ReportReadContext = createContext<((href: string) => void) | null>(null);

export function ReportReadComplete({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  const completeRead = useContext(ReportReadContext);
  useEffect(() => {
    completeRead?.(href);
  }, [completeRead, href]);
  return children;
}

export function ReportControls({
  filters,
  today,
  children,
}: {
  filters: ReportFilters;
  today: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const ready = useClientReady();
  const [pending, startTransition] = useTransition();
  const [settledHref, setSettledHref] = useState<string>();
  const inFlight = useRef(false);
  const [draftError, setDraftError] = useState<{
    href: string;
    message: string;
  }>();
  const href = reportHref(filters);
  const busy = pending || settledHref !== href;
  const dateError = draftError?.href === href ? draftError.message : undefined;

  useEffect(() => {
    if (!busy) inFlight.current = false;
  }, [busy]);

  function navigate(nextHref?: string) {
    if (!ready || busy || inFlight.current) return;
    inFlight.current = true;
    setSettledHref(undefined);
    setDraftError(undefined);
    startTransition(() => {
      if (nextHref && nextHref !== href) {
        router.push(nextHref, { scroll: false });
      } else {
        router.refresh();
      }
    });
  }

  function apply(event: FormEvent<HTMLDivElement>) {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    const intent = form.dataset.reportForm;
    if (intent !== "dates" && intent !== "agent") return;
    event.preventDefault();
    if (!ready || busy || inFlight.current) return;

    const values = new FormData(form);
    if (intent === "agent") {
      const agentId = values.get("agentId");
      if (typeof agentId === "string") {
        navigate(
          reportHref({ ...filters, agentId: agentId || undefined, page: 1 }),
        );
      }
      return;
    }
    const parsed = parseReportFilters({
      from: String(values.get("from") ?? ""),
      to: String(values.get("to") ?? ""),
      pageSize: String(values.get("pageSize") ?? ""),
      agentId: filters.agentId,
    });
    if ("error" in parsed) {
      setDraftError({ href, message: parsed.error });
      return;
    }
    navigate(reportHref(parsed.filters));
  }

  function followReportLink(event: MouseEvent<HTMLDivElement>) {
    if (!(event.target instanceof Element)) return;
    if (event.target.closest("[data-report-retry]")) {
      navigate();
      return;
    }
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      event.shiftKey
    )
      return;
    const link = event.target.closest<HTMLAnchorElement>(
      'a[data-slot="pagination-link"], a[data-report-clear]',
    );
    if (!link) return;
    const url = new URL(link.href);
    if (url.origin !== window.location.origin || url.pathname !== reportPath)
      return;
    event.preventDefault();
    navigate(`${url.pathname}${url.search}`);
  }

  return (
    <div
      className="min-w-0 space-y-4"
      onSubmit={apply}
      onClickCapture={followReportLink}
    >
      <form data-report-form="dates" onChange={() => setDraftError(undefined)}>
        <FilterPanel
          disabled={!ready || busy}
          busy={busy}
          fieldsClassName="sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(7rem,auto)_auto] lg:items-end"
        >
          <TextField
            key={`from:${filters.from}`}
            id="report-from"
            name="from"
            label="Start date"
            type="date"
            defaultValue={filters.from}
            max={today}
            required
            error={dateError}
            className="min-w-0 bg-card"
          />
          <TextField
            key={`to:${filters.to}`}
            id="report-to"
            name="to"
            label="End date"
            type="date"
            defaultValue={filters.to}
            max={today}
            required
            aria-invalid={dateError ? true : undefined}
            aria-describedby={dateError ? "report-from-error" : undefined}
            className="min-w-0 bg-card"
          />
          <SelectField
            key={filters.pageSize}
            id="report-page-size"
            name="pageSize"
            label="Rows per page"
            defaultValue={filters.pageSize}
          >
            <option value="25">25</option>
            <option value="50">50</option>
          </SelectField>
          <div className="flex flex-wrap gap-2">
            <Button type="submit">Apply dates</Button>
            <Button type="button" variant="outline" onClick={() => navigate()}>
              Refresh
            </Button>
          </div>
        </FilterPanel>
      </form>
      {busy && <LoadingState label="Loading agent performance…" />}
      <div
        hidden={busy}
        className="min-w-0 [html[data-report-restoring]_&]:hidden"
      >
        <ReportReadContext.Provider value={setSettledHref}>
          {children}
        </ReportReadContext.Provider>
      </div>
    </div>
  );
}

export function ReportAgentFilter({
  options,
  agentId,
}: {
  options: AgentPerformanceReport["agentOptions"];
  agentId?: string;
}) {
  const ready = useClientReady();
  return (
    <form data-report-form="agent">
      <FilterPanel
        disabled={!ready}
        fieldsClassName="sm:grid-cols-[minmax(0,24rem)_auto] sm:items-end sm:justify-start"
      >
        <SelectField
          key={agentId}
          id="report-agent"
          name="agentId"
          label="Agent"
          defaultValue={agentId ?? ""}
        >
          <option value="">All agents</option>
          {options.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name}
              {agent.availability === "active"
                ? ""
                : ` (${agent.availability})`}
            </option>
          ))}
        </SelectField>
        <Button type="submit" className="min-w-0 justify-self-start">
          Apply agent
        </Button>
      </FilterPanel>
    </form>
  );
}

export function ReportScope({
  viewerId,
  scope,
  children,
}: {
  viewerId: string;
  scope: AgentPerformanceReport["scope"];
  children: ReactNode;
}) {
  const { ready, identity, pending, sessionError, checkingSession } =
    useStaffAccount();
  if (
    ready &&
    (pending ||
      sessionError ||
      (!identity && !checkingSession) ||
      (identity &&
        (identity.id !== viewerId ||
          (scope === "agency" && identity.role === "agent"))))
  ) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Your report access needs verification. Refresh to continue.
        </AlertDescription>
      </Alert>
    );
  }
  return children;
}
