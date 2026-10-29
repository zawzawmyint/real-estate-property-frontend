import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireStaffSession } from "@/lib/auth/server";
import { getStaffTask } from "@/features/tasks/data/server";
import { getStaffLead } from "@/features/leads/data/server";
import { taskReadRecovery } from "@/features/tasks/data/request";
import { TaskDetail } from "@/features/tasks/crm/task-detail";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RetryTasks } from "@/features/tasks/crm/retry-results";

export default async function TaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaffSession();
  const { id } = await params;
  let initial, lead;
  try {
    if (!z.uuid().safeParse(id).success) throw new Error("Invalid task");
    initial = await getStaffTask(id);
    lead = await getStaffLead(initial.task.lead.id);
  } catch (error) {
    const recovery = taskReadRecovery(error);
    if (recovery === "login") redirect("/login");
    return (
      <main id="main-content" className="min-w-0 flex-1 px-4 py-8 sm:px-8">
        <Alert variant="destructive">
          <AlertDescription>
            {recovery === "inaccessible"
              ? "This task is no longer available to your account."
              : "This task could not be loaded."}{" "}
            <Link href="/crm/tasks" className="underline">
              Back to tasks
            </Link>
            {recovery === "retry" && <RetryTasks />}
          </AlertDescription>
        </Alert>
      </main>
    );
  }
  return <TaskDetail key={id} initial={initial} initialLead={lead} />;
}
