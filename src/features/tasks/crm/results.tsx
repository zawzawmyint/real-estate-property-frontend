import Link from "next/link";
import { redirect } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingState } from "@/components/ui/loading-state";
import { getStaffTasks } from "../data/server";
import { taskApiQuery, type TaskFilters } from "../data/filters";
import { taskReadRecovery } from "../data/request";
import { TaskList } from "./task-list";
import { RetryTasks } from "./retry-results";

export function TaskLoading() {
  return (
    <LoadingState
      label="Loading tasks…"
      className="mt-5 rounded-xl border border-border bg-card"
    />
  );
}
export async function TaskResults({
  filters,
  leadId,
}: {
  filters: TaskFilters;
  leadId?: string;
}) {
  let initial;
  try {
    initial = await getStaffTasks(taskApiQuery(filters, leadId));
  } catch (error) {
    const recovery = taskReadRecovery(error);
    if (recovery === "login") redirect("/login");
    return (
      <Alert variant="destructive" className="mt-5">
        <AlertDescription>
          {recovery === "inaccessible"
            ? "These tasks are no longer available to your account."
            : "Tasks could not be loaded."}{" "}
          {recovery === "retry" ? (
            <RetryTasks />
          ) : (
            <Link href="/crm/tasks" className="underline">
              Back to tasks
            </Link>
          )}
        </AlertDescription>
      </Alert>
    );
  }
  return <TaskList initial={initial} filters={filters} leadId={leadId} />;
}
