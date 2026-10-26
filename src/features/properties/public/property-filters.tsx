"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Spinner } from "@/components/ui/spinner";
import { NavigationPending } from "@/components/ui/navigation-pending";
import { TextField, SelectField } from "@/components/forms/fields";
import { PublicSearchPanel } from "@/components/layout/public-search-panel";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  parseAedFilterToFils,
  filsToAed,
  propertyTypes,
  propertyPurposes,
} from "../data/input";
import { parsePublicFilters, serializePropertyFilters } from "../data/filters";
import { cn } from "@/lib/utils";
import { useClientReady } from "@/lib/use-client-ready";

const optionalMoney = z.string().refine((value) => {
  if (!value) return true;

  try {
    parseAedFilterToFils(value);

    return true;
  } catch {
    return false;
  }
}, "Enter an AED amount with up to two decimal places, within the allowed budget.");

const filterSchema = z
  .object({
    purpose: z.enum(propertyPurposes),
    location: z.string().trim().max(120, "Use no more than 120 characters."),
    type: z.enum(["", ...propertyTypes]),
    minPrice: optionalMoney,
    maxPrice: optionalMoney,
    minBedrooms: z
      .string()
      .refine(
        (value) => value === "" || /^(?:[0-9]|1[0-9]|20)$/.test(value),
        "Choose a minimum number of bedrooms.",
      ),
  })
  .superRefine((values, context) => {
    if (!values.minPrice || !values.maxPrice) return;

    try {
      if (
        parseAedFilterToFils(values.minPrice) >
        parseAedFilterToFils(values.maxPrice)
      )
        context.addIssue({
          code: "custom",
          path: ["maxPrice"],
          message: "Maximum price must be at least the minimum price.",
        });
    } catch {
      /* Individual money fields already describe invalid input. */
    }
  });

type FilterValues = z.infer<typeof filterSchema>;

function SearchForm({
  query = "",
  id,
  home = false,
  onApplied,
}: {
  query?: string;
  id: string;
  home?: boolean;
  onApplied?: () => void;
}) {
  const router = useRouter();
  const ready = useClientReady();
  const [pending, startTransition] = useTransition();
  const applied = parsePublicFilters(new URLSearchParams(query));
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FilterValues>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      purpose: applied.purpose ?? "sale",
      location: applied.location ?? "",
      type: applied.type ?? "",
      minPrice:
        applied.minPriceFils === undefined
          ? ""
          : filsToAed(applied.minPriceFils),
      maxPrice:
        applied.maxPriceFils === undefined
          ? ""
          : filsToAed(applied.maxPriceFils),
      minBedrooms: applied.minBedrooms?.toString() ?? "",
    },
  });

  function applyFilters(values: FilterValues) {
    const next = serializePropertyFilters({
      ...applied,
      purpose: values.purpose,
      location: values.location || undefined,
      type: values.type || undefined,
      minPriceFils: values.minPrice
        ? parseAedFilterToFils(values.minPrice)
        : undefined,
      maxPriceFils: values.maxPrice
        ? parseAedFilterToFils(values.maxPrice)
        : undefined,
      minBedrooms:
        values.minBedrooms === "" ? undefined : Number(values.minBedrooms),
      page: 1,
    });

    if (next.toString() === query) onApplied?.();
    startTransition(() => router.push(`/properties?${next}`));
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    return handleSubmit(applyFilters)(event);
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      aria-busy={pending}
      aria-label={home ? "Find a property" : "Filter properties"}
      className="space-y-5"
    >
      <fieldset disabled={!ready || pending} className="min-w-0 space-y-5">
        <fieldset className="flex gap-2 border-b border-border">
          <legend className="sr-only">Purpose</legend>
          {(
            [
              ["sale", "Buy"],
              ["rent", "Rent"],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className="relative cursor-pointer">
              <input
                type="radio"
                value={value}
                {...register("purpose")}
                className="peer sr-only"
              />
              <span className="inline-flex min-h-12 min-w-20 items-center justify-center border-b-2 border-transparent px-5 text-sm font-medium text-muted-foreground peer-checked:border-primary peer-checked:text-primary peer-focus-visible:rounded peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring">
                {label}
              </span>
            </label>
          ))}
        </fieldset>
        <div
          className={cn(
            "grid items-start gap-4",
            home
              ? "sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1.5fr_auto]"
              : "sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1.5fr_1fr_auto]",
          )}
        >
          <TextField
            id={`${id}-location`}
            label="Location"
            placeholder="City or community"
            autoComplete="off"
            {...register("location")}
            error={errors.location?.message}
          />
          <SelectField
            id={`${id}-type`}
            label="Property type"
            {...register("type")}
            error={errors.type?.message}
            className="w-full [&_select]:min-h-12 [&_select]:bg-card"
          >
            <NativeSelectOption value="">Any type</NativeSelectOption>
            {propertyTypes.map((type) => (
              <NativeSelectOption key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </NativeSelectOption>
            ))}
          </SelectField>
          <div className="grid grid-cols-2 gap-3">
            <TextField
              id={`${id}-min-price`}
              label="Min. price (AED)"
              inputMode="decimal"
              placeholder="No minimum"
              {...register("minPrice")}
              error={errors.minPrice?.message}
              aria-describedby={`${id}-budget-note`}
            />
            <TextField
              id={`${id}-max-price`}
              label="Max. price (AED)"
              inputMode="decimal"
              placeholder="No maximum"
              {...register("maxPrice")}
              error={errors.maxPrice?.message}
              aria-describedby={`${id}-budget-note`}
            />
          </div>
          {!home && (
            <SelectField
              id={`${id}-bedrooms`}
              label="Bedrooms"
              {...register("minBedrooms")}
              error={errors.minBedrooms?.message}
              className="w-full [&_select]:min-h-12 [&_select]:bg-card"
            >
              <NativeSelectOption value="">Any bedrooms</NativeSelectOption>
              <NativeSelectOption value="0">Studio and up</NativeSelectOption>
              {Array.from({ length: 20 }, (_, i) => (
                <NativeSelectOption key={i + 1} value={String(i + 1)}>
                  {i + 1}+ {i === 0 ? "bedroom" : "bedrooms"}
                </NativeSelectOption>
              ))}
            </SelectField>
          )}
          <SubmitButton
            pending={pending}
            pendingLabel="Searching…"
            label={home ? "Search properties" : "Apply filters"}
            className="min-h-12 self-start sm:mt-[26px]"
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <p id={`${id}-budget-note`}>
            Buy prices are total. Rent prices are per year.
          </p>
          {!home && (
            <Link
              href="/properties?purpose=sale"
              onClick={query === "purpose=sale" ? onApplied : undefined}
              className="inline-flex min-h-11 items-center font-medium text-primary underline underline-offset-4"
            >
              Clear all filters
              <NavigationPending />
            </Link>
          )}
        </div>
      </fieldset>
    </form>
  );
}

