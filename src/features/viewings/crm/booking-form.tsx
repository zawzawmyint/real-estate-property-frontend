"use client";
import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageHeader } from "@/components/layout/page-header";
import { SubmitButton } from "@/components/ui/submit-button";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldError } from "@/components/ui/field";
import { useClientReady } from "@/lib/use-client-ready";
import type { LeadDetail } from "@/features/leads/data/types";
import { getLead } from "@/features/leads/data/queries";
import { dubaiDate, shiftDay } from "../data/calendar";
import {
  scheduleSchema,
  scheduleInstants,
  type ScheduleFields,
} from "../data/input";
import { createViewing } from "../data/actions";
import type { CreateViewing } from "../data/types";
import { ViewingPropertyPicker } from "./property-picker";
import { ViewingScheduleFields } from "./schedule-fields";
export function BookingForm({
  initialLead,
  initialProperty,
}: {
  initialLead: LeadDetail;
  initialProperty: { id: string; title: string } | null;
}) {
  const ready = useClientReady();
  const router = useRouter();
  const [lead, setLead] = useState(initialLead);
  const [title, setTitle] = useState(initialProperty?.title || "");
  const [message, setMessage] = useState("");
  const [uncertain, setUncertain] = useState(false);
  const [review, setReview] = useState(false);
  const [denied, setDenied] = useState(false);
  const [existingViewingId, setExistingViewingId] = useState<string>();
  const [pending, startTransition] = useTransition();
  const guard = useRef(false);
  const receipt = useRef<CreateViewing | null>(null);
  const submissionId = useRef<string | null>(null);
  const form = useForm<ScheduleFields>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      propertyId: initialProperty?.id || "",
      date: shiftDay(dubaiDate(), 1),
      start: "10:00",
      end: "11:00",
    },
  });
  const values = useWatch({ control: form.control });
  const eligible =
    !!lead.assignedAgent?.available && !["won", "lost"].includes(lead.stage);
  async function save(value: ScheduleFields) {
    submissionId.current ??= crypto.randomUUID();
    if (!receipt.current)
      receipt.current = {
        submissionId: submissionId.current,
        leadId: lead.id,
        propertyId: value.propertyId,
        expectedLeadVersion: lead.version,
        ...scheduleInstants(value),
      };
    startTransition(async () => {
      try {
        const result = await createViewing(receipt.current!);
        if (result.ok) {
          startTransition(() => {
            router.push(`/crm/viewings/${result.data.id}?saved=1`);
            router.refresh();
          });
          return;
        }
        setMessage(result.error.message);
        if (result.error.status === 401) {
          startTransition(() => router.replace("/login"));
          return;
        }
        if ([403, 404].includes(result.error.status || 0)) setDenied(true);
        if (result.error.existingViewingId) {
          setExistingViewingId(result.error.existingViewingId);
          setUncertain(false);
          setReview(false);
        } else if (result.error.uncertain) setUncertain(true);
        else {
          receipt.current = null;
          setUncertain(false);
          if (uncertain || result.error.status === 409) setReview(true);
        }
      } catch {
        setUncertain(true);
        setMessage(
          "The save could not be confirmed. Your details are preserved. Explicitly retry the same booking to check whether it was saved.",
        );
      } finally {
        guard.current = false;
      }
    });
  }
  return (
    <main id="main-content" className="min-w-0 flex-1 px-4 py-8 sm:px-8">
      <Link
        className="mb-5 inline-flex min-h-11 items-center text-sm text-primary underline"
        href={`/crm/leads/${lead.id}`}
      >
        ← Back to lead
      </Link>
      <PageHeader
        title="Schedule viewing"
        description="Choose a property and a time to meet. Scheduling does not change the lead’s stage."
      />
      <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)]">
        <form
          className="min-w-0 space-y-6 rounded-xl border border-border bg-card p-4 sm:p-6"
          noValidate
          onSubmit={async (event) => {
            event.preventDefault();
            if (
              guard.current ||
              pending ||
              !ready ||
              review ||
              denied ||
              existingViewingId ||
              !eligible
            )
              return;
            guard.current = true;
            setMessage("");
            if (uncertain && receipt.current) {
              await save(form.getValues());
              return;
            }
            const native = new FormData(event.currentTarget);
            for (const name of ["date", "start", "end"] as const)
              form.setValue(name, String(native.get(name) || ""));
            await form.handleSubmit(save, () => {
              guard.current = false;
            })(event);
          }}
        >
          <div>
            <h2 className="mb-4 text-base font-semibold">The property</h2>
            <ViewingPropertyPicker
              value={values.propertyId || ""}
              currentLabel={title}
              disabled={
                !ready ||
                pending ||
                uncertain ||
                review ||
                denied ||
                !!existingViewingId ||
                !eligible
              }
              onChange={(id, label) => {
                form.setValue("propertyId", id, { shouldValidate: true });
                setTitle(label);
              }}
            />
            <FieldError>{form.formState.errors.propertyId?.message}</FieldError>
          </div>
          <div className="border-t border-border pt-6">
            <ViewingScheduleFields
              form={form}
              disabled={
                !ready ||
                pending ||
                uncertain ||
                review ||
                denied ||
                !!existingViewingId ||
                !eligible
              }
            />
          </div>
          {!eligible && (
            <Alert>
              <AlertDescription>
                {!lead.assignedAgent?.available
                  ? "An active Agent must be assigned before booking. Use the lead’s Assignment controls."
                  : "Won or lost leads cannot be booked."}{" "}
                <Link href={`/crm/leads/${lead.id}`} className="underline">
                  Review lead
                </Link>
              </AlertDescription>
            </Alert>
          )}
          {message && (
            <Alert variant="destructive">
              <AlertDescription>
                {message}
                {denied && (
                  <p>
                    This lead or property may no longer be available. Return to
                    the lead to review access.
                  </p>
                )}
              </AlertDescription>
            </Alert>
          )}
          {existingViewingId && (
            <Link
              className="inline-flex min-h-11 items-center text-primary underline"
              href={`/crm/viewings/${existingViewingId}`}
            >
              Review saved viewing
            </Link>
          )}
          {(review || uncertain) && !denied && !existingViewingId && (
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={async () => {
                try {
                  const fresh = await getLead(lead.id);
                  setLead(fresh);
                  receipt.current = null;
                  setUncertain(false);
                  setReview(false);
                  setMessage(
                    "Lead details refreshed. Review the assignment and booking, then schedule again. This attempt retains its booking identifier to prevent duplicates if an earlier request was saved.",
                  );
                } catch {
                  setMessage(
                    "The latest lead could not be loaded. Reload before another booking.",
                  );
                }
              }}
            >
              Load latest lead for review
            </Button>
          )}
          <SubmitButton
            pending={pending}
            label={uncertain ? "Retry same booking" : "Schedule viewing"}
            pendingLabel="Scheduling…"
            disabled={
              !ready ||
              pending ||
              review ||
              denied ||
              !!existingViewingId ||
              !eligible
            }
          />
        </form>
        <aside className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-base font-semibold">Booking summary</h2>
          <dl className="mt-5 space-y-5 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Lead</dt>
              <dd className="mt-1 font-medium break-words">{lead.name}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Assigned Agent</dt>
              <dd className="mt-1 break-words">
                {lead.assignedAgent?.name || "Unassigned"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Property</dt>
              <dd className="mt-1 break-words">
                {title || "Choose a property"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">
                Date & time · Dubai
              </dt>
              <dd className="mt-1">
                {values.date}
                <br />
                {values.start}–{values.end}
                {values.end && values.start && values.end < values.start
                  ? " (ends next day)"
                  : ""}
              </dd>
            </div>
          </dl>
          <p className="mt-6 border-t border-border pt-4 text-xs leading-6 text-muted-foreground">
            Appointments may overlap. Confirm the meeting time with your lead
            and Agent.
          </p>
        </aside>
      </div>
    </main>
  );
}
