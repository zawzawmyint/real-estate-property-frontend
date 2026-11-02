import { buttonVariants } from "@/components/ui/button-variants";
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
  const purpose = new URLSearchParams(query).get("purpose");

  return (
    <main id="main-content" className="property-listings">
      <section className="listings-intro" aria-labelledby="listings-heading">
        <div className="listings-architecture" aria-hidden="true" />
        <div className="public-container">
          <nav aria-label="Breadcrumb" className="listings-breadcrumb">
            <ol>
              <li>
                <Link href="/">Home</Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page">Properties</li>
            </ol>
          </nav>
          <PublicSectionHeader
            level={1}
            id="listings-heading"
            className="listings-heading"
            title={
              purpose === "rent" ? "Properties for rent" : "Properties for sale"
            }
            description="Find a place for your next chapter. Explore homes across our collection."
          />
        </div>
      </section>
      <div className="public-container listings-search-results">
        <PropertyFilters key={`filters-${query}`} query={query} />
        {invalid ? (
          <Alert className="mt-8">
            <AlertDescription>
              These search filters aren’t valid. Check the prices and filter
              values, or{" "}
              <Link
                href="/properties?purpose=sale"
                className={buttonVariants({ variant: "outline" })}
              >
                clear all filters
              </Link>{" "}
              to start again.
            </AlertDescription>
          </Alert>
        ) : (
          <Suspense
            key={`results-${query}`}
            fallback={<PropertyCardsLoading />}
          >
            <PropertyResults query={query} />
          </Suspense>
        )}
      </div>
    </main>
  );
}
