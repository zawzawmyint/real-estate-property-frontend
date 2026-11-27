"use client";

import { useEffect, useState } from "react";
import { SelectField, TextField } from "@/components/forms/fields";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { actorsSchema, type AuditActors } from "./response";
import { useAuditDenial } from "./access";

export function ActorPicker({
  actorId,
  error,
  onChange,
}: {
  actorId: string;
  error?: string;
  onChange: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{
    query: string;
    data: AuditActors | null;
  } | null>(null);
  const deny = useAuditDenial();

  const query = new URLSearchParams({
    q: search,
    page: String(page),
    pageSize: "20",
  }).toString();

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          "/api/v1/staff/audit-log/actors?" + query,
          { signal: controller.signal, cache: "no-store", redirect: "error" },
        );
        if (response.status === 401 || response.status === 403) {
          if (!controller.signal.aborted) deny(response.status);
          return;
        }
        if (!response.ok) throw Error();

        const data = actorsSchema.parse(await response.json());
        if (!controller.signal.aborted) setResult({ query, data });
      } catch {
        if (!controller.signal.aborted) setResult({ query, data: null });
      }
    }, 180);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, deny, attempt]);

  const data = result?.query === query ? result.data : undefined;

  function searchActors(value: string) {
    setSearch(value);
    setPage(1);
  }

  return (
    <div className="grid min-w-0 gap-2">
      <TextField
        id="actor-search"
        label="Search historical actors"
        value={search}
        maxLength={100}
        onChange={(e) => searchActors(e.target.value)}
      />
      <SelectField
        id="audit-actor"
        label="Historical staff actor"
        error={error}
        value={actorId}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">All historical actors</option>
        {actorId && !data?.items.some((a) => a.id === actorId) && (
          <option value={actorId}>{actorId}</option>
        )}
        {data?.items.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name} ({a.role})
          </option>
        ))}
      </SelectField>
      {data === null ? (
        <Alert variant="destructive">
          <AlertDescription>
            Actor choices unavailable.{" "}
            <Button
              type="button"
              variant="outline"
              onClick={() => setAttempt((a) => a + 1)}
            >
              Retry actors
            </Button>
          </AlertDescription>
        </Alert>
      ) : data === undefined ? (
        <span role="status">Loading actor choices…</span>
      ) : (
        <div className="flex flex-wrap gap-2">
          {page > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setPage(page - 1)}
            >
              Previous actors
            </Button>
          )}
          {page * data.pageSize < data.total && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setPage(page + 1)}
            >
              Next actors
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
