import { PropertyCard } from "./property-card";
import type { PublicPropertySummary } from "../data/types";

export function PropertyGrid({
  properties,
  resultsQuery,
  home = false,
}: {
  properties: readonly PublicPropertySummary[];
  resultsQuery?: string;
  home?: boolean;
}) {
  return (
    <div
      className={
        home ? "home-property-grid" : "grid gap-6 md:grid-cols-2 xl:grid-cols-3"
      }
    >
      {properties.map((property) => (
        <PropertyCard
          key={property.id}
          property={property}
          resultsQuery={resultsQuery}
          home={home}
        />
      ))}
    </div>
  );
}
