"use client";

import { useEffect, useId, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import type { z } from "zod";
import { SelectField, TextField } from "@/components/forms/fields";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  formatBedrooms,
  formatPrice,
} from "@/features/properties/data/filters";
import { propertyTypes } from "@/features/properties/data/input";
import { useClientReady } from "@/lib/use-client-ready";
import { propertyMatchSchema } from "../data/input";
import { getLeadPropertyMatches } from "../data/queries";
import type {
  LeadDetail,
  PropertyMatchPage,
  PropertyMatchQuery,
} from "../data/types";

type MatchLead = Pick<LeadDetail, "id" | "purpose" | "budgetFils">;
type MatchState =
  | { status: "idle" }
  | { status: "loading" | "error"; query: PropertyMatchQuery }
  | { status: "success"; query: PropertyMatchQuery; page: PropertyMatchPage };
type MatchProps = {
  lead: MatchLead;
  onAccessError: (error: unknown) => boolean;
};

export function LeadPropertyMatching(props: MatchProps) {
  const [open, setOpen] = useState(false);
  const ready = useClientReady();
  const panelId = useId();

  return (
    <div className="space-y-4 border-t border-border pt-4">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        aria-expanded={open}
        aria-controls={panelId}
        disabled={!ready}
        onClick={() => setOpen(!open)}
      >
        {open ? "Hide property matches" : "Find matching properties"}
      </Button>
      <div id={panelId} hidden={!open}>
        {open && <MatchPanel {...props} />}
      </div>
    </div>
  );
}

