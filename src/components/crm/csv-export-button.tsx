"use client";

import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useClientReady } from "@/lib/use-client-ready";
import { Icon } from "@/components/ui/icon";
import {
  createCsvExportSession,
  csvNavigationChangesScope,
  dispatchCsvDownload,
  type CsvEntity,
  type CsvExportState,
} from "./csv-export";

export function CsvExportButton({
  entity,
  query,
  scope,
}: {
  entity: CsvEntity;
  query: string;
  scope: string;
}) {
  // A new applied URL mounts a fresh session. Old retained Suspense content stays invalidated.
  return (
    <ExportControl key={`${entity}:${scope}`} entity={entity} query={query} />
  );
}

function ExportControl({
  entity,
  query,
}: {
  entity: CsvEntity;
  query: string;
}) {
  const ready = useClientReady();
  const descriptionId = useId();
  const [state, setState] = useState<CsvExportState>({
    pending: false,
    error: "",
    message: "",
  });
  const [invalidated, setInvalidated] = useState(false);
  const [session] = useState(() =>
    createCsvExportSession({
      fetch: (...args) => fetch(...args),
      download: dispatchCsvDownload,
      onState: setState,
    }),
  );

  useEffect(() => {
    const appliedHref = window.location.href;
    function cancel() {
      session.cancel();
      setInvalidated(true);
    }
    function navigation(event: MouseEvent) {
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const anchor =
        event.target instanceof Element
          ? event.target.closest("a[href]")
          : null;
      if (
        !(anchor instanceof HTMLAnchorElement) ||
        anchor.hasAttribute("download") ||
        (anchor.target && anchor.target !== "_self")
      )
        return;
      if (csvNavigationChangesScope(appliedHref, anchor.href)) cancel();
    }
    function historyNavigation() {
      if (csvNavigationChangesScope(appliedHref, window.location.href))
        cancel();
    }
    window.addEventListener("crm:export-navigation", cancel);
    window.addEventListener("popstate", historyNavigation);
    document.addEventListener("click", navigation, true);
    return () => {
      window.removeEventListener("crm:export-navigation", cancel);
      window.removeEventListener("popstate", historyNavigation);
      document.removeEventListener("click", navigation, true);
      session.cancel();
    };
  }, [session]);

  return (
    <div className="relative shrink-0">
      <Button
        type="button"
        variant="outline"
        className="gap-2 px-3 sm:px-5"
        title="Exports all matching results, up to 5,000 rows."
        aria-describedby={descriptionId}
        disabled={!ready || state.pending || invalidated}
        aria-busy={state.pending}
        onClick={() => {
          if (ready && !invalidated) void session.start(entity, query);
        }}
      >
        <Icon name="download" />
        {state.pending ? "Exporting…" : "Export CSV"}
      </Button>
      <p id={descriptionId} className="sr-only">
        Exports all matching results, up to 5,000 rows.
      </p>
      <p role="status" aria-live="polite" className="sr-only">
        {state.pending ? "Preparing CSV download…" : state.message}
      </p>
      {state.error && (
        <Alert
          variant="destructive"
          className="absolute start-0 top-full z-20 mt-2 w-72 max-w-[calc(100vw-2rem)] pe-14 shadow-md sm:start-auto sm:end-0"
        >
          <AlertDescription>{state.error}</AlertDescription>
          <Button
            type="button"
            variant="outline"
            className="absolute end-1 top-1 w-11 border-transparent p-0"
            aria-label="Dismiss CSV export error"
            onClick={() => setState((current) => ({ ...current, error: "" }))}
          >
            <Icon name="close" />
          </Button>
        </Alert>
      )}
    </div>
  );
}
