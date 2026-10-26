import { PageHeader } from "@/components/layout/page-header";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireStaffSession } from "@/lib/auth/server";
import { buttonVariants } from "@/components/ui/button-variants";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Icon } from "@/components/ui/icon";
import { parseLeadFilters, leadQuery } from "@/features/leads/data/filters";
import { LeadFilters } from "@/features/leads/crm/lead-filters";
import { LeadResults } from "@/features/leads/crm/lead-results";
import { LeadLoading } from "@/features/leads/crm/lead-loading";
export const metadata: Metadata = {
  title: "Leads · Agency workspace",
  robots: { index: false, follow: false },
};
export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const staff = await requireStaffSession();
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams))
    if (typeof value === "string") query.set(key, value);
  let filters;
  try {
    filters = parseLeadFilters(query, staff.role);
  } catch {
    return (
      <main id="main-content" className="min-w-0 flex-1 p-6 sm:p-8">
        <h1 className="mb-6 text-3xl font-semibold">Leads</h1>
        <Alert variant="destructive">
          <AlertDescription>
            These lead filters are invalid.{" "}
            <Link href="/crm/leads" className="underline">
              Clear filters and try again
            </Link>
          </AlertDescription>
        </Alert>
      </main>
    );
  }
  const manager = staff.role !== "agent";
  return (
    <main id="main-content" className="min-w-0 flex-1 px-4 py-8 sm:px-8">
      <PageHeader
        title="Leads"
        description={
          manager
            ? "Turn every inquiry into a thoughtful next step."
            : "Your conversations, follow-ups and property enquiries."
        }
        actions={
          <Link href="/crm/leads/new" className={`${buttonVariants()} gap-2`}>
            <Icon name="plus" />
            New lead
          </Link>
        }
      />
      <div className="space-y-6">
        <LeadFilters filters={filters} manager={manager} />
        <Suspense key={leadQuery(filters)} fallback={<LeadLoading />}>
          <LeadResults filters={filters} manager={manager} />
        </Suspense>
      </div>
    </main>
  );
}
