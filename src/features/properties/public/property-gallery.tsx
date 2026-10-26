"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { type PropertyPhoto } from "../data/types";
import { PropertyImage } from "../shared/property-image";
import { cn } from "@/lib/utils";

export function PropertyGallery({
  photos,
  title,
}: {
  photos: PropertyPhoto[];
  title: string;
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
      <section aria-label="Property photos" className="relative">
        <div
          className={cn(
            "grid gap-2 overflow-hidden rounded-xl",
            photos.length > 1 && "md:grid-cols-2",
          )}
        >
          <DialogTrigger
            render={
              <Button
                variant="ghost"
                className="block h-full overflow-hidden rounded-none p-0"
              />
            }
            onClick={() => setIndex(0)}
            aria-label="Open cover photo"
          >
            <PropertyImage
              photo={cover}
              alt={`${title} — photo 1`}
              priority
              className="aspect-[4/3] h-full max-h-[520px] w-full"
            />
          </DialogTrigger>
          {photos.length > 1 && (
            <div
              className={cn(
                "hidden gap-2 md:grid",
                photos.length > 3 ? "grid-cols-2" : "grid-cols-1",
              )}
            >
              {photos.slice(1, 5).map((photo, offset) => (
                <DialogTrigger
                  key={photo.id}
                  render={
                    <Button
                      variant="ghost"
                      className="block h-full overflow-hidden rounded-none p-0"
                    />
                  }
                  onClick={() => setIndex(offset + 1)}
                  aria-label={`Open photo ${offset + 2}`}
                >
                  <PropertyImage
                    photo={photo}
                    alt={`${title} — photo ${offset + 2}`}
                    className="h-full min-h-0 aspect-[4/3]"
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
              className="absolute end-3 bottom-3 bg-card shadow-sm sm:end-5 sm:bottom-5"
            />
          }
          onClick={() => setIndex(0)}
        >
          View all {photos.length} {photos.length === 1 ? "photo" : "photos"}
        </DialogTrigger>
      </section>
      <DialogContent
        className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-5xl gap-4 overflow-y-auto p-4 sm:max-w-5xl sm:p-6"
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