export function PropertyFilters({
  query = "",
  home = false,
}: {
  query?: string;
  home?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const previousQuery = useRef(query);
  const closeFilters = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (previousQuery.current !== query) closeFilters();
    previousQuery.current = query;
  }, [query, closeFilters]);
  const ready = useClientReady();

  if (home) return <SearchForm id="home-search" home />;

  return (
    <>
      <PublicSearchPanel treatment="listing" className="hidden lg:block">
        <SearchForm key={query} query={query} id="desktop-filters" />
      </PublicSearchPanel>
      <div className="lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <Button
                variant="outline"
                className="w-full bg-card"
                disabled={!ready}
              />
            }
          >
            Filters
          </SheetTrigger>
          <SheetContent className="w-full! max-w-md! overflow-y-auto px-5 pb-6">
            <SheetHeader className="px-0 pt-7 pe-10">
              <SheetTitle>Filter properties</SheetTitle>
              <SheetDescription>
                Find a home that fits your next chapter.
              </SheetDescription>
            </SheetHeader>
            <SearchForm
              key={query}
              query={query}
              id="mobile-filters"
              onApplied={closeFilters}
            />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

export function PropertySort({ query }: { query: string }) {
  const router = useRouter();
  const ready = useClientReady();
  const [pending, startTransition] = useTransition();
  const applied = parsePublicFilters(new URLSearchParams(query));

  return (
    <div className="flex flex-wrap items-center gap-3" aria-busy={pending}>
      <label htmlFor="property-sort" className="text-sm text-muted-foreground">
        Sort by
      </label>
      <NativeSelect
        id="property-sort"
        value={applied.sort ?? "newest"}
        disabled={!ready || pending}
        className="w-44 bg-card"
        onChange={(event) => {
          const next = serializePropertyFilters({
            ...applied,
            sort: event.target.value as "newest" | "price_asc" | "price_desc",
            page: 1,
          });

          startTransition(() => router.push(`/properties?${next}`));
        }}
      >
        <NativeSelectOption value="newest">Newest first</NativeSelectOption>
        <NativeSelectOption value="price_asc">
          Price: low to high
        </NativeSelectOption>
        <NativeSelectOption value="price_desc">
          Price: high to low
        </NativeSelectOption>
      </NativeSelect>
      <span
        role="status"
        className="inline-flex items-center gap-2 text-sm text-primary"
      >
        {pending && (
          <>
            <Spinner className="size-5" />
            Sorting…
          </>
        )}
      </span>
    </div>
  );
}
