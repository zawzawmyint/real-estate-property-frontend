import { PageHeader } from "@/components/layout/page-header";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireStaffSession } from "@/lib/auth/server";
import { PropertyInventoryFilters } from "@/features/properties/crm/property-inventory-filters";
import { PropertyInventoryResults } from "@/features/properties/crm/property-inventory-results";
import { PropertyInventoryLoading } from "@/features/properties/shared/property-loading";
import {
  parsePropertyFilters,
  searchParamsToURL,
  serializePropertyFilters,
  propertyExportQuery,
  type PropertyFilters,
} from "@/features/properties/data/filters";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button-variants";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { SessionServiceError } from "@/lib/auth/transport";
import { CsvExportButton } from "@/components/crm/csv-export-button";
import { cn } from "@/lib/utils";

async function CreatePropertyAction({
  filters,
  scope,
}: {
  filters: PropertyFilters;
  scope: string;
}) {
  let staff;
  try {
    staff = await requireStaffSession();
  } catch (error) {
    if (!(error instanceof SessionServiceError)) throw error;
    return null;
  }
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-3">
      <CsvExportButton
        entity="properties"
        query={propertyExportQuery(filters)}
        scope={scope}
      />
      {staff.role !== "agent" && (
        <>
          <Link
            href="/crm/properties/import"
            className={cn(buttonVariants({ variant: "outline" }), "px-3")}
          >
            Import CSV
          </Link>
          <Link
            href="/crm/properties/new"
            className={cn(buttonVariants(), "gap-2 px-3 sm:px-5")}
            aria-label="Add property"
            title="Add property"
          >
            <Icon name="plus" />
            Add property
          </Link>
        </>
      )}
    </div>
  );
}

export const metadata: Metadata = {
  title: "Properties · Agency workspace",
  robots: { index: false, follow: false },
};

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  let filters;
  const appliedQuery = searchParamsToURL(await searchParams);

  try {
    filters = parsePropertyFilters(appliedQuery, true);
  } catch {
    return (
      <main id="main-content" className="min-w-0 flex-1 px-4 py-10 sm:px-8">
        <h1 className="mb-6 text-3xl font-semibold">Properties</h1>
        <Alert variant="destructive">
          <AlertDescription>
            These inventory filters are invalid.{" "}
            <Link
              href="/crm/properties"
              className={buttonVariants({ variant: "outline" })}
            >
              Clear filters and try again.
            </Link>
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  return (
    <main id="main-content" className="min-w-0 flex-1 px-4 py-6 sm:px-8">
      <PageHeader
        variant="workspace"
        title="Properties"
        description="Manage your agency’s property inventory."
        actions={
          <Suspense
            fallback={
              <Skeleton
                className="h-11 w-36"
                aria-label="Checking property permissions"
              />
            }
          >
            <CreatePropertyAction
              filters={filters}
              scope={appliedQuery.toString()}
            />
          </Suspense>
        }
      />
      <div className="space-y-4">
        <PropertyInventoryFilters filters={filters} />
        <Suspense
          key={serializePropertyFilters(filters).toString()}
          fallback={<PropertyInventoryLoading />}
        >
          <PropertyInventoryResults filters={filters} />
        </Suspense>
      </div>
    </main>
  );
}
