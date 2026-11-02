import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { PropertyInquiryCard } from "@/features/leads/public/property-inquiry-card";
import { getPublicProperty } from "@/lib/api/server";
import { PropertyApiError } from "@/features/properties/data/request";
import {
  formatArea,
  formatBedrooms,
  formatPrice,
  parsePublicFilters,
  serializePropertyFilters,
} from "@/features/properties/data/filters";
import { PropertyGallery } from "@/features/properties/public/property-gallery";
import { PropertyDetails } from "@/features/properties/public/property-details";
import { PropertyRetry } from "@/features/properties/public/property-retry";
import { propertyIdSchema } from "@/features/properties/data/action-input";

export const metadata: Metadata = {
  title: "Property details",
  description: "Take a closer look at a home with Avenor Properties.",
};

export default async function PropertyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;

  if (!propertyIdSchema.safeParse(id).success) notFound();

  const { from } = await searchParams;
  let resultsQuery = "";

  if (typeof from === "string" && from.length <= 2000) {
    try {
      resultsQuery = serializePropertyFilters(
        parsePublicFilters(new URLSearchParams(from)),
      ).toString();
    } catch {
      /* A tampered return query must never become a navigation target. */
    }
  }

  const back = `/properties${resultsQuery ? `?${resultsQuery}` : "?purpose=sale"}`;
  let property;

  try {
    property = await getPublicProperty(id);
  } catch (error) {
    if (error instanceof PropertyApiError && error.status === 404) notFound();

    return (
      <main id="main-content" className="public-container py-16">
        <h1 className="display-heading text-4xl">
          This property couldn’t be loaded
        </h1>
        <Alert className="mt-6 max-w-2xl">
          <AlertDescription>
            The property service is temporarily unavailable. <PropertyRetry />{" "}
            in a moment.
          </AlertDescription>
        </Alert>
        <Link
          href={back}
          className="mt-6 inline-flex min-h-11 items-center text-sm font-medium text-primary underline underline-offset-4"
        >
          Back to listings
        </Link>
      </main>
    );
  }

  return (
    <main id="main-content" className="public-container property-detail">
      <Link href={back} className="property-detail-back">
        <span aria-hidden="true">←</span>
        {resultsQuery ? "Back to results" : "Back to listings"}
      </Link>
      <PropertyGallery
        photos={property.photos}
        title={property.title}
        purpose={property.purpose}
      />
      <header className="property-detail-heading">
        <div className="property-detail-labels">
          <span className="capitalize text-muted-foreground">
            {property.type}
          </span>
          {property.isDemo && <Badge variant="outline">Demo property</Badge>}
        </div>
        <h1 className="display-heading property-detail-title">
          {property.title}
        </h1>
      </header>
      <div className="property-detail-layout">
        <article className="min-w-0">
          <p className="property-detail-location">
            <Icon name="location" />
            <span>
              {property.community}, {property.city}
            </span>
          </p>
          <p className="property-detail-price">
            {formatPrice(property.priceFils, property.purpose)}
          </p>
          <dl className="property-detail-facts">
            <div>
              <dt>
                <Icon name="bed" />
                <span className="sr-only">Bedrooms</span>
              </dt>
              <dd>{formatBedrooms(property.bedrooms)}</dd>
            </div>
            <div>
              <dt>
                <Icon name="bath" />
                <span className="sr-only">Bathrooms</span>
              </dt>
              <dd>
                {property.bathrooms}{" "}
                {property.bathrooms === 1 ? "bath" : "baths"}
              </dd>
            </div>
            <div>
              <dt>
                <Icon name="area" />
                <span className="sr-only">Property size</span>
              </dt>
              <dd>{formatArea(property.areaSqft)}</dd>
            </div>
          </dl>
          {property.isDemo && (
            <Alert className="property-detail-demo">
              <AlertDescription>
                This is a demo property, not a real listing. Its photographs are
                AI-generated illustrative imagery, and the details and price are
                sample data.
              </AlertDescription>
            </Alert>
          )}
          <section
            className="property-detail-about"
            aria-labelledby="about-heading"
          >
            <h2 id="about-heading" className="display-heading text-3xl">
              About this home
            </h2>
            <p className="property-detail-description">
              {property.description}
            </p>
          </section>
          <PropertyDetails property={property} />
        </article>
        <PropertyInquiryCard propertyId={property.id} />
      </div>
    </main>
  );
}
