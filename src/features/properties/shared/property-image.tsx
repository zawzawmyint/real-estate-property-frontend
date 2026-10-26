"use client";

import { useCallback, useState } from "react";
import { type PropertyPhoto } from "../data/types";
import { cn } from "@/lib/utils";
import { PropertyImagePlaceholder } from "./property-image-placeholder";

type PropertyImageProps = {
  photo: PropertyPhoto;
  alt: string;
  className?: string;
  priority?: boolean;
  fit?: "cover" | "contain";
};

export function PropertyImage(props: PropertyImageProps) {
  // A new URL owns a new image lifecycle, including when returning to a URL
  // which previously failed. Old image events cannot settle its replacement.
  return <PropertyImageContent key={props.photo.url} {...props} />;
}

function PropertyImageContent({
  photo,
  alt,
  className,
  priority = false,
  fit = "cover",
}: PropertyImageProps) {
  const [status, setStatus] = useState<"loading" | "loaded" | "unavailable">(
    "loading",
  );
  const imageRef = useCallback((image: HTMLImageElement | null) => {
    // Cached images can finish before React attaches the load/error handlers.
    if (image?.complete) {
      setStatus(image.naturalWidth > 0 ? "loaded" : "unavailable");
    }
  }, []);

  return (
    <div
      data-slot="property-image"
      className={cn("relative overflow-hidden bg-muted", className)}
    >
      {status === "unavailable" ? (
        <div
          role={alt ? "img" : undefined}
          aria-label={alt ? `${alt}. Photo unavailable` : undefined}
          aria-hidden={alt ? undefined : true}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-2 text-center text-muted-foreground"
        >
          <PropertyImagePlaceholder unavailable showLabel={Boolean(alt)} />
        </div>
      ) : (
        // Public photos are backend-normalized WebP, at most 2400px. Native images
        // keep the configured public media URL working without a second proxy.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={imageRef}
          src={photo.url}
          alt={alt}
          width={photo.width}
          height={photo.height}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus("unavailable")}
          className={cn(
            "h-full w-full",
            fit === "cover" ? "object-cover" : "object-contain",
            status === "loading" && "opacity-0",
          )}
        />
      )}
      {status === "loading" && (
        <PropertyImagePlaceholder className="absolute inset-0" />
      )}
    </div>
  );
}
