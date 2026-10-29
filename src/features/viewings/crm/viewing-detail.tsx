"use client";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageHeader } from "@/components/layout/page-header";
import { TextareaField } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useClientReady } from "@/lib/use-client-ready";
import { getLead } from "@/features/leads/data/queries";
import type { LeadDetail } from "@/features/leads/data/types";
import { dubaiDate, dayLabel, timeLabel, endDayLabel } from "../data/calendar";
import {
  scheduleSchema,
  scheduleInstants,
  type ScheduleFields,
} from "../data/input";
import { rescheduleViewing, updateViewingStatus } from "../data/actions";
import { getViewing } from "../data/queries";
import { viewingReadRecovery } from "../data/request";
import type { Viewing, ViewingResult } from "../data/types";
import { ViewingScheduleFields } from "./schedule-fields";
import { ViewingStatus } from "./calendar";
const feedbackSchema = z.object({
  feedback: z
    .string()
    .trim()
    .min(1, "Enter feedback about the viewing.")
    .max(4000),
});
export function ViewingDetail({
  initial,
  initialLead,
  saved,
}: {
  initial: Viewing;
  initialLead: LeadDetail | null;
  saved: boolean;
}) {
  const ready = useClientReady();
  const router = useRouter();
  const [viewing, setViewing] = useState(initial);
  const [lead, setLead] = useState(initialLead);
  const [message, setMessage] = useState(saved ? "Viewing scheduled." : "");
  const [denied, setDenied] = useState(false);
  const [review, setReview] = useState(false);
  const [needsReload, setNeedsReload] = useState(false);
  const [cancel, setCancel] = useState(false);
  const [editing, setEditing] = useState(false);
  const [source, setSource] = useState({ initial, initialLead });
  const [refreshRequested, setRefreshRequested] = useState(false);
  const [pending, startTransition] = useTransition();
  const guard = useRef(false);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);
  const schedule = useForm<ScheduleFields>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      propertyId: initial.property.id,
      date: dubaiDate(initial.startsAt),
      start: timeLabel(initial.startsAt),
      end: timeLabel(initial.endsAt),
    },
  });
  const feedback = useForm<z.infer<typeof feedbackSchema>>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: { feedback: "" },
  });
  if (source.initial !== initial || source.initialLead !== initialLead) {
    setSource({ initial, initialLead });
    if (refreshRequested) {
      setRefreshRequested(false);
      setMessage(
        "Appointment context refreshed. Your entered values are preserved.",
      );
    }
    if (initial.version >= viewing.version) {
      setViewing(initial);
      setLead(initialLead);
      if (
        (editing || schedule.formState.isDirty || feedback.formState.isDirty) &&
        (initial.version !== viewing.version ||
          initialLead?.version !== lead?.version)
      )
        setReview(true);
    }
  }
  async function reload() {
    try {
      const fresh = await getViewing(viewing.id);
      setViewing(fresh);
      const freshLead = await getLead(fresh.lead.id);
      setLead(freshLead);
      setNeedsReload(false);
      setReview(true);
      return fresh;
    } catch (error) {
      const recovery = viewingReadRecovery(error);
      if (recovery === "login") {
        startTransition(() => router.replace("/login"));
        return;
      }
      if (recovery === "inaccessible") {
        setDenied(true);
        return;
      }
      setNeedsReload(true);
      setMessage(
        "The latest appointment could not be loaded. Reload before another change.",
      );
    }
  }
  function mutate(action: () => Promise<ViewingResult>) {
    if (guard.current || pending || review || needsReload) return;
    guard.current = true;
    setMessage("");
    startTransition(async () => {
      try {
        const result = await action();
        if (result.ok) {
          setViewing(result.data);
          setCancel(false);
          setEditing(false);
          setMessage(
            result.data.status === "completed"
              ? "Viewing completed. Feedback saved."
              : result.data.status === "cancelled"
                ? "Viewing cancelled."
                : "Viewing rescheduled.",
          );
          startTransition(() => router.refresh());
          return;
        }
        if (result.error.status === 401) {
          startTransition(() => router.replace("/login"));
          return;
        }
        if ([403, 404].includes(result.error.status || 0)) {
          setDenied(true);
          return;
        }
        if (result.error.status === 409 || result.error.uncertain) {
          setNeedsReload(true);
          await reload();
          setMessage(
            "The appointment may have changed. Review the latest appointment before making another change.",
          );
          setCancel(false);
        } else setMessage(result.error.message);
      } catch {
        setNeedsReload(true);
        await reload();
        setCancel(false);
        setMessage(
          "The result could not be confirmed. Review the latest appointment before making another change.",
        );
      } finally {
        guard.current = false;
      }
    });
  }
  const terminal = viewing.status !== "scheduled";
  const locked = !ready || pending || review || needsReload;
  const canReschedule =
    !!lead?.assignedAgent?.available &&
    !["won", "lost"].includes(lead.stage) &&
    viewing.property.bookable;
  if (denied)
    return (
      <main id="main-content" className="min-w-0 flex-1 p-6">
        <Alert>
          <AlertDescription>
            This viewing is no longer available to your account.{" "}
            <Link href="/crm/viewings" className="underline">
              Back to viewings
            </Link>
          </AlertDescription>
        </Alert>
      </main>
    );
  return (
    <main id="main-content" className="min-w-0 flex-1 px-4 py-8 sm:px-8">
      <Link
        href={`/crm/viewings?date=${dubaiDate(viewing.startsAt)}`}
        className="mb-5 inline-flex min-h-11 items-center text-sm text-primary underline"
      >
        ← Back to viewings
      </Link>
      <PageHeader
        title="Viewing details"
        description="The appointment, its current responsibility and feedback in one place."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <ViewingStatus status={viewing.status} />
            <Button
              variant="outline"
              disabled={!ready || pending}
              onClick={() => {
                setRefreshRequested(true);
                startTransition(() => router.refresh());
              }}
            >
              Refresh appointment
            </Button>
          </div>
        }
      />
      {message && (
        <Alert className="mb-6">
          <AlertDescription>
            <span role="status">{message}</span>
          </AlertDescription>
        </Alert>
      )}
      {needsReload && (
        <Button
          className="mb-6"
          variant="outline"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await reload();
            })
          }
        >
          Reload latest appointment
        </Button>
      )}
      {review && !needsReload && (
        <div className="mb-6">
          <p className="mb-3 text-sm text-muted-foreground">
            Review the current time, status, property and Agent below. Your
            entered values have been preserved.
          </p>
          <Button
            variant="outline"
            disabled={pending}
            onClick={() => setReview(false)}
          >
            I have reviewed the latest appointment
          </Button>
        </div>
      )}
      <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)]">
        <div className="min-w-0 space-y-6">
          <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Dubai time · UTC+4
            </p>
            <h2 className="mt-3 text-xl font-semibold">
              {dayLabel(dubaiDate(viewing.startsAt), true)}
            </h2>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-primary">
              {timeLabel(viewing.startsAt)}–{timeLabel(viewing.endsAt)}
            </p>
            {endDayLabel(viewing.startsAt, viewing.endsAt) && (
              <p className="mt-2 text-sm font-medium text-primary">
                {endDayLabel(viewing.startsAt, viewing.endsAt)}
              </p>
            )}
            <p className="mt-3 text-sm text-muted-foreground">
              {Math.round(
                (Date.parse(viewing.endsAt) - Date.parse(viewing.startsAt)) /
                  60000,
              )}{" "}
              minute appointment
            </p>
            {!terminal && (
              <div className="mt-6 flex flex-wrap gap-3 border-t border-border pt-5">
                <Button
                  variant="outline"
                  disabled={locked || !canReschedule}
                  onClick={() => {
                    if (!editing && !schedule.formState.isDirty)
                      schedule.reset({
                        propertyId: viewing.property.id,
                        date: dubaiDate(viewing.startsAt),
                        start: timeLabel(viewing.startsAt),
                        end: timeLabel(viewing.endsAt),
                      });
                    setEditing((value) => !value);
                  }}
                >
                  {editing ? "Close reschedule" : "Reschedule viewing"}
                </Button>
                <Button
                  variant="outline"
                  disabled={locked}
                  onClick={() => setCancel(true)}
                >
                  Cancel viewing
                </Button>
              </div>
            )}
            {!terminal && !canReschedule && (
              <p className="mt-4 text-xs leading-6 text-muted-foreground">
                Rescheduling requires an active assigned Agent, an open lead and
                a published, available property. Cancellation and feedback
                remain available.
              </p>
            )}
          </section>
          {editing && !terminal && (
            <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
              <h2 className="mb-5 text-lg font-semibold">Reschedule viewing</h2>
              <form
                className="space-y-5"
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  if (locked || guard.current || !lead) return;
                  const native = new FormData(e.currentTarget);
                  for (const name of ["date", "start", "end"] as const)
                    schedule.setValue(name, String(native.get(name) || ""));
                  void schedule.handleSubmit((value) =>
                    mutate(() =>
                      rescheduleViewing(viewing.id, {
                        expectedVersion: viewing.version,
                        expectedLeadVersion: lead.version,
                        ...scheduleInstants(value),
                      }),
                    ),
                  )(e);
                }}
              >
                <ViewingScheduleFields form={schedule} disabled={locked} />
                <SubmitButton
                  pending={pending}
                  label="Save new time"
                  pendingLabel="Rescheduling…"
                  disabled={locked || !canReschedule}
                />
              </form>
            </section>
          )}
          <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
            <h2 className="text-lg font-semibold">Viewing feedback</h2>
            {viewing.status === "completed" ? (
              <p className="mt-4 text-sm leading-7 break-words whitespace-pre-wrap">
                {viewing.feedback}
              </p>
            ) : viewing.status === "cancelled" ? (
              <p className="mt-4 text-sm text-muted-foreground">
                This appointment was cancelled. Its details are retained for
                your records.
              </p>
            ) : Date.parse(viewing.startsAt) > now ? (
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                Feedback can be recorded once the viewing has started. Return
                after {timeLabel(viewing.startsAt)} on{" "}
                {dayLabel(dubaiDate(viewing.startsAt))}.
              </p>
            ) : (
              <form
                className="mt-5 space-y-4"
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  if (locked || guard.current) return;
                  const native = new FormData(e.currentTarget);
                  feedback.setValue(
                    "feedback",
                    String(native.get("feedback") || ""),
                  );
                  void feedback.handleSubmit((value) =>
                    mutate(() =>
                      updateViewingStatus(viewing.id, {
                        expectedVersion: viewing.version,
                        status: "completed",
                        feedback: value.feedback,
                      }),
                    ),
                  )(e);
                }}
              >
                <TextareaField
                  id="viewing-feedback"
                  label="Feedback"
                  rows={6}
                  maxLength={4000}
                  {...feedback.register("feedback")}
                  error={feedback.formState.errors.feedback?.message}
                  disabled={locked}
                  help="Record the lead’s impressions and agreed next steps. Saved feedback is read-only."
                />
                <SubmitButton
                  pending={pending}
                  label="Complete viewing"
                  pendingLabel="Saving feedback…"
                  disabled={locked}
                />
              </form>
            )}
          </section>
        </div>
        <aside className="min-w-0 rounded-xl border border-border bg-card p-5">
          <h2 className="text-base font-semibold">Appointment context</h2>
          <dl className="mt-5 space-y-5 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Lead</dt>
              <dd className="mt-2 break-words">
                <Link
                  className="inline-flex min-h-11 items-center text-primary underline"
                  href={`/crm/leads/${viewing.lead.id}`}
                >
                  {viewing.lead.name}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Property</dt>
              <dd className="mt-2 break-words">
                <Link
                  className="inline-flex min-h-11 items-center text-primary underline"
                  href={`/crm/properties/${viewing.property.id}`}
                >
                  {viewing.property.title}
                </Link>
                <p className="mt-1 text-xs text-muted-foreground">
                  {viewing.property.location}
                </p>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">
                Current assigned Agent
              </dt>
              <dd className="mt-2 break-words">
                {viewing.assignedAgent?.name || "Unassigned"}
              </dd>
            </div>
          </dl>
          <p className="mt-6 border-t border-border pt-4 text-xs leading-6 text-muted-foreground">
            Responsibility follows the lead’s current assignment. Updating this
            appointment does not change the lead’s stage.
          </p>
        </aside>
      </div>
      <Dialog
        open={cancel}
        onOpenChange={(value) => {
          if (!pending) setCancel(value);
        }}
      >
        <DialogContent>
          <DialogTitle>Cancel viewing?</DialogTitle>
          <DialogDescription>
            This cancels the appointment for {viewing.lead.name}. The record
            stays in the calendar and cannot be reopened.
          </DialogDescription>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={pending}
              onClick={() => setCancel(false)}
            >
              Keep viewing
            </Button>
            <Button
              disabled={locked}
              onClick={() =>
                mutate(() =>
                  updateViewingStatus(viewing.id, {
                    expectedVersion: viewing.version,
                    status: "cancelled",
                  }),
                )
              }
            >
              {pending ? "Cancelling…" : "Confirm cancellation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