function MatchPanel({ lead, onAccessError }: MatchProps) {
  const [state, setState] = useState<MatchState>({ status: "idle" });
  const activeRequest = useRef<AbortController | null>(null);
  const id = useId();
  const {
    control,
    handleSubmit,
    register,
    resetField,
    formState: { errors },
  } = useForm<
    z.input<typeof propertyMatchSchema>,
    unknown,
    z.output<typeof propertyMatchSchema>
  >({
    resolver: zodResolver(propertyMatchSchema),
    defaultValues: {
      purpose: lead.purpose,
      budget: lead.budgetFils == null ? "" : String(lead.budgetFils / 100),
      location: "",
      type: "",
      bedrooms: "",
    },
  });
  const purpose = useWatch({ control, name: "purpose" });
  const purposeField = register("purpose");

  useEffect(() => () => activeRequest.current?.abort(), []);

  async function search(query: PropertyMatchQuery) {
    if (activeRequest.current) return;

    const request = new AbortController();
    activeRequest.current = request;
    setState({ status: "loading", query });
    try {
      const page = await getLeadPropertyMatches(lead.id, query, request.signal);
      if (!request.signal.aborted) setState({ status: "success", query, page });
    } catch (error) {
      if (!request.signal.aborted && !onAccessError(error))
        setState({ status: "error", query });
    } finally {
      if (activeRequest.current === request) activeRequest.current = null;
    }
  }

  return (
    <section aria-labelledby={`${id}-title`} className="space-y-4">
      <div>
        <h3 id={`${id}-title`} className="text-sm font-semibold">
          Property matches
        </h3>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Search available listings using the requirements you confirm.
        </p>
      </div>
      <form
        className="space-y-3"
        noValidate
        onSubmit={(event) => {
          void handleSubmit((values) =>
            search({
              purpose: values.purpose,
              maxPriceFils: values.budget,
              location: values.location || undefined,
              type: values.type || undefined,
              exactBedrooms: values.bedrooms,
              page: 1,
            }),
          )(event);
        }}
      >
        <SelectField
          id={`${id}-purpose`}
          label="Purpose"
          {...purposeField}
          onChange={(event) => {
            void purposeField.onChange(event);
            activeRequest.current?.abort();
            activeRequest.current = null;
            resetField("budget", { defaultValue: "" });
            setState({ status: "idle" });
          }}
          error={errors.purpose?.message}
        >
          <option value="sale">Buy</option>
          <option value="rent">Rent</option>
        </SelectField>
        <TextField
          id={`${id}-budget`}
          label={
            purpose === "rent"
              ? "Maximum annual rent (AED)"
              : "Maximum price (AED)"
          }
          inputMode="decimal"
          {...register("budget")}
          error={errors.budget?.message}
        />
        <TextField
          id={`${id}-location`}
          label="Area"
          placeholder="Community or city"
          maxLength={120}
          {...register("location")}
          error={errors.location?.message}
        />
        <SelectField
          id={`${id}-type`}
          label="Property type"
          {...register("type")}
          error={errors.type?.message}
        >
          <option value="">Any type</option>
          {propertyTypes.map((type) => (
            <option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
        </SelectField>
        <SelectField
          id={`${id}-bedrooms`}
          label="Bedrooms"
          {...register("bedrooms")}
          error={errors.bedrooms?.message}
        >
          <option value="">Any count</option>
          <option value="0">Studio</option>
          {Array.from({ length: 20 }, (_, index) => index + 1).map((count) => (
            <option key={count} value={count}>
              {count}
            </option>
          ))}
        </SelectField>
        <SubmitButton
          className="w-full"
          label="Search"
          pendingLabel="Searching…"
          pending={state.status === "loading"}
        />
      </form>
      <div role="status" className="text-sm text-muted-foreground">
        {state.status === "loading" && "Searching for matching properties…"}
        {state.status === "success" &&
          (state.page.total === 0
            ? "No matching properties found."
            : `${state.page.total} matching ${state.page.total === 1 ? "property" : "properties"}`)}
      </div>
      {state.status === "error" && (
        <Alert variant="destructive">
          <AlertDescription>
            Matching properties could not be loaded.
          </AlertDescription>
          <Button
            type="button"
            variant="outline"
            className="mt-2 justify-self-start"
            onClick={() => void search(state.query)}
          >
            Retry search
          </Button>
        </Alert>
      )}
      {state.status === "success" && (
        <MatchResults
          page={state.page}
          query={state.query}
          onPage={(page) => void search({ ...state.query, page })}
        />
      )}
    </section>
  );
}

function MatchResults({
  page: { items, total, page, pageSize },
  query,
  onPage,
}: {
  page: PropertyMatchPage;
  query: PropertyMatchQuery;
  onPage: (page: number) => void;
}) {
  const lastPage = Math.min(10000, Math.ceil(total / pageSize));
  const criteria = [
    query.purpose === "rent" ? "Rent" : "Buy",
    query.maxPriceFils === undefined
      ? undefined
      : `Up to ${formatPrice(query.maxPriceFils, query.purpose)}`,
    query.location,
    query.type,
    query.exactBedrooms === undefined
      ? undefined
      : formatBedrooms(query.exactBedrooms),
  ].filter(Boolean);

  return (
    <div className="space-y-3">
      <p className="text-xs leading-5 break-words text-muted-foreground">
        {criteria.join(" · ")}
      </p>
      {items.length > 0 && (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {items.map((property) => (
            <li key={property.id} className="space-y-1 px-3 py-2.5">
              <a
                href={`/properties/${property.id}`}
                target="_blank"
                rel="noopener"
                className="text-sm font-medium break-words text-primary underline underline-offset-3"
              >
                {property.title}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
              <p className="text-sm font-medium">
                {formatPrice(property.priceFils, property.purpose)}
              </p>
              <p className="text-xs leading-5 break-words text-muted-foreground">
                {property.community}, {property.city}
                {property.bedrooms != null &&
                  ` · ${formatBedrooms(property.bedrooms)}`}
                {property.isDemo && " · Demo property"}
              </p>
            </li>
          ))}
        </ul>
      )}
      {(page > 1 || lastPage > 1) && (
        <nav
          aria-label="Property matches pagination"
          className="flex flex-wrap items-center justify-between gap-2"
        >
          <span aria-current="page" className="text-xs text-muted-foreground">
            Page {page} of {Math.max(page, lastPage)}
          </span>
          <div className="flex flex-wrap gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label="Go to previous page"
              disabled={page <= 1}
              onClick={() => onPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label="Go to next page"
              disabled={page >= lastPage}
              onClick={() => onPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </nav>
      )}
    </div>
  );
}
