import { PropertyCard } from "./property-card";
import type { PublicPropertySummary } from "../data/types";

export function PropertyGrid({
  properties,
  resultsQuery,
}: {
  properties: readonly PublicPropertySummary[];
  resultsQuery?: string;
}) {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {properties.map((property) => (
        <PropertyCard
          key={property.id}
          property={property}
          resultsQuery={resultsQuery}
        />
      ))}
    </div>
  );
}
