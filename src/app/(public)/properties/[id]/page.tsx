import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
    <main id="main-content" className="public-container py-7 sm:py-10">
      <Link
        href={back}
        className="mb-5 inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-primary"
      >
        <span aria-hidden="true">←</span>
        {resultsQuery ? "Back to results" : "Back to listings"}
      </Link>
      <PropertyGallery photos={property.photos} title={property.title} />
      <div className="mt-9 grid items-start gap-10 lg:mt-12 lg:grid-cols-[1fr_340px] lg:gap-16">
        <article className="min-w-0">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Badge variant="outline">
              {property.purpose === "rent" ? "For rent" : "For sale"}
            </Badge>
            <span className="capitalize text-muted-foreground">
              {property.type}
            </span>
            {property.isDemo && <Badge variant="outline">Demo property</Badge>}
          </div>
          <h1 className="display-heading mt-5 text-4xl leading-tight break-words sm:text-5xl">
            {property.title}
          </h1>
          {property.isDemo && (
            <Alert className="mt-5">
              <AlertDescription>
                This is a demo property, not a real listing. Its photographs are
                AI-generated illustrative imagery, and the details and price are
                sample data.
              </AlertDescription>
            </Alert>
          )}
          <p className="mt-4 leading-7 break-words text-muted-foreground">
            {property.community}, {property.city}
          </p>
          <p className="mt-6 text-3xl font-semibold tracking-tight">
            {formatPrice(property.priceFils, property.purpose)}
          </p>
          <dl className="mt-7 flex flex-wrap gap-x-10 gap-y-6 border-y border-border py-6">
            <div>
              <dt className="text-xs text-muted-foreground">Bedrooms</dt>
              <dd className="mt-2 font-medium">
                {formatBedrooms(property.bedrooms)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Bathrooms</dt>
              <dd className="mt-2 font-medium">{property.bathrooms}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Property size</dt>
              <dd className="mt-2 font-medium">
                {formatArea(property.areaSqft)}
              </dd>
            </div>
          </dl>
          <section className="mt-9 mb-10" aria-labelledby="about-heading">
            <h2 id="about-heading" className="display-heading text-3xl">
              About this home
            </h2>
            <p className="mt-5 text-sm leading-8 break-words whitespace-pre-line text-muted-foreground">
              {property.description}
            </p>
          </section>
        </article>
        <PropertyInquiryCard
          propertyId={property.id}
          title={property.title}
          location={`${property.community}, ${property.city}`}
        />
      </div>
    </main>
  );
}
