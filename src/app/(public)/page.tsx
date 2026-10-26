import Link from "next/link";
import { Suspense } from "react";
import { BuildingLoader, LoadingState } from "@/components/ui/building-loader";
import { NavigationPending } from "@/components/ui/navigation-pending";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getPublicProperties } from "@/lib/api/server";
import { PropertyCard } from "@/features/properties/public/property-card";
import { PropertyFilters } from "@/features/properties/public/property-filters";
import { PropertyImage } from "@/features/properties/shared/property-image";
import { PropertyCardsLoading } from "@/features/properties/shared/property-loading";
import { PropertyRetry } from "@/features/properties/public/property-retry";

type FeaturedCollection = Awaited<
  ReturnType<typeof getPublicProperties>
> | null;
type FeaturedRequest = Promise<FeaturedCollection>;

async function loadFeaturedProperties(): FeaturedRequest {
  try {
    return await getPublicProperties("featured=true&pageSize=3&sort=newest");
  } catch {
    return null;
  }
}

export default function HomePage() {
  const featured = loadFeaturedProperties();

  return (
    <main id="main-content" className="public-container pb-16 sm:pb-24">
      <section aria-labelledby="home-heading" className="relative pt-6 sm:pt-8">
        <div className="grid items-center gap-8 lg:min-h-[520px] lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-0">
          <div className="relative z-10 py-8 lg:py-16 lg:pe-8">
            <p className="mb-6 text-xs font-semibold tracking-[0.2em] text-primary uppercase">
              Your next chapter starts here
            </p>
            <h1
              id="home-heading"
              className="display-heading max-w-xl text-5xl leading-[1.08] sm:text-6xl lg:text-[clamp(3.75rem,5.2vw,4.75rem)]"
            >
              A place for your next chapter.
            </h1>
            <p className="mt-6 max-w-sm text-base leading-8 text-muted-foreground">
              Discover thoughtfully selected homes, with space for everything
              that comes next.
            </p>
          </div>
          <Suspense
            fallback={
              <LoadingState
                label="Loading featured home…"
                className="aspect-[4/3] rounded-xl border border-border bg-muted/40 lg:h-[560px]"
              />
            }
          >
            <HomeHero featured={featured} />
          </Suspense>
        </div>
        <div className="relative z-20 mt-6 rounded-2xl border border-border bg-card p-5 shadow-[0_12px_40px_-20px_rgba(37,35,41,0.25)] sm:p-7 lg:mx-5 lg:-mt-10">
          <PropertyFilters home />
        </div>
      </section>
      <Suspense fallback={<PropertyCardsLoading />}>
        <HomeFeatured featured={featured} />
      </Suspense>
    </main>
  );
}

async function HomeHero({ featured }: { featured: FeaturedRequest }) {
  const collection = await featured;
  const hero = collection?.items[0];

  return hero ? (
    <PropertyImage
      photo={hero.coverPhoto}
      alt={`${hero.title} — featured home`}
      priority
      className="aspect-[4/3] w-full min-w-0 max-h-[560px] rounded-xl lg:h-[560px] lg:rounded-e-xl lg:rounded-s-lg"
    />
  ) : (
    <div className="hidden h-[460px] items-center justify-center rounded-xl border border-border bg-muted/40 px-10 text-center lg:flex">
      <div>
        <BuildingLoader
          animated={false}
          className="mx-auto size-20 text-primary/50"
        />
        <p className="display-heading mt-6 text-3xl text-muted-foreground">
          Room for a new beginning.
        </p>
      </div>
    </div>
  );
}

async function HomeFeatured({ featured }: { featured: FeaturedRequest }) {
  const collection = await featured;
  const unavailable = collection === null;

  return (
    <>
      {unavailable && (
        <Alert className="mt-12">
          <AlertDescription>
            We couldn’t load featured homes. You can still search our
            collection, or <PropertyRetry /> in a moment.
          </AlertDescription>
        </Alert>
      )}
      {!!collection?.items.length && (
        <section aria-labelledby="featured-heading" className="mt-16 sm:mt-24">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
            <div>
              <h2
                id="featured-heading"
                className="display-heading text-3xl leading-tight sm:text-4xl"
              >
                Homes worth a closer look
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                A selection from our property collection.
              </p>
            </div>
            <Link
              href="/properties?purpose=sale"
              className="inline-flex min-h-11 items-center gap-3 text-sm font-medium text-primary underline underline-offset-4"
            >
              View all properties <span aria-hidden="true">→</span>
              <NavigationPending />
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {collection.items.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
          {collection.items.some((property) => property.isDemo) && (
            <p className="mt-5 text-xs leading-6 text-muted-foreground">
              Our sample collection includes demo properties with AI-generated
              illustrative imagery. These homes are not real listings.
            </p>
          )}
        </section>
      )}
    </>
  );
}
