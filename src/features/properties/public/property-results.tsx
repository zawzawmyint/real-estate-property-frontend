import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EmptyState } from "@/components/layout/empty-state";
import { getPublicProperties } from "@/lib/api/server";
import { PropertyCard } from "./property-card";
import { PropertySort } from "./property-filters";
import { PropertyPagination } from "./property-pagination";
import { PropertyRetry } from "./property-retry";
import { parsePublicFilters, serializePropertyFilters } from "../data/filters";

export async function PropertyResults({ query }: { query: string }) {
  const filters = parsePublicFilters(new URLSearchParams(query));
  const firstPage = `/properties?${serializePropertyFilters({ ...filters, page: 1 })}`;
  let result;

  try {
    result = await getPublicProperties(query);
  } catch {
    return (
      <Alert className="mt-8">
        <AlertDescription>
          We couldn’t load the property collection. Please try again in a
          moment. <PropertyRetry />
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <div className="mt-9 mb-6 flex flex-wrap items-center justify-between gap-4">
        <p role="status" className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">
            {result.total.toLocaleString("en-AE")}
          </span>{" "}
          {result.total === 1 ? "property" : "properties"}{" "}
          {filters.purpose === "rent" ? "for rent" : "for sale"}
        </p>
        <PropertySort query={query} />
      </div>
      {result.items.length ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {result.items.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              resultsQuery={query}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title={result.total ? "No properties on this page" : "No homes found"}
        >
          <p>
            {result.total
              ? "Explore the first page to see the available homes."
              : "Try a different location or a wider budget to explore more of our collection."}
          </p>
          <Link
            href={result.total ? firstPage : "/properties?purpose=sale"}
            className="mt-5 inline-flex min-h-11 items-center font-medium text-primary underline underline-offset-4"
          >
            {result.total ? "Go to the first page" : "Clear all filters"}
          </Link>
        </EmptyState>
      )}
      {result.items.some((property) => property.isDemo) && (
        <p className="mt-6 text-xs leading-6 text-muted-foreground">
          Demo properties use sample details and AI-generated illustrative
          imagery. They are not real listings.
        </p>
      )}
      <PropertyPagination
        query={query}
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
      />
    </>
  );
}
