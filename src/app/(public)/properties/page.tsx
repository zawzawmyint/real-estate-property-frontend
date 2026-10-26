import type { Metadata } from "next";
import Link from "next/link";
import { PublicSectionHeader } from "@/components/layout/public-section-header";
import { Suspense } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PropertyFilters } from "@/features/properties/public/property-filters";
import { PropertyCardsLoading } from "@/features/properties/shared/property-loading";
import { PropertyResults } from "@/features/properties/public/property-results";
import {
  parsePublicFilters,
  PropertyFilterError,
  searchParamsToURL,
  serializePropertyFilters,
} from "@/features/properties/data/filters";

export const metadata: Metadata = {
  title: "Find your next home",
  description:
    "Explore homes for sale and rent with Avenor Properties. Search by location, property type, budget and bedrooms.",
};

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  let query = "";
  let invalid = false;

  try {
    query = serializePropertyFilters(
      parsePublicFilters(searchParamsToURL(await searchParams)),
    ).toString();
  } catch (error) {
    if (error instanceof PropertyFilterError) invalid = true;
    else throw error;
  }

  return (
    <main id="main-content" className="public-container py-10 sm:py-14">
      <PublicSectionHeader
        level={1}
        title="Homes to make your own."
        eyebrow="Find your next chapter"
        description="Explore our collection of homes for sale and rent."
      />
      <PropertyFilters key={`filters-${query}`} query={query} />
      {invalid ? (
        <Alert className="mt-8">
          <AlertDescription>
            These search filters aren’t valid. Check the prices and filter
            values, or{" "}
            <Link
              href="/properties?purpose=sale"
              className="font-medium underline underline-offset-4"
            >
              clear all filters
            </Link>{" "}
            to start again.
          </AlertDescription>
        </Alert>
      ) : (
        <Suspense key={`results-${query}`} fallback={<PropertyCardsLoading />}>
          <PropertyResults query={query} />
        </Suspense>
      )}
    </main>
  );
}
