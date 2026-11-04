"use client";
import { CollectionToolbar } from "@/components/crm/collection-toolbar";
import { FilterChip } from "@/components/crm/filter-chip";
import { Icon } from "@/components/ui/icon";
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
import { pipelineHref } from "../data/pipeline";
import { SearchPicker } from "./search-picker";

export function LeadFilters({
  filters,
  manager,
  checkingSession = false,
  pipeline = false,
}: {
  filters: LeadFilters;
  manager: boolean;
  checkingSession?: boolean;
  pipeline?: boolean;
}) {
  const href = pipeline ? pipelineHref : leadsHref;
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
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [draft, setDraft] = useState(filters);
  function navigate(next: LeadFilters) {
    if (checkingSession) return;
    startTransition(() => router.push(href({ ...next, page: 1 })));
  }
  useEffect(() => {
    if (checkingSession) return;
    if (q.trim() === (filters.q || "").trim()) return;
    const timer = setTimeout(() => {
      setSearch((current) => ({ ...current, requested: q.trim() }));
      startTransition(() =>
        router.push(href({ ...filters, q: q.trim(), page: 1 })),
      );
    }, 300);
    return () => clearTimeout(timer);
  }, [q, filters, router, checkingSession, href]);
  const count = [filters.stage, filters.source, filters.agentId].filter(
    Boolean,
  ).length;
  function controls(
    value: LeadFilters,
    change: (next: LeadFilters) => void,
    suffix: string,
    includeSort = true,
  ) {
    return (
      <>
        {!pipeline && (
          <SelectField
            label="Stage"
            id={`lead-stage-${suffix}`}
            value={value.stage || ""}
            onChange={(event) =>
              change({ ...value, stage: event.target.value })
            }
          >
            <option value="">All stages</option>
            {stages.map((stage) => (
              <option key={stage} value={stage}>
                {stageLabels[stage]}
              </option>
            ))}
          </SelectField>
        )}
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
        {includeSort && (
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
        )}
      </>
    );
  }
  const disabled = !ready || checkingSession;
  function removeFilter(key: "q" | "stage" | "source" | "agentId") {
    if (key === "q") {
      setSearch({ source: filters.q || "", value: "", requested: "" });
    } else navigate({ ...filters, [key]: undefined });
    document.getElementById("lead-search")?.focus();
  }
  return (
    <div aria-busy={pending}>
      <CollectionToolbar
        filters={
          advancedOpen ? (
            <fieldset
              id="lead-advanced-filters"
              disabled={disabled}
              className="hidden min-w-0 gap-4 rounded-lg border border-border bg-card p-4 md:grid md:grid-cols-2"
            >
              {controls(filters, navigate, "desktop", false)}
              {manager && filters.view === "all" && (
                <div className="space-y-3 md:col-span-2">
                  <p className="text-sm font-medium">Assigned agent</p>
                  <SearchPicker
                    kind="agent"
                    value={filters.agentId || ""}
                    currentLabel="Selected agent"
                    disabled={disabled}
                    onChange={(agentId) => navigate({ ...filters, agentId })}
                  />
                </div>
              )}
            </fieldset>
          ) : undefined
        }
        navigation={
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <nav
              aria-label="Lead display"
              className="flex gap-5 sm:border-e sm:border-border sm:pe-6"
            >
              {[
                [false, "List"],
                [true, "Pipeline"],
              ].map(([isPipeline, label]) => (
                <Link
                  key={String(label)}
                  aria-current={pipeline === isPipeline ? "page" : undefined}
                  href={
                    isPipeline
                      ? pipelineHref({
                          ...filters,
                          view: manager ? "all" : "mine",
                        })
                      : leadsHref(filters)
                  }
                  className={`inline-flex min-h-11 items-center border-b-2 text-sm font-medium ${pipeline === isPipeline ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                >
                  {label}
                </Link>
              ))}
            </nav>
            <nav aria-label="Lead views" className="flex flex-wrap gap-5">
              {(checkingSession
                ? []
                : manager
                  ? [
                      ["all", "All leads"],
                      ["unassigned", "Unassigned"],
                    ]
                  : [["mine", "My leads"]]
              ).map(([view, label]) => (
                <Link
                  key={view}
                  href={href({
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
            {!pipeline && (
              <Button
                type="button"
                variant="outline"
                className="sm:ms-auto"
                disabled={disabled || pending}
                onClick={() => startTransition(() => router.refresh())}
              >
                <Icon name="retry" />
                Refresh leads
              </Button>
            )}
          </div>
        }
        chips={
          !checkingSession &&
          (count > 0 || filters.q || filters.sort !== "newest") ? (
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              {filters.q && (
                <FilterChip
                  disabled={disabled}
                  removeLabel="Remove search filter"
                  onRemove={() => removeFilter("q")}
                >
                  Search: {filters.q}
                </FilterChip>
              )}
              {filters.stage && (
                <FilterChip
                  disabled={disabled}
                  removeLabel="Remove stage filter"
                  onRemove={() => removeFilter("stage")}
                >
                  Stage:{" "}
                  {stageLabels[filters.stage as keyof typeof stageLabels]}
                </FilterChip>
              )}
              {filters.source && (
                <FilterChip
                  disabled={disabled}
                  removeLabel="Remove source filter"
                  onRemove={() => removeFilter("source")}
                >
                  Source:{" "}
                  {sourceLabels[filters.source as keyof typeof sourceLabels]}
                </FilterChip>
              )}
              {filters.agentId && (
                <FilterChip
                  disabled={disabled}
                  removeLabel="Remove assigned agent filter"
                  onRemove={() => removeFilter("agentId")}
                >
                  Assigned agent
                </FilterChip>
              )}
              <Link
                className="inline-flex min-h-11 items-center px-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
                href={href({ view: filters.view, sort: "newest", page: 1 })}
              >
                Clear filters
              </Link>
            </div>
          ) : undefined
        }
      >
        <fieldset
          disabled={disabled}
          className="grid min-w-0 gap-3 md:grid-cols-[minmax(12rem,1.5fr)_auto_minmax(10rem,1fr)]"
        >
          <div className="relative min-w-0">
            <Icon
              name="search"
              className="pointer-events-none absolute start-3 top-1/2 z-10 -translate-y-1/2 text-muted-foreground"
            />
            <TextField
              label="Search leads"
              fieldClassName="min-w-0 gap-0 [&>label]:sr-only"
              id="lead-search"
              type="search"
              maxLength={120}
              placeholder="Search leads"
              value={q}
              className="bg-card ps-10"
              onChange={(event) =>
                setSearch((current) => ({
                  ...current,
                  value: event.target.value,
                }))
              }
            />
          </div>
          <div className="hidden md:block">
            <Button
              type="button"
              variant="outline"
              className="w-full border-primary text-primary"
              disabled={disabled}
              aria-expanded={advancedOpen}
              aria-controls={advancedOpen ? "lead-advanced-filters" : undefined}
              onClick={() => setAdvancedOpen(!advancedOpen)}
            >
              <Icon name="filter" />
              Filters{count ? ` · ${count}` : ""}
            </Button>
          </div>
          <div className="md:hidden">
            <Sheet
              open={open}
              onOpenChange={(next) => {
                setOpen(next);
                if (next) setDraft(filters);
              }}
            >
              <SheetTrigger
                render={<Button variant="outline" disabled={disabled} />}
              >
                <Icon name="filter" />
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
                    disabled={disabled}
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
          <div className="hidden md:block">
            <SelectField
              label="Sort by"
              fieldClassName="min-w-0 gap-0 [&>label]:sr-only"
              id="lead-sort-workspace"
              value={filters.sort}
              className="w-full bg-card"
              onChange={(event) =>
                navigate({
                  ...filters,
                  sort: event.target.value as LeadFilters["sort"],
                })
              }
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="updated">Recently updated</option>
            </SelectField>
          </div>
        </fieldset>
      </CollectionToolbar>
    </div>
  );
}
