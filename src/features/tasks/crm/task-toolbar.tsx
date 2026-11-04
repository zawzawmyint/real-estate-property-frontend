"use client";
import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SelectField } from "@/components/forms/fields";
import { CollectionToolbar } from "@/components/crm/collection-toolbar";
import { FilterPanel } from "@/components/layout/filter-panel";
import { Button } from "@/components/ui/button";
import { useClientReady } from "@/lib/use-client-ready";
import { taskHref, type TaskFilters } from "../data/filters";

export function TaskToolbar({
  filters,
  leadMode = false,
}: {
  filters: TaskFilters;
  leadMode?: boolean;
}) {
  const ready = useClientReady();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [status, setStatus] = useState(filters.status);
  const [due, setDue] = useState(filters.due);
  const [pending, startTransition] = useTransition();
  const prefix = leadMode ? "lead-task" : "task";
  const controls = (
    <>
      <SelectField
        id={`${prefix}-status`}
        label="Task status"
        fieldClassName={
          leadMode
            ? undefined
            : "sm:w-auto sm:flex-row sm:items-center sm:gap-4 sm:[&>label]:w-auto sm:[&>label]:shrink-0"
        }
        className={leadMode ? undefined : "w-full bg-card sm:w-52"}
        value={status}
        onChange={(event) => {
          const value = event.target.value as TaskFilters["status"];
          setStatus(value);
          if (value !== "open" && due === "overdue") setDue("all");
        }}
      >
        <option value="open">Open</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
        <option value="all">All statuses</option>
      </SelectField>
      <SelectField
        id={`${prefix}-due`}
        label="Due"
        fieldClassName={
          leadMode
            ? undefined
            : "sm:w-auto sm:flex-row sm:items-center sm:gap-4 sm:[&>label]:w-auto sm:[&>label]:shrink-0"
        }
        className={leadMode ? undefined : "w-full bg-card sm:w-52"}
        value={due}
        onChange={(event) => {
          const value = event.target.value as TaskFilters["due"];
          setDue(value);
          if (value === "overdue") setStatus("open");
        }}
      >
        <option value="all">Any time</option>
        <option value="overdue">Overdue</option>
        <option value="today">Today · Dubai</option>
        <option value="upcoming">Upcoming</option>
      </SelectField>
      <Button type="submit" variant={leadMode ? "outline" : "default"}>
        Apply filters
      </Button>
    </>
  );
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!ready || pending) return;
        startTransition(() =>
          router.push(
            taskHref(
              pathname,
              { ...filters, status, due },
              1,
              new URLSearchParams(params),
              leadMode,
            ),
          ),
        );
      }}
    >
      {leadMode ? (
        <FilterPanel
          disabled={!ready || pending}
          busy={pending}
          fieldsClassName="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        >
          {controls}
        </FilterPanel>
      ) : (
        <CollectionToolbar>
          <fieldset
            disabled={!ready || pending}
            aria-busy={pending}
            className="flex min-w-0 flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6"
          >
            {controls}
          </fieldset>
        </CollectionToolbar>
      )}
    </form>
  );
}
