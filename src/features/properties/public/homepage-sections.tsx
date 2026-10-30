import Link from "next/link";
import { PublicSectionHeader } from "@/components/layout/public-section-header";
import { PublicSearchPanel } from "@/components/layout/public-search-panel";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { NavigationPending } from "@/components/ui/navigation-pending";
import { Skeleton } from "@/components/ui/skeleton";
import { PropertyFilters } from "./property-filters";
import { PropertyGrid } from "./property-grid";
import { PropertyRetry } from "./property-retry";
import type { getPublicProperties } from "@/lib/api/server";

function BrowseLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="home-text-link">
      {children}
      <span aria-hidden="true">→</span>
      <NavigationPending />
    </Link>
  );
}

// These photographs illustrate the agency's locations, rather than listing inventory.
function EditorialPhoto({
  name,
  priority = false,
}: {
  name: string;
  priority?: boolean;
}) {
  const dimensions =
    name === "hero"
      ? { width: 1600, height: 914 }
      : name === "guidance"
        ? { width: 1000, height: 667 }
        : { width: 800, height: 533 };

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/images/homepage/${name}.webp`}
      alt=""
      width={dimensions.width}
      height={dimensions.height}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
    />
  );
}

export function HomeHero() {
  return (
    <section aria-labelledby="home-heading" className="home-hero-section">
      <div className="home-hero">
        <div className="public-container home-hero-copy">
          <h1 id="home-heading" className="display-heading">
            Find your <br />
            place in Dubai.
          </h1>
          <p>
            Extraordinary homes. A more considered
            <br className="hidden sm:block" /> way to move forward.
          </p>
        </div>
        <EditorialPhoto name="hero" priority />
      </div>
      <div className="public-container home-search-wrap">
        <PublicSearchPanel treatment="hero" className="home-search-dock">
          <PropertyFilters home />
        </PublicSearchPanel>
      </div>
    </section>
  );
}

function HomeFeaturedHeader() {
  return (
    <PublicSectionHeader
      level={2}
      id="featured-heading"
      eyebrow="Curated for you"
      title="Homes worth discovering."
      actions={
        <div className="home-featured-intro">
          <p>
            A handpicked selection of exceptional properties across Dubai, from
            waterfront apartments to spacious family homes.
          </p>
          <BrowseLink href="/properties?purpose=sale">
            View all properties
          </BrowseLink>
        </div>
      }
    />
  );
}

export function HomeFeaturedLoading() {
  return (
    <section
      aria-labelledby="featured-heading"
      className="home-featured home-section"
    >
      <HomeFeaturedHeader />
      <div role="status" aria-label="Loading properties">
        <span className="sr-only">Loading properties…</span>
        <div className="home-property-grid" aria-hidden="true">
          {[0, 1, 2].map((index) => (
            <div key={index} className="home-property-card">
              <Skeleton className="home-property-photo" />
              <div className="home-property-placeholder">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="mt-3 h-4 w-1/2" />
                <Skeleton className="mt-3 h-4 w-2/3" />
              </div>
            </div>
          ))}
        </div>
        <Skeleton aria-hidden="true" className="mt-5 h-5 w-full max-w-2xl" />
      </div>
    </section>
  );
}

export async function HomeFeatured({
  featured,
}: {
  featured: Promise<Awaited<ReturnType<typeof getPublicProperties>> | null>;
}) {
  const collection = await featured;
  return (
    <section
      aria-labelledby="featured-heading"
      className="home-featured home-section"
    >
      <HomeFeaturedHeader />
      {collection === null ? (
        <Alert>
          <AlertDescription>
            We couldn’t load featured homes. You can still search our
            collection, or <PropertyRetry /> in a moment.
          </AlertDescription>
        </Alert>
      ) : collection.items.length === 0 ? (
        <div className="home-featured-empty">
          <h3 className="display-heading">No featured homes right now.</h3>
          <p>Explore the full collection to find your next home.</p>
          <BrowseLink href="/properties?purpose=sale">
            Browse properties
          </BrowseLink>
        </div>
      ) : (
        <>
          <PropertyGrid properties={collection.items} home />
          {collection.items.some((property) => property.isDemo) && (
            <p className="home-demo-note">
              Our sample collection includes demo properties with AI-generated
              illustrative imagery. These homes are not real listings.
            </p>
          )}
        </>
      )}
    </section>
  );
}

const homeTypes = [
  ["apartment", "Apartments", "Stylish city living in iconic locations."],
  ["villa", "Villas", "Expansive homes for modern family life."],
  ["townhouse", "Townhouses", "A balance of space, comfort and community."],
  ["penthouse", "Penthouses", "Elevated living with extraordinary views."],
] as const;
const communities = [
  ["dubai-marina", "Dubai Marina", "Apartments by the water"],
  ["downtown-dubai", "Downtown Dubai", "Iconic city living"],
  ["palm-jumeirah", "Palm Jumeirah", "Exclusive island living"],
] as const;

export function HomeDiscovery() {
  return (
    <>
      <section
        aria-labelledby="home-types-heading"
        className="home-types home-section"
      >
        <h2 id="home-types-heading" className="home-eyebrow">
          A home for every way of living
        </h2>
        <div className="home-types-grid">
          {homeTypes.map(([type, title, description]) => (
            <Link
              key={type}
              href={`/properties?purpose=sale&type=${type}`}
              aria-label={`Browse ${title.toLowerCase()} for sale`}
            >
              <h3 className="display-heading">{title}</h3>
              <p>{description}</p>
              <span aria-hidden="true">→</span>
              <NavigationPending />
            </Link>
          ))}
        </div>
        <p className="home-sale-note">Discover homes for sale across Dubai.</p>
      </section>
      <section
        aria-labelledby="communities-heading"
        className="home-communities home-section"
      >
        <PublicSectionHeader
          level={2}
          id="communities-heading"
          eyebrow="Explore areas"
          title="Explore Dubai, neighbourhood by neighbourhood."
          actions={
            <BrowseLink href="/properties?purpose=sale">
              Browse homes for sale
            </BrowseLink>
          }
        />
        <div className="home-community-grid">
          {communities.map(([image, name, description]) => (
            <Link
              key={image}
              href={`/properties?purpose=sale&location=${encodeURIComponent(name)}`}
              aria-label={`Explore homes for sale in ${name}`}
              className="home-community"
            >
              <EditorialPhoto name={image} />
              <div>
                <h3>{name}</h3>
                <p>{description}</p>
              </div>
              <span aria-hidden="true" className="home-community-arrow">
                →
              </span>
              <NavigationPending />
            </Link>
          ))}
        </div>
      </section>
      <section
        aria-labelledby="guidance-heading"
        className="home-guidance home-section"
      >
        <div>
          <p className="home-eyebrow">Our agents</p>
          <div className="home-guidance-photo">
            <EditorialPhoto name="guidance" />
          </div>
        </div>
        <div className="home-guidance-copy">
          <PublicSectionHeader
            level={2}
            id="guidance-heading"
            title="Good homes. Better guidance."
            description="Explore our property collection and meet the people who can help with your search."
          />
          <p>
            Clear advice and a personal approach, helping you find the right
            home in the right neighbourhood.
          </p>
          <div className="home-guidance-actions">
            <BrowseLink href="/agents">Meet our agents</BrowseLink>
            <BrowseLink href="/contact">Contact us</BrowseLink>
          </div>
        </div>
      </section>
    </>
  );
}
