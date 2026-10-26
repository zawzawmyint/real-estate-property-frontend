"use client";
import { FilterPanel } from "@/components/layout/filter-panel";
import { TextField, SelectField } from "@/components/forms/fields";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useClientReady } from "@/lib/use-client-ready";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Icon } from "@/components/ui/icon";
import { NativeSelectOption } from "@/components/ui/native-select";
import {
  parsePropertyFilters,
  serializePropertyFilters,
  type PropertyFilters,
} from "../data/filters";
import { propertyTypes } from "../data/input";

export function PropertyInventoryFilters({
  filters,
}: {
  filters: PropertyFilters;
}) {
  const router = useRouter();
  const ready = useClientReady();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const query = serializePropertyFilters(filters);

    for (const [key, value] of new FormData(event.currentTarget))
      if (String(value).trim()) query.set(key, String(value).trim());
      else query.delete(key);

    query.set("page", "1");

    try {
      const parsed = parsePropertyFilters(query, true);

      startTransition(() =>
        router.push(`/crm/properties?${serializePropertyFilters(parsed)}`),
      );
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Check your filters.",
      );
    }
  }

  return (
    <div className="space-y-6">
      <form
        key={serializePropertyFilters(filters).toString()}
        onSubmit={submit}
        aria-busy={pending}
      >
        <FilterPanel
          disabled={!ready || pending}
          busy={pending}
          fieldsClassName="sm:grid-cols-2 xl:grid-cols-3"
        >
          <TextField
            label="Search inventory"
            fieldClassName="sm:col-span-2 xl:col-span-3"
            id="inventory-q"
            name="q"
            placeholder="Title, city or community"
            defaultValue={filters.q}
            maxLength={160}
          />
          <InventorySelect
            name="publishingState"
            label="Publishing state"
            value={filters.publishingState}
            options={[
              ["draft", "Draft"],
              ["published", "Published"],
              ["archived", "Archived"],
            ]}
          />
          <InventorySelect
            name="purpose"
            label="Purpose"
            value={filters.purpose}
            options={[
              ["sale", "Buy / Sale"],
              ["rent", "Rent"],
            ]}
          />
          <InventorySelect
            name="type"
            label="Property type"
            value={filters.type}
            options={propertyTypes.map((type) => [
              type,
              `${type[0]?.toUpperCase()}${type.slice(1)}`,
            ])}
          />
          <InventorySelect
            name="availability"
            label="Availability"
            value={filters.availability}
            options={[
              ["available", "Available"],
              ["sold", "Sold"],
              ["rented", "Rented"],
            ]}
          />
          <SelectField
            label="Sort by"
            id="inventory-sort"
            name="sort"
            defaultValue={filters.sort ?? "updated_desc"}
            className="w-full"
          >
            <NativeSelectOption value="updated_desc">
              Recently updated
            </NativeSelectOption>
            <NativeSelectOption value="newest">Newest</NativeSelectOption>
            <NativeSelectOption value="price_asc">
              Price: low to high
            </NativeSelectOption>
            <NativeSelectOption value="price_desc">
              Price: high to low
            </NativeSelectOption>
          </SelectField>
          <div className="flex flex-wrap items-end gap-3">
            <Button
              type="submit"
              className="gap-2"
              disabled={pending}
              aria-busy={pending}
              aria-label={pending ? "Searching…" : "Search"}
              title={pending ? "Searching…" : "Search"}
            >
              {pending ? (
                <Spinner className="size-5" />
              ) : (
                <Icon name="search" />
              )}
              {pending ? "Searching…" : "Search"}
            </Button>
            <Link
              href="/crm/properties"
              aria-label="Clear filters"
              title="Clear filters"
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium text-primary transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              <Icon name="close" />
              Clear filters
            </Link>
          </div>
        </FilterPanel>
      </form>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

function InventorySelect({
  name,
  label,
  value,
  options,
}: {
  name: string;
  label: string;
  value: string | undefined;
  options: string[][];
}) {
  return (
    <SelectField
      label={label}
      id={`inventory-${name}`}
      name={name}
      defaultValue={value ?? ""}
      className="w-full"
    >
      <NativeSelectOption value="">All</NativeSelectOption>
      {options.map(([key, text]) => (
        <NativeSelectOption key={key} value={key}>
          {text}
        </NativeSelectOption>
      ))}
    </SelectField>
  );
}
