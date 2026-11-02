"use client";

import Image from "next/image";
import { useCallback, useState } from "react";

export function ContactIllustration() {
  const [failed, setFailed] = useState(false);
  const imageRef = useCallback((image: HTMLImageElement | null) => {
    if (image?.complete && image.naturalWidth === 0) setFailed(true);
  }, []);

  return (
    <figure>
      <div className="agency-contact-illustration">
        {failed ? (
          <div
            role="img"
            aria-label="Illustrative home image unavailable"
            className="flex h-full items-center justify-center bg-white/10 p-6 text-sm text-white/80"
          >
            Home illustration unavailable
          </div>
        ) : (
          <Image
            ref={imageRef}
            src="/images/agency/contact-interior.webp"
            alt="Illustrative Dubai residence with a sunlit terrace and skyline view"
            width={1200}
            height={900}
            loading="eager"
            sizes="(min-width: 1280px) 420px, (min-width: 1024px) 35vw, (min-width: 640px) 560px, 100vw"
            className="h-full w-full object-cover"
            onError={() => setFailed(true)}
          />
        )}
      </div>
      <figcaption className="mt-2 text-xs italic text-white/80">
        Illustrative home
      </figcaption>
    </figure>
  );
}
