import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button-variants";
import { requireStaffSession } from "@/lib/auth/server";
import { dubaiDate, validDate } from "@/features/viewings/data/calendar";
import { ViewingToolbar } from "@/features/viewings/crm/calendar";
import {
  ViewingLoading,
  ViewingResults,
} from "@/features/viewings/crm/results";
export default async function ViewingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireStaffSession();
  const query = await searchParams;
  const date =
    typeof query.date === "string" && validDate(query.date)
      ? query.date
      : dubaiDate();
  const status =
    typeof query.status === "string" &&
    ["scheduled", "completed", "cancelled"].includes(query.status)
      ? query.status
      : "";
  return (
    <main id="main-content" className="min-w-0 flex-1 px-4 py-8 sm:px-8">
      <PageHeader
        title="Viewings"
        description="Arrange visits, keep track of appointments and capture the conversation afterwards."
        actions={
          <Link href="/crm/leads" className={buttonVariants()}>
            Choose a lead to schedule
          </Link>
        }
      />
      <ViewingToolbar
        key={`toolbar-${date}-${status}`}
        date={date}
        status={status}
      />
      <Suspense key={`results-${date}-${status}`} fallback={<ViewingLoading />}>
        <ViewingResults date={date} status={status} />
      </Suspense>
    </main>
  );
}
