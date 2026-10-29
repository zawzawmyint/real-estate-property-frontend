"use client";
import Link from "next/link";
import { useCallback, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useClientReady } from "@/lib/use-client-ready";
import { getLead } from "@/features/leads/data/queries";
import { stageLabels } from "@/features/leads/data/input";
import type { LeadDetail } from "@/features/leads/data/types";
import { useDirtyForm } from "@/features/leads/crm/use-dirty-form";
import {
  taskFormSchema,
  taskDueAt,
  type TaskFields as Fields,
} from "../data/input";
import { updateTask, updateTaskStatus } from "../data/actions";
import { getTask } from "../data/queries";
import type { TaskEnvelope, TaskActionResult } from "../data/types";
import { taskReadRecovery } from "../data/request";
import { taskEligibility, TaskDate, TaskState } from "./presentation";
import { TaskFields } from "./task-fields";
import { useTaskRefresh } from "./use-task-refresh";
import {
  taskEditFields as fields,
  reconcileTaskEdit,
  type TaskEditConflict,
} from "./edit-reconciliation";

export function TaskDetail({
  initial,
  initialLead,
}: {
  initial: TaskEnvelope;
  initialLead: LeadDetail;
}) {
  const [task, setTask] = useState(initial.task);
  const [lead, setLead] = useState(initialLead);
  const [asOf, setAsOf] = useState(initial.asOf);
  const [editing, setEditing] = useState(false);
  const [review, setReview] = useState(false);
  const [conflicts, setConflicts] = useState<TaskEditConflict[]>([]);
  const [denied, setDenied] = useState(false);
  const [message, setMessage] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pending, startTransition] = useTransition();
  const guard = useRef(false);
  const reading = useRef(false);
  const editBaseline = useRef(initial.task);
  const ready = useClientReady();
  const router = useRouter();
  const form = useForm<Fields>({
    resolver: zodResolver(taskFormSchema(task.dueAt)),
    defaultValues: fields(task),
  });
  const eligibility = taskEligibility(lead);
  const dirtyFields = form.formState.dirtyFields;
  const mutationBlocked = review || conflicts.length > 0;
  const history: [string, string][] = [
    ["Created", task.createdAt],
    ["Last changed", task.updatedAt],
  ];
  if (task.completedAt) history.push(["Completed", task.completedAt]);
  if (task.cancelledAt) history.push(["Cancelled", task.cancelledAt]);
  useDirtyForm(editing && form.formState.isDirty && !denied);
  const readError = useCallback(
    (error: unknown) => {
      const recovery = taskReadRecovery(error);
      if (recovery === "login") router.replace("/login");
      else if (recovery === "inaccessible") {
        setDenied(true);
        setEditing(false);
        form.reset({ title: "", notes: "", date: "", time: "" });
      } else
        setMessage(
          "The latest task context could not be loaded. Try refreshing again.",
        );
    },
    [router, form],
  );
  const refresh = useCallback(
    async (accept = false) => {
      if (reading.current || guard.current || denied) return;
      reading.current = true;
      setRefreshing(true);
      try {
        const [fresh, currentLead] = await Promise.all([
          getTask(task.id),
          getLead(task.lead.id),
        ]);
        if (
          !accept &&
          (editing || review) &&
          (fresh.task.version !== task.version ||
            currentLead.version !== lead.version)
        ) {
          setReview(true);
          setMessage(
            "This task or its lead changed. Your draft is preserved. Load the latest task for review before saving.",
          );
        } else {
          setTask(fresh.task);
          setLead(currentLead);
          setAsOf(fresh.asOf);
          if (accept) {
            if (editing) {
              const draft = form.getValues();
              const dirty = Object.fromEntries(
                (["title", "notes", "date", "time"] as const).map((name) => [
                  name,
                  dirtyFields[name] === true,
                ]),
              );
              const merged = reconcileTaskEdit(
                editBaseline.current,
                fresh.task,
                draft,
                dirty,
              );
              form.reset(fields(fresh.task));
              for (const name of ["title", "notes", "date", "time"] as const)
                form.setValue(name, merged.values[name], { shouldDirty: true });
              setConflicts(merged.conflicts);
              if (!merged.conflicts.length) editBaseline.current = fresh.task;
            }
            setReview(false);
            setMessage(
              "Latest task and lead loaded. Review the current details and your preserved draft before making another change.",
            );
          } else setMessage("");
        }
      } catch (error) {
        readError(error);
      } finally {
        reading.current = false;
        setRefreshing(false);
      }
    },
    [
      denied,
      editing,
      lead.version,
      readError,
      review,
      task.id,
      task.lead.id,
      task.version,
      form,
      dirtyFields,
    ],
  );
  const background = useCallback(() => {
    void refresh();
  }, [refresh]);
  useTaskRefresh(background);

  function apply(result: TaskActionResult) {
    if (result.ok) {
      setTask(result.data.task);
      setAsOf(result.data.asOf);
      form.reset(fields(result.data.task));
      setEditing(false);
      setReview(false);
      setConflicts([]);
      setConfirm(false);
      setMessage("");
      setAnnouncement("Task saved.");
      startTransition(() => router.refresh());
      return;
    }
    if (result.error.status === 401) {
      router.replace("/login");
      return;
    }
    if ([403, 404].includes(result.error.status || 0)) {
      setDenied(true);
      setEditing(false);
      form.reset({ title: "", notes: "", date: "", time: "" });
      return;
    }
    setMessage(result.error.message);
    if (result.error.uncertain || result.error.status === 409) setReview(true);
    setConfirm(false);
  }
  async function save(value: Fields) {
    startTransition(async () => {
      try {
        apply(
          await updateTask(task.id, {
            expectedVersion: task.version,
            expectedLeadVersion: lead.version,
            title: value.title,
            notes: value.notes.trim() || null,
            dueAt: taskDueAt(value, task.dueAt),
          }),
        );
      } catch {
        setReview(true);
        setMessage(
          "The update could not be confirmed. Load the latest task for review before making another change.",
        );
      } finally {
        guard.current = false;
      }
    });
  }
  function transition(status: "completed" | "cancelled") {
    if (
      guard.current ||
      reading.current ||
      pending ||
      mutationBlocked ||
      !ready
    )
      return;
    guard.current = true;
    setMessage("");
    startTransition(async () => {
      try {
        apply(
          await updateTaskStatus(task.id, {
            expectedVersion: task.version,
            status,
          }),
        );
      } catch {
        setReview(true);
        setConfirm(false);
        setMessage(
          "The task status could not be confirmed. Load the latest task for review before another change.",
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
            This task is no longer available to your account.{" "}
            <Link href="/crm/tasks" className="underline">
              Back to tasks
            </Link>
          </AlertDescription>
        </Alert>
      </main>
    );
  return (
    <main id="main-content" className="min-w-0 flex-1 px-4 py-8 sm:px-8">
      <Link
        href="/crm/tasks"
        className="mb-5 inline-flex min-h-11 items-center text-sm text-muted-foreground hover:text-primary"
      >
        ← Back to tasks
      </Link>
      <div className="mb-3">
        <TaskState task={task} />
      </div>
      <PageHeader
        className="[&>div]:min-w-0 [&>div]:max-w-full [&_h1]:break-words"
        title={task.title}
        description={
          <>
            Follow-up for{" "}
            <Link
              href={`/crm/leads/${lead.id}`}
              className="text-primary underline"
            >
              {lead.name}
            </Link>
          </>
        }
        actions={
          <Button
            variant="outline"
            disabled={!ready || refreshing || pending}
            onClick={() => void refresh()}
          >
            Refresh task
          </Button>
        }
      />
      <p role="status" className="sr-only">
        {announcement}
      </p>
      {message && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
      {review && (
        <div className="mb-6">
          <Button
            variant="outline"
            disabled={pending || refreshing}
            onClick={() => void refresh(true)}
          >
            Load latest task for review
          </Button>
        </div>
      )}
      {conflicts.length > 0 && (
        <section
          aria-label="Resolve task changes"
          className="mb-6 space-y-5 rounded-xl border border-primary/30 bg-card p-4 sm:p-6"
        >
          <div>
            <h2 className="font-semibold">Review overlapping changes</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              These fields changed in both the saved task and your draft. Saving
              stays blocked until you choose which values to keep.
            </p>
          </div>
          {conflicts.map((conflict) => (
            <div
              key={conflict.field}
              className="space-y-3 border-t border-border pt-4"
            >
              <h3 className="text-sm font-semibold">{conflict.label}</h3>
              <dl className="grid min-w-0 gap-4 text-sm sm:grid-cols-2">
                <div className="min-w-0">
                  <dt className="text-xs text-muted-foreground">
                    Latest saved
                  </dt>
                  <dd className="mt-2 break-words whitespace-pre-wrap">
                    {conflict.saved || "No notes"}
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-xs text-muted-foreground">Your draft</dt>
                  <dd className="mt-2 break-words whitespace-pre-wrap">
                    {conflict.draft || "No notes"}
                  </dd>
                </div>
              </dl>
            </div>
          ))}
          <div className="flex flex-wrap gap-3">
            <Button
              disabled={!ready || pending || refreshing || review}
              onClick={() => {
                editBaseline.current = task;
                setConflicts([]);
                setMessage(
                  "Your draft is kept. Review the merged fields, then save changes.",
                );
              }}
            >
              Keep my draft and continue
            </Button>
            <Button
              variant="outline"
              disabled={!ready || pending || refreshing || review}
              onClick={() => {
                const saved = fields(task);
                for (const conflict of conflicts) {
                  const names =
                    conflict.field === "dueAt"
                      ? (["date", "time"] as const)
                      : [conflict.field];
                  for (const name of names)
                    form.setValue(name, saved[name], { shouldDirty: true });
                }
                editBaseline.current = task;
                setConflicts([]);
                setMessage(
                  "Latest saved values restored for overlapping fields. Your other changes are preserved.",
                );
              }}
            >
              Use latest saved values
            </Button>
          </div>
        </section>
      )}
      <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(17rem,1fr)]">
        <section
          className="min-w-0 rounded-xl border border-border bg-card p-4 sm:p-6"
          aria-label="Task details"
        >
          {editing ? (
            <form
              noValidate
              className="space-y-6"
              onSubmit={async (event) => {
                event.preventDefault();
                if (
                  guard.current ||
                  reading.current ||
                  pending ||
                  !ready ||
                  mutationBlocked ||
                  eligibility ||
                  task.status !== "open"
                )
                  return;
                guard.current = true;
                setMessage("");
                const native = new FormData(event.currentTarget);
                for (const name of ["title", "notes", "date", "time"] as const)
                  form.setValue(name, String(native.get(name) || ""));
                await form.handleSubmit(save, () => {
                  guard.current = false;
                })(event);
              }}
            >
              <div>
                <p className="text-xs font-semibold tracking-widest text-primary uppercase">
                  Edit follow-up
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Keep the current due time to update an overdue task’s title or
                  notes.
                </p>
              </div>
              <TaskFields
                form={form}
                disabled={
                  !ready ||
                  pending ||
                  conflicts.length > 0 ||
                  task.status !== "open" ||
                  !!eligibility
                }
              />
              {eligibility && (
                <Alert>
                  <AlertDescription>
                    {eligibility} You can still complete or cancel an open task.
                  </AlertDescription>
                </Alert>
              )}
              <div className="flex flex-wrap gap-3 border-t border-border pt-5">
                <SubmitButton
                  pending={pending}
                  label="Save changes"
                  pendingLabel="Saving changes…"
                  disabled={
                    !ready ||
                    mutationBlocked ||
                    !!eligibility ||
                    refreshing ||
                    task.status !== "open"
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending || review}
                  onClick={() => {
                    setEditing(false);
                    setConflicts([]);
                    form.reset(fields(task));
                  }}
                >
                  Discard changes
                </Button>
              </div>
            </form>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
                <div>
                  <h2 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                    Due · Dubai
                  </h2>
                  <p
                    className={`mt-3 text-xl font-semibold ${task.isOverdue ? "text-destructive" : ""}`}
                  >
                    <TaskDate value={task.dueAt} />
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Asia/Dubai · UTC+04:00
                  </p>
                </div>
                {task.status === "open" && (
                  <Button
                    variant="outline"
                    disabled={
                      !ready ||
                      pending ||
                      mutationBlocked ||
                      refreshing ||
                      !!eligibility
                    }
                    onClick={async () => {
                      if (reading.current) return;
                      reading.current = true;
                      setRefreshing(true);
                      try {
                        const currentLead = await getLead(task.lead.id);
                        setLead(currentLead);
                        form.reset(fields(task));
                        editBaseline.current = task;
                        setEditing(true);
                      } catch (error) {
                        readError(error);
                      } finally {
                        reading.current = false;
                        setRefreshing(false);
                      }
                    }}
                  >
                    Edit task
                  </Button>
                )}
              </div>
              <div className="py-6">
                <h2 className="mb-3 font-semibold">Notes</h2>
                <p className="text-sm leading-7 break-words whitespace-pre-wrap">
                  {task.notes || "No notes added."}
                </p>
              </div>
              {task.status === "open" && (
                <div className="space-y-5 border-t border-border pt-6">
                  {eligibility && (
                    <Alert>
                      <AlertDescription>
                        {eligibility} You can still complete or cancel this
                        task.
                      </AlertDescription>
                    </Alert>
                  )}
                  <div className="flex flex-wrap gap-3">
                    <Button
                      disabled={
                        !ready || pending || mutationBlocked || refreshing
                      }
                      onClick={() => transition("completed")}
                    >
                      {pending ? "Saving…" : "Mark complete"}
                    </Button>
                    <Button
                      variant="outline"
                      disabled={
                        !ready || pending || mutationBlocked || refreshing
                      }
                      onClick={() => setConfirm(true)}
                    >
                      Cancel task
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
        <aside className="min-w-0 space-y-6">
          <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
            <h2 className="font-semibold">Lead & responsibility</h2>
            <dl className="mt-5 space-y-5 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Lead</dt>
                <dd className="mt-1 font-medium break-words">
                  <Link
                    href={`/crm/leads/${lead.id}`}
                    className="text-primary underline"
                  >
                    {lead.name}
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Current Agent</dt>
                <dd className="mt-1 break-words">
                  {lead.assignedAgent?.name || "Unassigned"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Lead stage</dt>
                <dd className="mt-1 capitalize">{stageLabels[lead.stage]}</dd>
              </div>
            </dl>
            <p className="mt-5 border-t border-border pt-4 text-xs leading-6 text-muted-foreground">
              Responsibility follows the lead’s current assignment. Task status
              and lead stage are managed independently.
            </p>
          </section>
          <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
            <h2 className="font-semibold">Task history</h2>
            <dl className="mt-5 space-y-4 text-xs">
              {history.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="mt-1">
                    <TaskDate value={value} />
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-5 border-t border-border pt-4 text-xs leading-6 text-muted-foreground">
              Updated <TaskDate value={asOf} /> · Dubai
              <br />
              Refreshes every minute while visible.
            </p>
          </section>
        </aside>
      </div>
      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent>
          <DialogTitle>Cancel this follow-up?</DialogTitle>
          <DialogDescription>
            The task will stay in the lead’s history as cancelled. This cannot
            be undone.
          </DialogDescription>
          <DialogFooter>
            <DialogClose
              render={<Button variant="outline" disabled={pending} />}
            >
              Keep task
            </DialogClose>
            <Button disabled={pending} onClick={() => transition("cancelled")}>
              Confirm cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
