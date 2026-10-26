import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type PublicPropertySummary } from "../data/types";
import { formatArea, formatBedrooms, formatPrice } from "../data/filters";
import { PropertyImage } from "../shared/property-image";
import { NavigationPending } from "@/components/ui/navigation-pending";

export function PropertyCard({
  property,
  resultsQuery,
}: {
  property: PublicPropertySummary;
  resultsQuery?: string;
}) {
  const href = `/properties/${property.id}${resultsQuery ? `?from=${encodeURIComponent(resultsQuery)}` : ""}`;

  return (
    <Card
      className="gap-0 overflow-hidden rounded-xl py-0 shadow-none transition-shadow hover:shadow-md"
      data-testid="property-card"
    >
      <Link
        href={href}
        className="group block h-full"
        aria-label={`View ${property.title}`}
      >
        <NavigationPending />
        <div className="relative overflow-hidden">
          <PropertyImage
            photo={property.coverPhoto}
            alt={`${property.title} — cover photo`}
            className="aspect-[4/3] transition-transform duration-300 group-hover:scale-[1.025]"
          />
          <Badge className="absolute start-4 top-4 border-0 bg-card text-foreground shadow-sm">
            {property.purpose === "rent" ? "For rent" : "For sale"}
          </Badge>
          {property.isDemo && (
            <Badge className="absolute end-4 bottom-4 border-0 bg-card text-foreground shadow-sm">
              Demo property
            </Badge>
          )}
        </div>
        <CardContent className="px-5 py-5">
          <p className="text-xl font-semibold tracking-tight">
            {formatPrice(property.priceFils, property.purpose)}
          </p>
          <h3 className="mt-2 line-clamp-2 text-base leading-6 font-medium group-hover:text-primary">
            {property.title}
          </h3>
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">
            {property.community}, {property.city}
          </p>
          {property.isDemo && (
            <p className="mt-2 text-xs text-muted-foreground">
              Illustrative home · AI-generated imagery
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
            <span>{formatBedrooms(property.bedrooms)}</span>
            <span>
              {property.bathrooms} {property.bathrooms === 1 ? "bath" : "baths"}
            </span>
            <span>{formatArea(property.areaSqft)}</span>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
