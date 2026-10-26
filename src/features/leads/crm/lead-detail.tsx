"use client";
import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button-variants";
import { useClientReady } from "@/lib/use-client-ready";
import { changeStage, addLeadNote } from "../data/actions";
import { getLead, getActivity } from "../data/queries";
import { LeadApiError } from "../data/request";
import type { Activity, LeadDetail as Detail, Page } from "../data/types";
import { stageLabels, stages } from "../data/input";
import {
  receiptAfterFailure,
  receiptAfterNoteConflict,
} from "../data/submissions";
import { AssignmentDialog } from "./assignment-dialog";
import {
  LeadDate,
  StageBadge,
  SourceBadge,
  AssigneeContext,
  budgetLabel,
} from "./lead-presentation";
import { LeadSection } from "./lead-form-fields";
import { useDirtyForm } from "./use-dirty-form";

const entrySchema = z.object({
  kind: z.enum(["note", "call"]),
  body: z.string().trim().min(1, "Write an entry.").max(5000),
});
type Entry = z.infer<typeof entrySchema>;
function activityTitle(event: Activity) {
  if (event.note)
    return event.note.kind === "call" ? "Call logged" : "Note added";
  if (event.assignment)
    return `Assignment changed · ${event.assignment.from?.name || "Unassigned"} → ${event.assignment.to?.name || "Unassigned"}`;
  if (event.stageChange)
    return `Stage changed · ${stageLabels[event.stageChange.from]} → ${stageLabels[event.stageChange.to]}`;
  if (event.changedFields.length) return "Details updated";
  return event.actor ? "Manual lead created" : "Inquiry received";
}

