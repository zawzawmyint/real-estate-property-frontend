import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireStaffSession } from "@/lib/auth/server";
import { getStaffLead } from "@/features/leads/data/server";
import { taskReadRecovery } from "@/features/tasks/data/request";
import { TaskForm } from "@/features/tasks/crm/task-form";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default async function NewTaskPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const staff = await requireStaffSession();
  const { leadId } = await searchParams;
  let lead = null;
  if (leadId !== undefined) {
    try {
      if (!z.uuid().safeParse(leadId).success) throw new Error("Invalid lead");
      lead = await getStaffLead(leadId as string);
    } catch (error) {
      if (taskReadRecovery(error) === "login") redirect("/login");
      return (
        <main id="main-content" className="min-w-0 flex-1 px-4 py-8 sm:px-8">
          <Alert variant="destructive">
            <AlertDescription>
              This lead could not be loaded or is no longer available.{" "}
              <Link href="/crm/tasks" className="underline">
                Back to tasks
              </Link>
            </AlertDescription>
          </Alert>
        </main>
      );
    }
  }
  return <TaskForm initialLead={lead} manager={staff.role !== "agent"} />;
}
