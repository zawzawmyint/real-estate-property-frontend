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
} from "@/features/properties/data/filters";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button-variants";
import { Icon } from "@/components/ui/icon";

export const metadata: Metadata = {
  title: "Properties · Agency workspace",
  robots: { index: false, follow: false },
};

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const staff = await requireStaffSession();
  let filters;

  try {
    filters = parsePropertyFilters(searchParamsToURL(await searchParams), true);
  } catch {
    return (
      <main id="main-content" className="min-w-0 flex-1 px-4 py-10 sm:px-8">
        <h1 className="mb-6 text-3xl font-semibold">Properties</h1>
        <Alert variant="destructive">
          <AlertDescription>
            These inventory filters are invalid.{" "}
            <Link href="/crm/properties" className="underline">
              Clear filters and try again.
            </Link>
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  return (
    <main id="main-content" className="min-w-0 flex-1 px-4 py-10 sm:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Properties</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage your agency’s property inventory.
          </p>
        </div>
        {staff.role !== "agent" && (
          <Link
            href="/crm/properties/new"
            className={`${buttonVariants()} gap-2`}
            aria-label="Add property"
            title="Add property"
          >
            <Icon name="plus" />
            Add property
          </Link>
        )}
      </div>
      <div className="space-y-6">
        <PropertyInventoryFilters filters={filters} />
        <Suspense
          key={serializePropertyFilters(filters).toString()}
          fallback={<PropertyInventoryLoading />}
        >
          <PropertyInventoryResults
            filters={filters}
            canEdit={staff.role !== "agent"}
          />
        </Suspense>
      </div>
    </main>
  );
}
