"use client";
import { FilterPanel } from "@/components/layout/filter-panel";
import { TextField, SelectField } from "@/components/forms/fields";
import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { useClientReady } from "@/lib/use-client-ready";
import { stages, stageLabels, sourceLabels } from "../data/input";
import { leadsHref, type LeadFilters } from "../data/filters";
import { SearchPicker } from "./search-picker";

export function LeadFilters({
  filters,
  manager,
}: {
  filters: LeadFilters;
  manager: boolean;
}) {
  const ready = useClientReady();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState({
    source: filters.q || "",
    value: filters.q || "",
    requested: filters.q || "",
  });
  // Keep the same input mounted across streaming navigation. Synchronize browser
  // back/forward without discarding typing that continued during our own search.
  if (search.source !== (filters.q || ""))
    setSearch({
      ...search,
      source: filters.q || "",
      value:
        (filters.q || "") === search.requested ? search.value : filters.q || "",
    });
  const q = search.value;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(filters);
  function navigate(next: LeadFilters) {
    startTransition(() => router.push(leadsHref({ ...next, page: 1 })));
  }
  useEffect(() => {
    if (q.trim() === (filters.q || "").trim()) return;
    const timer = setTimeout(() => {
      setSearch((current) => ({ ...current, requested: q.trim() }));
      startTransition(() =>
        router.push(leadsHref({ ...filters, q: q.trim(), page: 1 })),
      );
    }, 300);
    return () => clearTimeout(timer);
  }, [q, filters, router]);
  const count = [filters.stage, filters.source, filters.agentId].filter(
    Boolean,
  ).length;
  function controls(
    value: LeadFilters,
    change: (next: LeadFilters) => void,
    suffix: string,
  ) {
    return (
      <>
        <SelectField
          label="Stage"
          id={`lead-stage-${suffix}`}
          value={value.stage || ""}
          onChange={(event) => change({ ...value, stage: event.target.value })}
        >
          <option value="">All stages</option>
          {stages.map((stage) => (
            <option key={stage} value={stage}>
              {stageLabels[stage]}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Source"
          id={`lead-source-${suffix}`}
          value={value.source || ""}
          onChange={(event) => change({ ...value, source: event.target.value })}
        >
          <option value="">All sources</option>
          {Object.entries(sourceLabels).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Sort by"
          id={`lead-sort-${suffix}`}
          value={value.sort}
          onChange={(event) =>
            change({
              ...value,
              sort: event.target.value as LeadFilters["sort"],
            })
          }
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="updated">Recently updated</option>
        </SelectField>
      </>
    );
  }
  return (
    <FilterPanel
      busy={pending}
      disabled={!ready}
      fieldsClassName="md:grid-cols-[minmax(12rem,2fr)_repeat(3,minmax(8rem,1fr))]"
      before={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav
            aria-label="Lead views"
            className="flex min-h-11 gap-6 border-b border-border"
          >
            {(manager
              ? [
                  ["unassigned", "Unassigned"],
                  ["all", "All leads"],
                ]
              : [["mine", "My leads"]]
            ).map(([view, label]) => (
              <Link
                key={view}
                href={leadsHref({
                  ...filters,
                  view: view as LeadFilters["view"],
                  agentId: undefined,
                  page: 1,
                })}
                aria-current={filters.view === view ? "page" : undefined}
                className={`inline-flex min-h-11 items-center border-b-2 text-sm font-medium ${filters.view === view ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              >
                {label}
              </Link>
            ))}
          </nav>
          <Button
            type="button"
            variant="ghost"
            disabled={!ready || pending}
            onClick={() => startTransition(() => router.refresh())}
          >
            Refresh leads
          </Button>
        </div>
      }
      after={
        <div className="flex flex-wrap items-center gap-3">
          <div className="md:hidden">
            <Sheet
              open={open}
              onOpenChange={(next) => {
                setOpen(next);
                if (next) setDraft(filters);
              }}
            >
              <SheetTrigger
                render={<Button variant="outline" disabled={!ready} />}
              >
                Filters{count ? ` (${count})` : ""}
              </SheetTrigger>
              <SheetContent className="w-[min(100%,24rem)] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Filter leads</SheetTitle>
                  <SheetDescription>
                    Choose filters, then apply them together.
                  </SheetDescription>
                </SheetHeader>
                <div className="space-y-5 px-4">
                  {controls(draft, setDraft, "mobile")}
                  {manager && filters.view === "all" && (
                    <SearchPicker
                      kind="agent"
                      value={draft.agentId || ""}
                      currentLabel="Selected agent"
                      onChange={(agentId) => setDraft({ ...draft, agentId })}
                    />
                  )}
                </div>
                <SheetFooter>
                  <Button
                    onClick={() => {
                      navigate(draft);
                      setOpen(false);
                    }}
                  >
                    Apply filters
                  </Button>
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
          {manager && filters.view === "all" && (
            <details className="hidden min-w-64 rounded-lg border border-border bg-card p-3 md:block">
              <summary className="cursor-pointer text-sm font-medium">
                Assigned agent{filters.agentId ? " · Filter active" : ""}
              </summary>
              <div className="mt-4 max-w-sm">
                <SearchPicker
                  kind="agent"
                  value={filters.agentId || ""}
                  currentLabel="Selected agent"
                  onChange={(agentId) => navigate({ ...filters, agentId })}
                />
              </div>
            </details>
          )}
          {(count > 0 || filters.q || filters.sort !== "newest") && (
            <Link
              className="inline-flex min-h-11 items-center text-sm text-primary underline underline-offset-4"
              href={leadsHref({ view: filters.view, sort: "newest", page: 1 })}
            >
              Clear filters{count ? ` (${count})` : ""}
            </Link>
          )}
        </div>
      }
    >
      <TextField
        label="Search leads"
        id="lead-search"
        type="search"
        maxLength={120}
        placeholder="Name, phone, email or property"
        value={q}
        onChange={(event) =>
          setSearch((current) => ({
            ...current,
            value: event.target.value,
          }))
        }
      />
      <div className="hidden md:contents [&>*]:hidden md:[&>*]:flex">
        {controls(filters, navigate, "desktop")}
      </div>
    </FilterPanel>
  );
}
