import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type PublicPropertySummary } from "../data/types";
import { formatArea, formatBedrooms, formatPrice } from "../data/filters";
import { PropertyImage } from "../shared/property-image";
import { NavigationPending } from "@/components/ui/navigation-pending";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export function PropertyCard({
  property,
  resultsQuery,
  home = false,
}: {
  property: PublicPropertySummary;
  resultsQuery?: string;
  home?: boolean;
}) {
  const href = `/properties/${property.id}${resultsQuery ? `?from=${encodeURIComponent(resultsQuery)}` : ""}`;

  if (!home)
    return (
      <Card
        className="listing-property-card"
        data-testid="property-card"
        role="listitem"
      >
        <div className="listing-property-media">
          <PropertyImage
            photo={property.coverPhoto}
            alt={`${property.title} — cover photo`}
            className="listing-property-photo"
          />
          {property.isDemo && (
            <Badge className="absolute start-4 top-4 border-0 bg-card text-foreground shadow-sm">
              Demo property
            </Badge>
          )}
        </div>
        <CardContent className="listing-property-content">
          <p className="listing-property-price">
            {formatPrice(property.priceFils, property.purpose)}
          </p>
          <h2 className="listing-property-title">{property.title}</h2>
          <p className="listing-property-location">
            {property.community}, {property.city}
          </p>
          <p className="listing-property-category">
            {property.type.charAt(0).toUpperCase() + property.type.slice(1)}
            <span aria-hidden="true"> · </span>
            {property.purpose === "rent" ? "For rent · Per year" : "For sale"}
          </p>
          <ul className="listing-property-facts" aria-label="Property features">
            <li>{formatBedrooms(property.bedrooms)}</li>
            <li>
              {property.bathrooms} {property.bathrooms === 1 ? "bath" : "baths"}
            </li>
            <li>{formatArea(property.areaSqft)}</li>
          </ul>
          {property.isDemo && (
            <p className="listing-property-disclosure">
              Illustrative home · AI-generated imagery
            </p>
          )}
          <Link
            href={href}
            aria-label={`View property: ${property.title}`}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "listing-property-link",
            )}
          >
            View property <span aria-hidden="true">→</span>
            <NavigationPending />
          </Link>
        </CardContent>
      </Card>
    );

  return (
    <Card className="home-property-card" data-testid="property-card">
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
            className="home-property-photo"
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
          <h3 className="mt-2 line-clamp-2 text-base leading-6 font-medium break-words group-hover:text-primary">
            {property.title}
          </h3>
          <p className="mt-3 line-clamp-2 text-sm leading-6 break-words text-muted-foreground">
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
