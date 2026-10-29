import Link from "next/link";
import { Suspense } from "react";
import { dubaiDate, validDate } from "@/features/viewings/data/calendar";
import { ViewingToolbar } from "@/features/viewings/crm/calendar";
import {
  ViewingLoading,
  ViewingResults,
} from "@/features/viewings/crm/results";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { requireStaffSession } from "@/lib/auth/server";
import { getStaffLead, getStaffActivity } from "@/features/leads/data/server";
import { LeadApiError } from "@/features/leads/data/request";
import { safeLeadReturn } from "@/features/leads/data/filters";
import { LeadDetail } from "@/features/leads/crm/lead-detail";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { parseTaskFilters, taskHref } from "@/features/tasks/data/filters";
import { TaskToolbar } from "@/features/tasks/crm/task-toolbar";
import { TaskLoading, TaskResults } from "@/features/tasks/crm/results";
export default async function LeadDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const staff = await requireStaffSession();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const query = await searchParams;
  const taskFilters = parseTaskFilters(query, true);
  const taskKey = `${id}-${taskFilters.status}-${taskFilters.due}-${taskFilters.page}`;
  const existingParams = new URLSearchParams();
  for (const [key, value] of Object.entries(query))
    if (typeof value === "string") existingParams.set(key, value);
  const date =
    typeof query.date === "string" && validDate(query.date)
      ? query.date
      : dubaiDate();
  const status =
    typeof query.status === "string" &&
    ["scheduled", "completed", "cancelled"].includes(query.status)
      ? query.status
      : "";
  let lead, activity;
  try {
    [lead, activity] = await Promise.all([
      getStaffLead(id),
      getStaffActivity(id),
    ]);
  } catch (error) {
    if (error instanceof LeadApiError && error.status === 401)
      redirect("/login");
    return (
      <main id="main-content" className="min-w-0 flex-1 px-4 py-10 sm:px-8">
        <Alert variant="destructive">
          <AlertDescription>
            {error instanceof LeadApiError && [403, 404].includes(error.status)
              ? "This lead is no longer available to your account"
              : "This lead could not be loaded."}{" "}
            <Link href="/crm/leads" className="underline">
              Back to leads
            </Link>
            {!(
              error instanceof LeadApiError && [403, 404].includes(error.status)
            ) && (
              <Link href={`/crm/leads/${id}`} className="ms-4 underline">
                Retry
              </Link>
            )}
          </AlertDescription>
        </Alert>
      </main>
    );
  }
  return (
    <LeadDetail
      key={id}
      initialLead={lead}
      initialActivity={activity}
      manager={staff.role !== "agent"}
      back={safeLeadReturn(query.from, staff.role)}
      saved={query.saved === "1"}
      tasks={
        taskFilters.valid ? (
          <>
            <TaskToolbar
              key={`toolbar-${taskKey}`}
              filters={taskFilters}
              leadMode
            />
            <Suspense key={taskKey} fallback={<TaskLoading />}>
              <TaskResults filters={taskFilters} leadId={id} />
            </Suspense>
          </>
        ) : (
          <Alert variant="destructive">
            <AlertDescription>
              These task filters are invalid.{" "}
              <Link
                href={taskHref(
                  `/crm/leads/${id}`,
                  { status: "open", due: "all", page: 1, valid: true },
                  1,
                  existingParams,
                  true,
                )}
                className="underline"
              >
                Reset task filters
              </Link>
            </AlertDescription>
          </Alert>
        )
      }
      viewings={
        <>
          <ViewingToolbar
            key={`${date}-${status}`}
            date={date}
            status={status}
            leadId={id}
          />
          <Suspense
            key={`${id}-${date}-${status}`}
            fallback={<ViewingLoading />}
          >
            <ViewingResults date={date} status={status} leadId={id} />
          </Suspense>
        </>
      }
    />
  );
}
