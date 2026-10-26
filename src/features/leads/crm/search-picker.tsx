"use client";
import { useEffect, useId, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FieldLabel } from "@/components/ui/field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getCandidates, getPropertyCandidates } from "../data/queries";

type Option = { id: string; name: string; purpose?: "sale" | "rent" };
export function SearchPicker({
  kind,
  value,
  onChange,
  disabled = false,
  currentLabel,
}: {
  kind: "agent" | "property";
  value: string;
  onChange: (value: string, option?: Option) => void;
  disabled?: boolean;
  currentLabel?: string;
}) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<{
    items: Option[];
    total: number;
    pageSize: number;
  }>();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      setError("");
      const request =
        kind === "agent"
          ? getCandidates(query, page, controller.signal).then((data) => ({
              ...data,
              items: data.items.map((item) => ({
                id: item.id,
                name: item.name,
              })),
            }))
          : getPropertyCandidates(query, page, controller.signal);
      request
        .then(setResult)
        .catch(() => {
          if (!controller.signal.aborted)
            setError("Options could not be loaded.");
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [kind, page, query, retry]);
  return (
    <div className="min-w-0 space-y-3">
      <FieldLabel htmlFor={`${id}-search`}>
        Search {kind === "agent" ? "active agents" : "properties"}
      </FieldLabel>
      <Input
        id={`${id}-search`}
        value={query}
        maxLength={120}
        disabled={disabled}
        placeholder={
          kind === "agent" ? "Search by agent name" : "Search by property title"
        }
        onChange={(event) => {
          setQuery(event.target.value);
          setPage(1);
        }}
      />
      <fieldset
        disabled={disabled || loading}
        className="max-h-52 overflow-y-auto rounded-lg border border-border p-2"
      >
        <legend className="sr-only">Select {kind}</legend>
        <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-2 hover:bg-muted">
          <input
            type="radio"
            name={id}
            checked={!value}
            onChange={() => onChange("")}
          />
          <span>
            {kind === "agent" ? "Unassigned" : "No property selected"}
          </span>
        </label>
        {value && !result?.items.some((item) => item.id === value) && (
          <label className="flex min-h-11 items-center gap-3 rounded-md bg-muted px-2">
            <input type="radio" name={id} checked readOnly />
            <span className="break-words">
              {currentLabel || "Current selection"}
            </span>
          </label>
        )}
        {!loading &&
          result?.items.map((item) => (
            <label
              key={item.id}
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-2 hover:bg-muted"
            >
              <input
                type="radio"
                name={id}
                checked={value === item.id}
                onChange={() => onChange(item.id, item)}
              />
              <span className="min-w-0 break-words">{item.name}</span>
            </label>
          ))}
        {loading && (
          <p role="status" className="p-3 text-sm text-muted-foreground">
            Loading options…
          </p>
        )}
        {!loading && !error && result?.items.length === 0 && (
          <p className="p-3 text-sm text-muted-foreground">
            {kind === "agent"
              ? "No active agents found."
              : "No eligible properties on this result page."}
          </p>
        )}
      </fieldset>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            {error}{" "}
            <Button
              type="button"
              variant="ghost"
              onClick={() => setRetry((value) => value + 1)}
            >
              Retry options
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {result && result.total > result.pageSize && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <Button
            type="button"
            variant="outline"
            disabled={disabled || loading || page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous options
          </Button>
          <span>
            Page {page} of {Math.ceil(result.total / result.pageSize)}
          </span>
          <Button
            type="button"
            variant="outline"
            disabled={
              disabled || loading || page * result.pageSize >= result.total
            }
            onClick={() => setPage(page + 1)}
          >
            Next options
          </Button>
        </div>
      )}
    </div>
  );
}
