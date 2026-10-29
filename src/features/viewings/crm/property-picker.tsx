"use client";
import { useEffect, useState } from "react";
import { TextField } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getBookableProperties } from "../data/queries";
import type {
  PropertyList,
  StaffProperty,
} from "@/features/properties/data/types";
export function ViewingPropertyPicker({
  value,
  currentLabel,
  disabled,
  onChange,
}: {
  value: string;
  currentLabel: string;
  disabled: boolean;
  onChange: (id: string, title: string) => void;
}) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PropertyList<StaffProperty>>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      setError("");
      getBookableProperties(q, page, controller.signal)
        .then((result) => {
          if (!controller.signal.aborted) setData(result);
        })
        .catch(() => {
          if (!controller.signal.aborted)
            setError("Properties could not be loaded.");
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 250);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [q, page, retry]);
  return (
    <div className="space-y-3">
      <TextField
        id="viewing-property-search"
        label="Search properties"
        value={q}
        maxLength={120}
        disabled={disabled}
        onChange={(e) => {
          setQ(e.target.value);
          setPage(1);
        }}
        help="Published, available properties only."
      />
      <fieldset
        disabled={disabled || loading}
        className="max-h-72 space-y-2 overflow-y-auto rounded-lg border border-border p-3"
      >
        <legend className="sr-only">Choose a property</legend>
        {value && !data?.items.some((item) => item.id === value) && (
          <label className="flex min-h-11 items-center gap-3 rounded-md bg-muted p-3">
            <input type="radio" name="booking-property" checked readOnly />
            <span className="text-sm break-words">{currentLabel}</span>
          </label>
        )}
        {!loading &&
          data?.items.map((item) => (
            <label
              key={item.id}
              className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-md border p-3 ${value === item.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted"}`}
            >
              <input
                className="mt-1 accent-primary"
                type="radio"
                name="booking-property"
                aria-label={item.title}
                checked={value === item.id}
                onChange={() => onChange(item.id, item.title)}
              />
              <span className="min-w-0">
                <span className="block text-sm font-medium break-words">
                  {item.title}
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {[item.community, item.city].filter(Boolean).join(", ")}
                </span>
              </span>
            </label>
          ))}
        {loading && (
          <p role="status" className="p-3 text-sm text-muted-foreground">
            Loading properties…
          </p>
        )}
        {!loading && !error && data?.items.length === 0 && (
          <p className="p-3 text-sm text-muted-foreground">
            No bookable properties match your search.
          </p>
        )}
      </fieldset>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            {error}
            <Button
              type="button"
              variant="ghost"
              onClick={() => setRetry((n) => n + 1)}
            >
              Retry properties
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {data && data.total > data.pageSize && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <Button
            type="button"
            variant="outline"
            disabled={disabled || loading || page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous properties
          </Button>
          <span>
            Page {page} of {Math.ceil(data.total / data.pageSize)}
          </span>
          <Button
            type="button"
            variant="outline"
            disabled={disabled || loading || page * data.pageSize >= data.total}
            onClick={() => setPage(page + 1)}
          >
            Next properties
          </Button>
        </div>
      )}
    </div>
  );
}
