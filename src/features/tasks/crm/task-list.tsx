"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DataTable, type DataColumn } from "@/components/crm/data-table";
import { CollectionPagination } from "@/components/crm/collection-pagination";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Icon } from "@/components/ui/icon";
import { useClientReady } from "@/lib/use-client-ready";
import { getTasks } from "../data/queries";
import { taskReadRecovery } from "../data/request";
import { taskApiQuery, taskHref, type TaskFilters } from "../data/filters";
import type { Task, TaskPage } from "../data/types";
import { TaskDate, TaskState } from "./presentation";
import { useTaskRefresh } from "./use-task-refresh";

export function TaskList({
  initial,
  ...props
}: {
  initial: TaskPage;
  filters: TaskFilters;
  leadId?: string;
}) {
  const [source, setSource] = useState({ initial, revision: 0 });
  if (source.initial !== initial)
    setSource({ initial, revision: source.revision + 1 });
  return <TaskListPage key={source.revision} initial={initial} {...props} />;
}

function TaskListPage({
  initial,
  filters,
  leadId,
}: {
  initial: TaskPage;
  filters: TaskFilters;
  leadId?: string;
}) {
  const [data, setData] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [denied, setDenied] = useState(false);
  const guard = useRef(false);
  const mounted = useRef(true);
  const ready = useClientReady();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const href = useCallback(
    (page: number) =>
      taskHref(pathname, filters, page, new URLSearchParams(params), !!leadId),
    [pathname, filters, params, leadId],
  );
  useEffect(() => {
    const last = Math.max(1, Math.ceil(initial.total / initial.pageSize));
    if (initial.page > last) router.replace(href(last));
  }, [initial.page, initial.pageSize, initial.total, href, router]);
  const refresh = useCallback(
    async (manual = false) => {
      if (guard.current || denied) return;
      if (manual && filters.page !== 1) {
        router.replace(href(1));
        return;
      }
      guard.current = true;
      setBusy(true);
      try {
        const fresh = await getTasks(taskApiQuery(filters, leadId));
        if (!mounted.current) return;
        const last = Math.max(1, Math.ceil(fresh.total / fresh.pageSize));
        if (fresh.page > last) router.replace(href(last));
        setData(fresh);
        setMessage("");
      } catch (error) {
        if (!mounted.current) return;
        const recovery = taskReadRecovery(error);
        if (recovery === "login") router.replace("/login");
        else if (recovery === "inaccessible") {
          setDenied(true);
          setData({ ...initial, items: [], total: 0 });
        } else
          setMessage(
            "Tasks could not be refreshed. The last confirmed results remain below. Try Refresh tasks again.",
          );
      } finally {
        guard.current = false;
        setBusy(false);
      }
    },
    [denied, filters, href, initial, leadId, router],
  );
  const backgroundRefresh = useCallback(() => {
    void refresh();
  }, [refresh]);
  useTaskRefresh(backgroundRefresh);
  if (denied)
    return (
      <Alert>
        <AlertDescription>
          These tasks are no longer available to your account.{" "}
          <Link href="/crm/tasks" className="underline">
            Back to tasks
          </Link>
        </AlertDescription>
      </Alert>
    );
  const columns: DataColumn<Task>[] = [
    {
      id: "task",
      header: "Follow-up",
      className: "max-w-sm whitespace-normal",
      cell: (task) => (
        <div className="min-w-0">
          <Link
            href={`/crm/tasks/${task.id}`}
            className="font-medium break-words text-primary hover:underline"
          >
            {task.title}
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">
            {task.assignedAgent?.name || "Unassigned"}
          </p>
        </div>
      ),
    },
    ...(!leadId
      ? [
          {
            id: "lead",
            header: "Lead",
            className: "max-w-48 whitespace-normal",
            cell: (task: Task) => (
              <Link
                href={`/crm/leads/${task.lead.id}`}
                className="break-words hover:text-primary hover:underline"
              >
                {task.lead.name}
              </Link>
            ),
          },
        ]
      : []),
    {
      id: "due",
      header: "Due · Dubai",
      cell: (task) => (
        <span className="text-sm">
          <TaskDate value={task.dueAt} />
        </span>
      ),
    },
    { id: "state", header: "State", cell: (task) => <TaskState task={task} /> },
  ];
  return (
    <div className="mt-5 min-w-0 space-y-4" aria-busy={busy}>
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <p>
          {data.total} {data.total === 1 ? "task" : "tasks"} · Updated{" "}
          <TaskDate value={data.asOf} /> · Dubai
        </p>
        <Button
          variant="ghost"
          size="sm"
          disabled={!ready || busy}
          onClick={() => void refresh(true)}
        >
          <Icon name="retry" />
          {leadId ? "Refresh lead tasks" : "Refresh tasks"}
        </Button>
      </div>
      {message && (
        <Alert variant="destructive">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
      <div className="min-w-0">
        <DataTable
          rows={data.items}
          columns={columns}
          getRowKey={(task) => task.id}
          label={leadId ? "Lead tasks" : "Tasks"}
          empty={
            <div className="px-5 py-12 text-center">
              <p className="font-medium">
                {filters.status === "open" && filters.due === "all"
                  ? "No open follow-ups"
                  : "No tasks match these filters"}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {filters.status === "open" && filters.due === "all"
                  ? "Add a follow-up to keep the next conversation on track."
                  : "Try a different status or due period."}
              </p>
            </div>
          }
          renderMobile={(task) => (
            <article className="space-y-3 rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <Link
                  href={`/crm/tasks/${task.id}`}
                  className="min-w-0 font-medium break-words text-primary"
                >
                  {task.title}
                </Link>
                <TaskState task={task} />
              </div>
              {!leadId && (
                <Link
                  href={`/crm/leads/${task.lead.id}`}
                  className="block text-sm break-words underline"
                >
                  {task.lead.name}
                </Link>
              )}
              <p className="text-sm text-muted-foreground">
                <TaskDate value={task.dueAt} /> · Dubai
              </p>
              <p className="text-xs text-muted-foreground">
                {task.assignedAgent?.name || "Unassigned"}
              </p>
            </article>
          )}
        />
      </div>
      <CollectionPagination
        showTotal
        page={data.page}
        pageSize={data.pageSize}
        total={data.total}
        href={href}
      />
    </div>
  );
}
