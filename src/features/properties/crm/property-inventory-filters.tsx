"use client";
import { buttonVariants } from "@/components/ui/button-variants";
import { CollectionToolbar } from "@/components/crm/collection-toolbar";
import { FilterChip } from "@/components/crm/filter-chip";
import { TextField, SelectField } from "@/components/forms/fields";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
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
  const [expanded, setExpanded] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const restoreFocus = useRef(false);
  const appliedQuery = serializePropertyFilters(filters).toString();
  const chips = [
    { key: "q", label: "Search", value: filters.q },
    {
      key: "publishingState",
      label: "Publishing",
      value: filters.publishingState,
    },
    {
      key: "purpose",
      label: "Purpose",
      value: filters.purpose === "sale" ? "Buy / Sale" : filters.purpose,
    },
    { key: "type", label: "Type", value: filters.type },
    { key: "availability", label: "Availability", value: filters.availability },
  ].filter((chip) => chip.value);
  const advancedCount = chips.filter((chip) => chip.key !== "q").length;

  useEffect(() => {
    if (restoreFocus.current) {
      searchRef.current?.focus();
      restoreFocus.current = false;
    }
  }, [appliedQuery]);

  function removeFilter(key: string) {
    const query = serializePropertyFilters(filters);
    query.delete(key);
    query.set("page", "1");
    restoreFocus.current = true;
    setError("");
    startTransition(() => router.push(`/crm/properties?${query}`));
  }

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
    <div className="space-y-3">
      <form key={appliedQuery} onSubmit={submit} aria-busy={pending}>
        <fieldset disabled={!ready || pending} className="min-w-0">
          <CollectionToolbar
            filters={
              <div
                id="inventory-advanced-filters"
                hidden={!expanded}
                className={
                  expanded
                    ? "grid min-w-0 gap-3 pt-2 sm:grid-cols-2 xl:grid-cols-4"
                    : "hidden"
                }
              >
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
              </div>
            }
            chips={
              chips.length > 0 && (
                <div
                  className="flex min-w-0 flex-wrap items-center gap-2"
                  aria-label="Applied inventory filters"
                  role="group"
                >
                  {chips.map(({ key, label, value }) => {
                    const text =
                      key === "q"
                        ? value
                        : `${value?.[0]?.toUpperCase()}${value?.slice(1)}`;
                    return (
                      <FilterChip
                        key={key}
                        removeLabel={`Remove ${label}: ${text}`}
                        onRemove={() => removeFilter(key)}
                      >
                        {label}: {text}
                      </FilterChip>
                    );
                  })}
                  <Link
                    href="/crm/properties"
                    aria-disabled={!ready || pending}
                    tabIndex={!ready || pending ? -1 : undefined}
                    onClick={(event) => {
                      if (!ready || pending) event.preventDefault();
                      else restoreFocus.current = true;
                    }}
                    className={buttonVariants({
                      variant: "ghost",
                      size: "sm",
                      className: "min-h-8 shrink-0 gap-2 text-base",
                    })}
                  >
                    Clear all
                  </Link>
                </div>
              )
            }
          >
            <div
              role="group"
              aria-label="Inventory search and filters"
              className="grid min-w-0 grid-cols-2 items-center gap-4 lg:grid-cols-[minmax(0,1.8fr)_148px_minmax(220px,1fr)_108px]"
            >
              <div className="relative col-span-2 min-w-0 lg:col-span-1">
                <Icon
                  name="search"
                  className="pointer-events-none absolute start-4 top-1/2 z-10 size-5 -translate-y-1/2 text-muted-foreground"
                />
                <TextField
                  label="Search inventory"
                  fieldClassName="min-w-0 gap-0 [&>label]:sr-only"
                  className="h-12 ps-11"
                  id="inventory-q"
                  name="q"
                  placeholder="Search properties"
                  defaultValue={filters.q ?? ""}
                  ref={searchRef}
                  maxLength={160}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-expanded={expanded}
                aria-controls="inventory-advanced-filters"
                className="min-h-12 gap-2 px-4 text-base"
                onClick={() => setExpanded((value) => !value)}
              >
                <Icon name="filter" className="size-5" />
                Filters{advancedCount ? ` · ${advancedCount}` : ""}
              </Button>
              <SelectField
                label="Sort by"
                fieldClassName="min-w-0 gap-0 [&>label]:sr-only"
                id="inventory-sort"
                name="sort"
                defaultValue={filters.sort ?? "updated_desc"}
                className="w-full [&_select]:h-12 [&_select]:bg-card [&_select]:text-base"
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
              <Button
                type="submit"
                size="sm"
                className="col-span-2 min-h-12 gap-2 px-5 text-base lg:col-span-1"
                aria-busy={pending}
              >
                {pending && <Spinner className="size-4" />}
                {pending ? "Applying…" : "Apply"}
              </Button>
            </div>
          </CollectionToolbar>
        </fieldset>
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
