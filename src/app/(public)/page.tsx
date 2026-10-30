import { Suspense } from "react";
import {
  HomeHero,
  HomeFeatured,
  HomeDiscovery,
  HomeFeaturedLoading,
} from "@/features/properties/public/homepage-sections";
import { getPublicProperties } from "@/lib/api/server";

async function loadFeaturedProperties() {
  try {
    return await getPublicProperties("featured=true&pageSize=3&sort=newest");
  } catch {
    return null;
  }
}

export default function HomePage() {
  const featured = loadFeaturedProperties();

  return (
    <main id="main-content" className="homepage">
      <HomeHero />
      <div className="public-container">
        <Suspense fallback={<HomeFeaturedLoading />}>
          <HomeFeatured featured={featured} />
        </Suspense>
        <HomeDiscovery />
      </div>
    </main>
  );
}
