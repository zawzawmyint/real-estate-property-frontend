"use client";
import Link from "next/link";
import { useCallback, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useClientReady } from "@/lib/use-client-ready";
import { getLead } from "@/features/leads/data/queries";
import type { LeadDetail } from "@/features/leads/data/types";
import { useDirtyForm } from "@/features/leads/crm/use-dirty-form";
import {
  taskFormSchema,
  taskDueAt,
  type TaskFields as Fields,
} from "../data/input";
import { createTask } from "../data/actions";
import type { CreateTask } from "../data/types";
import { taskReadRecovery } from "../data/request";
import { taskEligibility } from "./presentation";
import { TaskFields } from "./task-fields";
import { TaskLeadPicker } from "./lead-picker";
import { useTaskRefresh } from "./use-task-refresh";

export function TaskForm({
  initialLead,
  manager,
}: {
  initialLead: LeadDetail | null;
  manager: boolean;
}) {
  const ready = useClientReady();
  const router = useRouter();
  const [lead, setLead] = useState(initialLead);
  const [message, setMessage] = useState("");
  const [uncertain, setUncertain] = useState(false);
  const [review, setReview] = useState(false);
  const [denied, setDenied] = useState(false);
  const [existingTaskId, setExistingTaskId] = useState<string>();
  const [pending, startTransition] = useTransition();
  const guard = useRef(false);
  const reading = useRef(false);
  const receipt = useRef<CreateTask | null>(null);
  const submissionId = useRef<string | null>(null);
  const form = useForm<Fields>({
    resolver: zodResolver(taskFormSchema()),
    defaultValues: { title: "", notes: "", date: "", time: "" },
  });
  const values = useWatch({ control: form.control });
  useDirtyForm(form.formState.isDirty && !denied);
  const eligibility = lead
    ? taskEligibility(lead)
    : "Choose a lead for this follow-up.";
  const readError = useCallback(
    (error: unknown) => {
      const recovery = taskReadRecovery(error);
      if (recovery === "login") router.replace("/login");
      else if (recovery === "inaccessible") {
        setDenied(true);
        setLead(null);
        form.reset();
        receipt.current = null;
      } else
        setMessage(
          "The latest lead could not be loaded. Try again before saving.",
        );
    },
    [router, form],
  );
  const refresh = useCallback(
    async (accept = false) => {
      if (!lead || reading.current || guard.current || denied) return;
      reading.current = true;
      try {
        const fresh = await getLead(lead.id);
        if (accept) {
          setLead(fresh);
          receipt.current = null;
          setUncertain(false);
          setReview(false);
          setMessage(
            "Lead context updated. Review your preserved task details before creating the task.",
          );
        } else if (fresh.version !== lead.version) {
          setReview(true);
          setMessage(
            "This lead changed. Load its latest assignment and stage before saving your task.",
          );
        }
      } catch (error) {
        readError(error);
      } finally {
        reading.current = false;
      }
    },
    [lead, denied, readError],
  );
  const background = useCallback(() => {
    void refresh();
  }, [refresh]);
  useTaskRefresh(background);
  async function save(fields: Fields) {
    submissionId.current ??= crypto.randomUUID();
    receipt.current ??= {
      submissionId: submissionId.current,
      leadId: lead!.id,
      expectedLeadVersion: lead!.version,
      title: fields.title,
      notes: fields.notes.trim() || null,
      dueAt: taskDueAt(fields),
    };
    startTransition(async () => {
      try {
        const result = await createTask(receipt.current!);
        if (result.ok) {
          form.reset(fields);
          startTransition(() => {
            router.push(`/crm/tasks/${result.data.task.id}`);
            router.refresh();
          });
          return;
        }
        setMessage(result.error.message);
        if (result.error.status === 401) {
          router.replace("/login");
          return;
        }
        if ([403, 404].includes(result.error.status || 0)) {
          setDenied(true);
          setLead(null);
          form.reset();
          receipt.current = null;
          return;
        }
        if (result.error.existingTaskId) {
          setExistingTaskId(result.error.existingTaskId);
          setUncertain(false);
        } else if (result.error.uncertain) setUncertain(true);
        else {
          receipt.current = null;
          setUncertain(false);
          if (uncertain || result.error.status === 409) setReview(true);
        }
      } catch {
        setUncertain(true);
        setMessage(
          "The result could not be confirmed. Explicitly retry the same task to check whether it was saved.",
        );
      } finally {
        guard.current = false;
      }
    });
  }
  if (denied)
    return (
      <main id="main-content" className="min-w-0 flex-1 px-4 py-8 sm:px-8">
        <Alert>
          <AlertDescription>
            This lead is no longer available to your account.{" "}
            <Link href="/crm/tasks" className="underline">
              Back to tasks
            </Link>
          </AlertDescription>
        </Alert>
      </main>
    );
  const locked = !ready || pending || uncertain || !!existingTaskId;
  return (
    <main id="main-content" className="min-w-0 flex-1 px-4 py-8 sm:px-8">
      <Link
        href="/crm/tasks"
        className="mb-5 inline-flex min-h-11 items-center text-sm text-muted-foreground hover:text-primary"
      >
        ← Back to tasks
      </Link>
      <PageHeader
        title="New follow-up"
        description="Give the next conversation a clear next step and a due time."
      />
      <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(17rem,1fr)]">
        <form
          noValidate
          className="min-w-0 space-y-6 rounded-xl border border-border bg-card p-4 sm:p-6"
          onSubmit={async (event) => {
            event.preventDefault();
            if (
              guard.current ||
              pending ||
              !ready ||
              review ||
              existingTaskId ||
              !lead ||
              eligibility
            )
              return;
            guard.current = true;
            setMessage("");
            if (uncertain && receipt.current) {
              await save(form.getValues());
              return;
            }
            const native = new FormData(event.currentTarget);
            for (const name of ["title", "notes", "date", "time"] as const)
              form.setValue(name, String(native.get(name) || ""));
            await form.handleSubmit(save, () => {
              guard.current = false;
            })(event);
          }}
        >
          {!initialLead && (
            <div className="border-b border-border pb-6">
              <h2 className="mb-4 font-semibold">Choose the lead</h2>
              <TaskLeadPicker
                manager={manager}
                selected={lead}
                disabled={locked || review}
                onSelect={(value) => {
                  setLead(value);
                  setMessage("");
                }}
                onError={readError}
              />
            </div>
          )}
          <TaskFields form={form} disabled={locked} />
          {eligibility && (
            <Alert>
              <AlertDescription>
                {eligibility}{" "}
                {lead && (
                  <Link href={`/crm/leads/${lead.id}`} className="underline">
                    Review lead
                  </Link>
                )}
              </AlertDescription>
            </Alert>
          )}
          {message && (
            <Alert variant="destructive">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
          {existingTaskId && (
            <Link
              href={`/crm/tasks/${existingTaskId}`}
              className="inline-flex min-h-11 items-center text-primary underline"
            >
              Review saved task
            </Link>
          )}
          {(review || uncertain) && !existingTaskId && (
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => void refresh(true)}
            >
              Load latest lead for review
            </Button>
          )}
          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
            <SubmitButton
              pending={pending}
              pendingLabel="Creating task…"
              label={uncertain ? "Retry same task" : "Create task"}
              disabled={
                !ready || pending || review || !!existingTaskId || !!eligibility
              }
            />
            <Link
              href="/crm/tasks"
              className="inline-flex min-h-11 items-center px-3 text-sm text-muted-foreground"
            >
              Cancel
            </Link>
          </div>
        </form>
        <aside className="min-w-0 rounded-xl border border-border bg-card p-5 sm:p-6">
          <p className="text-xs font-semibold tracking-widest text-primary uppercase">
            Follow-up context
          </p>
          <h2 className="mt-3 text-lg font-semibold">A clear next step</h2>
          <dl className="mt-6 space-y-5 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Lead</dt>
              <dd className="mt-1 font-medium break-words">
                {lead ? (
                  <Link
                    href={`/crm/leads/${lead.id}`}
                    className="text-primary hover:underline"
                  >
                    {lead.name}
                  </Link>
                ) : (
                  "Choose a lead"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Current Agent</dt>
              <dd className="mt-1 break-words">
                {lead?.assignedAgent?.name || "Unassigned"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Due · Dubai</dt>
              <dd className="mt-1">
                {values.date && values.time
                  ? `${values.date} at ${values.time}`
                  : "Set an explicit date and time"}
              </dd>
            </div>
          </dl>
          <p className="mt-6 border-t border-border pt-5 text-xs leading-6 text-muted-foreground">
            Responsibility follows the lead’s current assignment. Completing a
            follow-up does not change the lead’s stage.
          </p>
        </aside>
      </div>
    </main>
  );
}
