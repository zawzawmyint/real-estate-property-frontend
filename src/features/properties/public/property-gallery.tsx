"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { type PropertyPhoto, type PublicPropertyDetail } from "../data/types";
import { PropertyImage } from "../shared/property-image";

export function PropertyGallery({
  photos,
  title,
  purpose,
}: {
  photos: PropertyPhoto[];
  title: string;
  purpose: PublicPropertyDetail["purpose"];
}) {
  const [index, setIndex] = useState(0);

  const move = (direction: number) =>
    setIndex(
      (current) => (current + direction + photos.length) % photos.length,
    );

  const cover = photos[0];

  if (!cover) return null;

  const selected = photos[index] ?? cover;

  return (
    <Dialog>
      <section aria-label="Property photos" className="property-gallery">
        <Badge className="property-gallery-purpose">
          {purpose === "rent" ? "For rent" : "For sale"}
        </Badge>
        <div
          className={`property-gallery-mosaic${photos.length > 1 ? " property-gallery-mosaic--multiple" : ""}`}
        >
          <DialogTrigger
            render={
              <Button
                variant="ghost"
                className="property-gallery-tile property-gallery-cover"
              />
            }
            onClick={() => setIndex(0)}
            aria-label="Open cover photo"
          >
            <PropertyImage
              photo={cover}
              alt={`${title} — photo 1`}
              priority
              className="property-gallery-image"
            />
          </DialogTrigger>
          {photos.length > 1 && (
            <div
              className={`property-gallery-support property-gallery-support--${Math.min(photos.length - 1, 4)}`}
            >
              {photos.slice(1, 5).map((photo, offset) => (
                <DialogTrigger
                  key={photo.id}
                  render={
                    <Button variant="ghost" className="property-gallery-tile" />
                  }
                  onClick={() => setIndex(offset + 1)}
                  aria-label={`Open photo ${offset + 2}`}
                >
                  <PropertyImage
                    photo={photo}
                    alt={`${title} — photo ${offset + 2}`}
                    className="property-gallery-image"
                  />
                </DialogTrigger>
              ))}
            </div>
          )}
        </div>
        <DialogTrigger
          render={
            <Button
              variant="outline"
              tone="inverse"
              className="property-gallery-view-all"
            />
          }
          onClick={() => setIndex(0)}
        >
          <Icon name="camera" />
          View all {photos.length} {photos.length === 1 ? "photo" : "photos"}
        </DialogTrigger>
      </section>
      <DialogContent
        className="property-gallery-dialog max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-5xl gap-4 overflow-y-auto p-4 sm:max-w-5xl sm:p-6"
        onKeyDown={(event) => {
          if (photos.length < 2) return;
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            move(event.key === "ArrowLeft" ? -1 : 1);
          }
        }}
      >
        <DialogTitle className="truncate pe-12 text-lg">{title}</DialogTitle>
        <DialogDescription>
          Browse the property photos. Use the left and right arrow keys to move
          between photos.
        </DialogDescription>
        <PropertyImage
          key={selected.id}
          photo={selected}
          alt={`${title} — photo ${index + 1} of ${photos.length}`}
          priority
          fit="contain"
          className="h-[min(60dvh,640px)] rounded-lg"
        />
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            aria-label="Previous photo"
            onClick={() => move(-1)}
            disabled={photos.length < 2}
          >
            <span aria-hidden="true">←</span>
            <span className="hidden sm:inline">Previous</span>
          </Button>
          <p
            aria-live="polite"
            aria-atomic="true"
            className="text-sm tabular-nums text-muted-foreground"
          >
            {index + 1} / {photos.length}
          </p>
          <Button
            variant="outline"
            aria-label="Next photo"
            onClick={() => move(1)}
            disabled={photos.length < 2}
          >
            <span className="hidden sm:inline">Next</span>
            <span aria-hidden="true">→</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