export function LeadDetail({
  initialLead,
  initialActivity,
  manager,
  back,
  saved,
}: {
  initialLead: Detail;
  initialActivity: Page<Activity>;
  manager: boolean;
  back: string;
  saved: boolean;
}) {
  const ready = useClientReady();
  const router = useRouter();
  const [lead, setLead] = useState(initialLead);
  const [activity, setActivity] = useState(initialActivity);
  const [denied, setDenied] = useState(false);
  const [message, setMessage] = useState("");
  const [announcement, setAnnouncement] = useState(saved ? "Lead saved." : "");
  const [selected, setSelected] = useState(initialLead.stage);
  const [confirmStage, setConfirmStage] = useState(false);
  const [pending, startTransition] = useTransition();
  const [operation, setOperation] = useState("");
  const [review, setReview] = useState(false);
  const [noteUncertain, setNoteUncertain] = useState(false);
  const [noteReview, setNoteReview] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState("");
  const guard = useRef(false);
  const receipt = useRef<
    { id: string; entry: Entry; version: number } | undefined
  >(undefined);
  const form = useForm<Entry>({
    resolver: zodResolver(entrySchema),
    defaultValues: { kind: "note", body: "" },
  });
  const kind = useWatch({ control: form.control, name: "kind" });
  useDirtyForm(form.formState.isDirty);
  function handleDenied(error: unknown) {
    if (error instanceof LeadApiError && [403, 404].includes(error.status)) {
      setDenied(true);
      return true;
    }
    if (error instanceof LeadApiError && error.status === 401) {
      startTransition(() => router.replace("/login"));
      return true;
    }
    return false;
  }
  async function reload() {
    try {
      const fresh = await getLead(lead.id);
      const events = await getActivity(lead.id);
      setLead(fresh);
      setActivity(events);
      setReview(false);
      return fresh;
    } catch (error) {
      if (!handleDenied(error)) {
        setReview(true);
        setMessage(
          "The latest lead could not be loaded. Reload before making another change.",
        );
      }
      return null;
    }
  }
  async function saveStage() {
    if (guard.current || pending || review) return;
    if ((selected === "won" || selected === "lost") && !confirmStage) {
      setConfirmStage(true);
      return;
    }
    guard.current = true;
    setOperation("stage");
    setMessage("");
    startTransition(async () => {
      try {
        const result = await changeStage(lead.id, {
          expectedVersion: lead.version,
          stage: selected,
        });
        if (!result.ok) {
          if ([403, 404].includes(result.error.status || 0)) {
            setDenied(true);
            return;
          }
          if (result.error.status === 409 || result.error.uncertain) {
            const fresh = await reload();
            setConfirmStage(false);
            if (fresh)
              setMessage(
                "This lead changed. Review its current stage and save your selected stage again.",
              );
            return;
          }
          setMessage(result.error.message);
          return;
        }
        setLead(result.data);
        setSelected(result.data.stage);
        setConfirmStage(false);
        setAnnouncement("Stage saved.");
        await reload();
      } catch {
        await reload();
        setMessage(
          "The stage result could not be confirmed. Review the latest stage before saving again.",
        );
      } finally {
        guard.current = false;
      }
    });
  }
  async function saveEntry(entry: Entry) {
    if (!receipt.current)
      receipt.current = {
        id: crypto.randomUUID(),
        entry,
        version: lead.version,
      };
    const current = receipt.current;
    setOperation("note");
    startTransition(async () => {
      try {
        const result = await addLeadNote(lead.id, {
          submissionId: current.id,
          expectedVersion: current.version,
          ...current.entry,
        });
        if (!result.ok) {
          if ([403, 404].includes(result.error.status || 0)) {
            setDenied(true);
            return;
          }
          if (result.error.status === 409) {
            if (!noteUncertain) receipt.current = undefined;
            const fresh = await reload();
            if (fresh) {
              receipt.current = receiptAfterNoteConflict(
                current,
                noteUncertain,
                fresh.version,
              );
              setNoteReview(true);
              setMessage(
                "This lead changed. Review the latest activity, then explicitly save your preserved entry again.",
              );
            }
            return;
          }
          if (result.error.uncertain) setNoteUncertain(true);
          receipt.current = receiptAfterFailure(
            receipt.current,
            noteUncertain,
            result.error,
          );
          setMessage(result.error.message);
          return;
        }
        setLead((value) => ({ ...value, version: result.data.leadVersion }));
        form.reset({ kind: "note", body: "" });
        receipt.current = undefined;
        setNoteUncertain(false);
        setNoteReview(false);
        setAnnouncement(
          current.entry.kind === "call" ? "Call log saved." : "Note added.",
        );
        await reload();
      } catch {
        setNoteUncertain(true);
        setMessage(
          "The entry could not be confirmed. Explicitly retry with the same submission key to avoid duplicates.",
        );
      } finally {
        guard.current = false;
      }
    });
  }
  if (denied)
    return (
      <main id="main-content" className="min-w-0 flex-1 px-4 py-10 sm:px-8">
        <Alert>
          <AlertDescription>
            This lead is no longer available to your account.{" "}
            <Link href="/crm/leads?view=mine" className="underline">
              My leads
            </Link>
          </AlertDescription>
        </Alert>
      </main>
    );
  return (
    <main id="main-content" className="min-w-0 flex-1 px-4 py-8 sm:px-8">
      <Link
        href={back}
        className="mb-5 inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-primary"
      >
        ← Back to leads
      </Link>
      <header className="mb-8 flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap gap-2">
            <SourceBadge source={lead.source} />
            <StageBadge stage={lead.stage} />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight break-words">
            {lead.name}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Received <LeadDate value={lead.createdAt} />
          </p>
        </div>
        <Link
          href={`/crm/leads/${lead.id}/edit`}
          className={buttonVariants({ variant: "outline" })}
        >
          Edit details
        </Link>
      </header>
      <p role="status" className="sr-only">
        {announcement}
      </p>
      {message && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>
            {message}
            {review && (
              <Button
                type="button"
                variant="ghost"
                disabled={pending}
                onClick={() => {
                  startTransition(async () => {
                    await reload();
                  });
                }}
              >
                Reload latest lead
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}
      <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(17rem,1fr)]">
        <aside className="min-w-0 space-y-6 lg:col-start-2 lg:row-start-1">
          <LeadSection title="Contact details">
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Phone</dt>
                <dd className="mt-1 break-all">
                  {lead.phone ? (
                    <a
                      href={`tel:${lead.phone}`}
                      className="inline-flex min-h-11 items-center text-primary underline"
                    >
                      {lead.phone}
                    </a>
                  ) : (
                    "No phone provided"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Email</dt>
                <dd className="mt-1 break-all">
                  {lead.email ? (
                    <a
                      href={`mailto:${lead.email}`}
                      className="inline-flex min-h-11 items-center text-primary underline"
                    >
                      {lead.email}
                    </a>
                  ) : (
                    "No email provided"
                  )}
                </dd>
              </div>
            </dl>
          </LeadSection>
          <LeadSection title="Requirements">
            <p className="text-sm">
              {lead.purpose === "rent" ? "Looking to rent" : "Looking to buy"}
            </p>
            <p className="text-sm text-muted-foreground">
              {budgetLabel(lead.budgetFils, lead.purpose)}
            </p>
            <div className="border-t border-border pt-4">
              <h3 className="text-xs font-semibold text-muted-foreground">
                Property
              </h3>
              <p className="mt-2 break-words text-sm">
                {lead.property?.id ? (
                  <Link
                    href={`/crm/properties/${lead.property.id}`}
                    className="text-primary underline"
                  >
                    {lead.property.title}
                  </Link>
                ) : (
                  lead.property?.title || "No property selected"
                )}
              </p>
              {lead.property?.location && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {lead.property.location}
                </p>
              )}
              {lead.property && !lead.property.available && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Unavailable · retained property context
                </p>
              )}
            </div>
          </LeadSection>
          <LeadSection title="Lead stage">
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                void saveStage();
              }}
            >
              <Field>
                <FieldLabel htmlFor="detail-stage">Stage</FieldLabel>
                <NativeSelect
                  id="detail-stage"
                  disabled={!ready || pending || review}
                  value={selected}
                  onChange={(event) => {
                    setSelected(event.target.value as Detail["stage"]);
                    setConfirmStage(false);
                  }}
                >
                  {stages.map((stage) => (
                    <option key={stage} value={stage}>
                      {stageLabels[stage]}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              {confirmStage && (
                <Alert>
                  <AlertDescription>
                    Mark this lead as {stageLabels[selected]}?{" "}
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setConfirmStage(false);
                        setSelected(lead.stage);
                      }}
                    >
                      Cancel
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
              <SubmitButton
                className="w-full"
                pending={pending && operation === "stage"}
                label={
                  confirmStage
                    ? `Confirm ${stageLabels[selected]}`
                    : "Save stage"
                }
                pendingLabel="Saving stage…"
                disabled={
                  !ready || pending || review || selected === lead.stage
                }
              />
            </form>
          </LeadSection>
          <LeadSection title="Assignment">
            <p className="break-words text-sm">
              <AssigneeContext lead={lead} manager={manager} />
            </p>
            {manager && (
              <AssignmentDialog
                lead={lead}
                onSaved={(updated, text) => {
                  setLead(updated);
                  setAnnouncement(text);
                  startTransition(async () => {
                    await reload();
                  });
                }}
              />
            )}
          </LeadSection>
        </aside>
        <div className="min-w-0 space-y-6 lg:col-start-1 lg:row-start-1">
          {lead.originalMessage && (
            <LeadSection title="Original inquiry">
              <p className="text-sm leading-7 break-words whitespace-pre-wrap">
                {lead.originalMessage}
              </p>
            </LeadSection>
          )}
          <LeadSection
            title="Follow up"
            description="Keep notes and call logs together for the next conversation."
          >
            <form
              className="space-y-4"
              noValidate
              onSubmit={async (event) => {
                event.preventDefault();
                if (guard.current || pending || review || noteReview || !ready)
                  return;
                guard.current = true;
                setMessage("");
                const data = new FormData(event.currentTarget);
                if (!noteUncertain) {
                  form.setValue(
                    "kind",
                    String(data.get("kind")) as Entry["kind"],
                  );
                  form.setValue("body", String(data.get("body") || ""));
                }
                await form.handleSubmit(saveEntry, () => {
                  guard.current = false;
                })(event);
              }}
            >
              <Field>
                <FieldLabel htmlFor="entry-kind">Entry type</FieldLabel>
                <NativeSelect
                  id="entry-kind"
                  {...form.register("kind")}
                  disabled={!ready || pending || noteUncertain}
                >
                  <option value="note">Note</option>
                  <option value="call">Call log</option>
                </NativeSelect>
              </Field>
              <Field>
                <FieldLabel htmlFor="entry-body">
                  {kind === "call" ? "Call log" : "Note"}
                </FieldLabel>
                <Textarea
                  id="entry-body"
                  {...form.register("body")}
                  rows={5}
                  maxLength={5000}
                  placeholder={
                    kind === "call"
                      ? "Record the conversation and next steps…"
                      : "Add useful context for this lead…"
                  }
                  disabled={!ready || pending || noteUncertain}
                  aria-invalid={!!form.formState.errors.body}
                  aria-describedby={
                    form.formState.errors.body ? "entry-error" : undefined
                  }
                />
                <FieldError id="entry-error">
                  {form.formState.errors.body?.message}
                </FieldError>
              </Field>
              {noteReview && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={() => setNoteReview(false)}
                >
                  I have reviewed the latest activity
                </Button>
              )}
              <SubmitButton
                pending={pending && operation === "note"}
                label={
                  noteUncertain
                    ? "Retry same entry"
                    : kind === "call"
                      ? "Save call log"
                      : "Add note"
                }
                pendingLabel={
                  kind === "call" ? "Saving call log…" : "Adding note…"
                }
                disabled={!ready || pending || review || noteReview}
              />
            </form>
          </LeadSection>
          <LeadSection title="Activity">
            <ol className="space-y-0">
              {activity.items.map((event) => (
                <li
                  key={event.id}
                  className="relative border-s border-border pb-7 ps-6 last:pb-0"
                >
                  <span
                    aria-hidden="true"
                    className="absolute -start-[5px] top-1.5 size-2.5 rounded-full border-2 border-card bg-primary"
                  />
                  <h3 className="text-sm font-medium break-words">
                    {activityTitle(event)}
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {event.actor?.name || "Website"} ·{" "}
                    <LeadDate value={event.createdAt} />{" "}
                    {new Date(event.createdAt).toLocaleTimeString("en-GB", {
                      timeZone: "Asia/Dubai",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  {event.note && (
                    <p className="mt-3 text-sm leading-7 break-words whitespace-pre-wrap">
                      {event.note.body}
                    </p>
                  )}
                </li>
              ))}
            </ol>
            {activity.items.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No activity to display.
              </p>
            )}
            {activity.items.length < activity.total && (
              <Button
                variant="outline"
                className="w-full"
                disabled={loadingMore || pending}
                onClick={async () => {
                  if (loadingMore) return;
                  setLoadingMore(true);
                  setMoreError("");
                  try {
                    const result = await getActivity(
                      lead.id,
                      activity.page + 1,
                    );
                    setActivity((previous) => ({
                      ...result,
                      items: [
                        ...previous.items,
                        ...result.items.filter(
                          (item) =>
                            !previous.items.some(
                              (existing) => existing.id === item.id,
                            ),
                        ),
                      ],
                    }));
                  } catch (error) {
                    if (!handleDenied(error))
                      setMoreError(
                        "More activity could not be loaded. Try again.",
                      );
                  } finally {
                    setLoadingMore(false);
                  }
                }}
              >
                {loadingMore ? "Loading activity…" : "Load more"}
              </Button>
            )}
            {moreError && (
              <Alert variant="destructive">
                <AlertDescription>{moreError}</AlertDescription>
              </Alert>
            )}
          </LeadSection>
        </div>
      </div>
    </main>
  );
}
