import Link from "next/link";
import { Suspense } from "react";
import { requireStaffSession } from "@/lib/auth/server";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button-variants";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { parseTaskFilters } from "@/features/tasks/data/filters";
import { TaskToolbar } from "@/features/tasks/crm/task-toolbar";
import { TaskResults, TaskLoading } from "@/features/tasks/crm/results";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireStaffSession();
  const filters = parseTaskFilters(await searchParams);
  const key = `${filters.status}-${filters.due}-${filters.page}`;
  return (
    <main id="main-content" className="min-w-0 flex-1 px-4 py-8 sm:px-8">
      <PageHeader
        title="Tasks"
        description="Keep the next step in sight. Follow-ups are ordered by due time, earliest first."
        actions={
          <Link href="/crm/tasks/new" className={buttonVariants()}>
            New task
          </Link>
        }
      />
      {filters.valid ? (
        <>
          <TaskToolbar key={`toolbar-${key}`} filters={filters} />
          <Suspense key={key} fallback={<TaskLoading />}>
            <TaskResults filters={filters} />
          </Suspense>
        </>
      ) : (
        <Alert variant="destructive">
          <AlertDescription>
            These task filters are invalid. Overdue is available for open tasks
            only.{" "}
            <Link href="/crm/tasks" className="underline">
              Reset filters
            </Link>
          </AlertDescription>
        </Alert>
      )}
    </main>
  );
}
