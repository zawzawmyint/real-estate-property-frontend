"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { buttonVariants } from "@/components/ui/button-variants";
import { CollectionToolbar } from "@/components/crm/collection-toolbar";
import { StatusBadge } from "@/components/crm/status-badge";
import { FilterPanel } from "@/components/layout/filter-panel";
import { SelectField, TextField } from "@/components/forms/fields";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useClientReady } from "@/lib/use-client-ready";
import {
  dayLabel,
  dubaiDate,
  shiftDay,
  timeLabel,
  endDayLabel,
  weekDays,
  weekQuery,
  viewingHref,
} from "../data/calendar";
import { getViewings } from "../data/queries";
import type { Viewing, ViewingPage } from "../data/types";
type CalendarVariant = "default" | "workspace";
export function ViewingStatus({
  status,
  variant = "default",
}: {
  status: Viewing["status"];
  variant?: CalendarVariant;
}) {
  if (variant === "workspace")
    return (
      <StatusBadge tone={status === "scheduled" ? "info" : "neutral"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </StatusBadge>
    );
  return (
    <span
      className={`inline-flex rounded-md border px-2 py-1 text-[11px] font-medium capitalize ${status === "scheduled" ? "border-primary/20 bg-primary/5 text-primary" : "border-border bg-muted text-muted-foreground"}`}
    >
      {status}
    </span>
  );
}
function Appointment({
  item,
  variant = "default",
}: {
  item: Viewing;
  variant?: CalendarVariant;
}) {
  return (
    <Link
      href={`/crm/viewings/${item.id}`}
      className={`block min-h-11 rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${variant === "workspace" ? `border-s-[3px] ${item.status === "scheduled" ? "border-s-primary" : "border-s-border"}` : ""}`}
    >
      <p
        className={
          variant === "workspace"
            ? "text-xs font-semibold text-foreground xl:text-sm"
            : "text-sm font-semibold text-primary"
        }
      >
        {timeLabel(item.startsAt)}–{timeLabel(item.endsAt)}
      </p>
      {endDayLabel(item.startsAt, item.endsAt) && (
        <p className="mt-1 text-xs text-primary">
          {endDayLabel(item.startsAt, item.endsAt)}
        </p>
      )}
      <p
        className={
          variant === "workspace"
            ? "mt-2 text-sm font-semibold break-words text-primary"
            : "mt-3 text-sm font-semibold break-words"
        }
      >
        {item.lead.name}
      </p>
      <p className="mt-1 text-xs leading-5 break-words text-muted-foreground">
        {item.property.title}
      </p>
      <p className="mt-3 text-xs break-words text-muted-foreground">
        {item.assignedAgent?.name || "Unassigned"}
      </p>
      <div className="mt-3">
        <ViewingStatus status={item.status} variant={variant} />
      </div>
    </Link>
  );
}
export function ViewingToolbar({
  date,
  status,
  leadId,
  variant = "default",
}: {
  date: string;
  status: string;
  leadId?: string;
  variant?: CalendarVariant;
}) {
  const ready = useClientReady();
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const href = (day: string) =>
    viewingHref(pathname, day, status, search.toString());
  const controls = (
    <>
      <TextField
        id="viewing-date"
        name="date"
        label="Week containing"
        fieldClassName={
          variant === "workspace"
            ? "sm:w-auto sm:flex-row sm:items-center sm:gap-3 sm:[&>label]:w-auto sm:[&>label]:shrink-0"
            : undefined
        }
        className={variant === "workspace" ? "bg-card sm:w-40" : undefined}
        type="date"
        defaultValue={date}
        required
      />
      <SelectField
        id="viewing-status"
        name="status"
        label="Status"
        fieldClassName={
          variant === "workspace"
            ? "sm:w-auto sm:flex-row sm:items-center sm:gap-3 sm:[&>label]:w-auto sm:[&>label]:shrink-0"
            : undefined
        }
        defaultValue={status}
        className={
          variant === "workspace"
            ? "w-full bg-card sm:w-40"
            : "w-full [&_select]:block [&_select]:h-12"
        }
      >
        <option value="">All statuses</option>
        <option value="scheduled">Scheduled</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </SelectField>
      <Button
        type="submit"
        className={variant === "workspace" ? "self-end" : "h-12 self-end"}
        disabled={!ready}
      >
        Apply
      </Button>
    </>
  );
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        router.push(
          viewingHref(
            pathname,
            String(data.get("date")),
            String(data.get("status") || ""),
            search.toString(),
          ),
        );
      }}
    >
      {variant === "workspace" ? (
        <CollectionToolbar className="flex flex-col gap-4 space-y-0 xl:flex-row xl:flex-wrap xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              aria-label="Previous week"
              href={href(shiftDay(date, -7))}
              className={buttonVariants({ variant: "outline", size: "icon" })}
            >
              <Icon name="collapse" />
            </Link>
            <p className="text-sm font-semibold">
              {dayLabel(weekDays(date)[0])} – {dayLabel(weekDays(date)[6])}
            </p>
            <Link
              aria-label="Next week"
              href={href(shiftDay(date, 7))}
              className={buttonVariants({ variant: "outline", size: "icon" })}
            >
              <Icon name="expand" />
            </Link>
            <Link
              href={href(dubaiDate())}
              className={buttonVariants({ variant: "ghost" })}
            >
              Today
            </Link>
          </div>
          <fieldset
            disabled={!ready}
            className="flex min-w-0 flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center"
          >
            {controls}
          </fieldset>
        </CollectionToolbar>
      ) : (
        <FilterPanel
          disabled={!ready}
          fieldsClassName="grid items-end gap-4 sm:grid-cols-[1fr_1fr_auto]"
          before={
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <Link
                  aria-label="Previous week"
                  href={href(shiftDay(date, -7))}
                  className={buttonVariants({ variant: "outline" })}
                >
                  <Icon name="collapse" />
                  <span className="sr-only sm:not-sr-only">Previous week</span>
                </Link>
                <Link
                  href={href(dubaiDate())}
                  className={buttonVariants({ variant: "outline" })}
                >
                  Today
                </Link>
                <Link
                  aria-label="Next week"
                  href={href(shiftDay(date, 7))}
                  className={buttonVariants({ variant: "outline" })}
                >
                  <span className="sr-only sm:not-sr-only">Next week</span>
                  <Icon name="expand" />
                </Link>
              </div>
              <p className="text-xs text-muted-foreground">
                Dubai time · UTC+4
              </p>
            </div>
          }
        >
          {controls}
        </FilterPanel>
      )}
      {leadId && (
        <p className="mt-2 text-xs text-muted-foreground">
          Showing this lead’s appointments for the selected week.
        </p>
      )}
    </form>
  );
}
export function ViewingCalendar({
  initial,
  ...props
}: {
  initial: ViewingPage;
  date: string;
  status: string;
  leadId?: string;
  variant?: CalendarVariant;
}) {
  const [source, setSource] = useState({ initial, revision: 0 });
  if (source.initial !== initial)
    setSource({ initial, revision: source.revision + 1 });
  // A fresh server page replaces pagination, including any outstanding page request.
  return <CalendarPage key={source.revision} initial={initial} {...props} />;
}
function CalendarPage({
  initial,
  date,
  status,
  leadId,
  variant = "default",
}: {
  initial: ViewingPage;
  date: string;
  status: string;
  leadId?: string;
  variant?: CalendarVariant;
}) {
  const [data, setData] = useState(initial);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const ready = useClientReady();
  const days = weekDays(date);
  const today = dubaiDate();
  const pathname = usePathname();
  const search = useSearchParams();
  const cards = (day: string) =>
    data.items
      .filter((item) => dubaiDate(item.startsAt) === day)
      .map((item) => (
        <Appointment key={item.id} item={item} variant={variant} />
      ));
  return (
    <section aria-label="Viewing calendar" className="mt-6 min-w-0">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2
          className={
            variant === "workspace" ? "sr-only" : "text-lg font-semibold"
          }
        >
          {dayLabel(days[0])} – {dayLabel(days[6])}
        </h2>
        <p role="status" className="text-xs text-muted-foreground">
          {data.items.length} of {data.total} viewings loaded
          {variant === "workspace" && " · Dubai time"}
        </p>
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div
          className={`grid grid-cols-7 border-b border-border ${leadId ? "" : "lg:hidden"}`}
        >
          {days.map((day) => (
            <Link
              key={day}
              href={viewingHref(pathname, day, status, search.toString())}
              aria-current={day === date ? "date" : undefined}
              aria-label={dayLabel(day, true)}
              className={`flex min-h-16 flex-col items-center justify-center gap-1 text-[10px] ${day === date ? "bg-primary text-primary-foreground" : day === today ? "bg-muted text-primary" : "text-muted-foreground"}`}
            >
              <span>{dayLabel(day).split(" ")[0]}</span>
              <span className="text-base font-semibold">
                {Number(day.slice(-2))}
              </span>
            </Link>
          ))}
        </div>
        <div
          className={`hidden grid-cols-7 divide-x divide-border ${variant === "workspace" ? "min-h-[34rem]" : "min-h-80"} ${leadId ? "" : "lg:grid"}`}
        >
          {days.map((day) => (
            <div
              key={day}
              className={`min-w-0 ${variant === "workspace" && day === today ? "bg-primary/[0.035]" : ""}`}
            >
              <h3
                className={`border-b border-border p-3 font-medium ${variant === "workspace" ? "h-32 text-sm" : "min-h-16 text-xs"} ${day === today ? "bg-primary/5 text-primary" : "text-muted-foreground"}`}
              >
                {variant === "workspace" ? (
                  <>
                    <span className="block">
                      {dayLabel(day, true).split(" ")[0]?.replace(",", "")}
                    </span>
                    <span className="mt-2 block text-3xl font-semibold text-foreground">
                      {Number(day.slice(-2))}
                    </span>
                    <span className="mt-1 block">
                      {dayLabel(day).split(" ").at(-1)}
                    </span>
                  </>
                ) : (
                  dayLabel(day)
                )}
                {day === today && (
                  <span className="mt-1 block text-[10px]">Today</span>
                )}
              </h3>
              <div className="space-y-3 p-2">
                {cards(day)}
                {!data.items.some(
                  (item) => dubaiDate(item.startsAt) === day,
                ) && (
                  <p className="py-7 text-center text-xs text-muted-foreground">
                    {variant === "workspace" ? "No viewings" : "—"}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className={`space-y-3 p-4 ${leadId ? "" : "lg:hidden"}`}>
          <h3 className="mb-4 text-sm font-semibold">{dayLabel(date, true)}</h3>
          {cards(date)}
          {!data.items.some((item) => dubaiDate(item.startsAt) === date) && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No loaded viewings for this day.
            </p>
          )}
        </div>
      </div>
      {data.total === 0 && (
        <p className="mt-4 rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {status
            ? `No ${status} viewings this week. Try another status or week.`
            : "No viewings this week. Choose another week or schedule from a lead."}
        </p>
      )}
      {data.items.length < data.total && (
        <Button
          variant="outline"
          className="mt-4 w-full"
          disabled={!ready || pending}
          onClick={async () => {
            if (pending) return;
            setPending(true);
            setError("");
            try {
              const next = await getViewings(
                weekQuery(date, status, leadId, data.page + 1),
              );
              setData((old) => ({
                ...next,
                items: [
                  ...old.items,
                  ...next.items.filter(
                    (item) =>
                      !old.items.some((existing) => existing.id === item.id),
                  ),
                ],
              }));
            } catch {
              setError(
                "More viewings could not be loaded. Your current results remain visible. Try again.",
              );
            } finally {
              setPending(false);
            }
          }}
        >
          {pending ? "Loading viewings…" : "Load more"}
        </Button>
      )}
      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </section>
  );
}
