"use client";

import { useRef, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { getProperty } from "../data/queries";
import {
  removePropertyPhoto,
  reorderPropertyPhotos,
  uploadPropertyPhoto,
} from "../data/actions";
import { type StaffProperty, type PropertyActionResult } from "../data/types";
import {
  isValidPropertyPhoto,
  propertyPhotoMimeTypes,
} from "../data/photo-input";
import { PropertyImage } from "../shared/property-image";

export function PropertyPhotos({
  property,
  disabled,
  onChange,
  onBusyChange,
  validationError,
}: {
  property: StaffProperty;
  disabled: boolean;
  onChange: (property: StaffProperty) => void;
  onBusyChange: (busy: boolean) => void;
  validationError?: string;
}) {
  const guard = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState("");
  const [busy, setBusy] = useState(false);
  const [needsRefresh, setNeedsRefresh] = useState(false);

  const locked = disabled || busy || needsRefresh;

  async function action(
    operation: () => Promise<PropertyActionResult<StaffProperty>>,
    pendingLabel: string,
    success: string,
  ) {
    if (disabled || guard.current || needsRefresh) return;

    guard.current = true;
    setBusy(true);
    onBusyChange(true);
    setMessage("");
    setProgress(pendingLabel);

    try {
      const result = await operation();

      if (!result.ok) throw new Error(result.error.message);

      onChange(await getProperty(property.id));
      setProgress(success);
    } catch (error) {
      setProgress("Photo action stopped.");
      try {
        onChange(await getProperty(property.id));
      } catch {
        setNeedsRefresh(true);
      }

      setMessage(
        `${error instanceof Error ? error.message : "The photo action failed."} The saved photo list has been checked where possible. Review it before retrying.`,
      );
    } finally {
      guard.current = false;
      setBusy(false);
      onBusyChange(false);
    }
  }

  async function refreshSavedPhotos() {
    if (disabled || guard.current) return;

    guard.current = true;
    setBusy(true);
    onBusyChange(true);
    setProgress("Refreshing saved photos…");

    try {
      onChange(await getProperty(property.id));
      setNeedsRefresh(false);
      setMessage("");
      setProgress("Saved photos refreshed.");
    } catch {
      setProgress("Photo refresh stopped.");
      setMessage(
        "The saved photo list is unavailable. Try refreshing again before uploading.",
      );
    } finally {
      guard.current = false;
      setBusy(false);
      onBusyChange(false);
    }
  }

  async function upload(files: FileList | null) {
    if (!files?.length || disabled || guard.current || needsRefresh) return;

    const selected = Array.from(files);

    if (property.photos.length + selected.length > 12) {
      setMessage("A property can have up to 12 photos. Select fewer files.");
      return;
    }

    const invalid = selected.find((file) => !isValidPropertyPhoto(file));

    if (invalid) {
      setMessage("Use JPEG, PNG or WebP images up to 5 MiB each.");

      if (input.current) input.current.value = "";

      return;
    }

    guard.current = true;
    setBusy(true);
    onBusyChange(true);
    setMessage("");

    try {
      for (let index = 0; index < selected.length; index++) {
        const file = selected[index];

        if (!file) continue;

        setProgress(`Uploading photo ${index + 1} of ${selected.length}…`);

        const result = await uploadPropertyPhoto(property.id, file);

        if (!result.ok) throw new Error(result.error.message);

        onChange(await getProperty(property.id));
      }

      setProgress(
        `${selected.length} photo${selected.length === 1 ? "" : "s"} uploaded.`,
      );
    } catch (error) {
      setProgress("Upload stopped.");

      try {
        onChange(await getProperty(property.id));
      } catch {
        setNeedsRefresh(true);
      }

      setMessage(
        `${error instanceof Error ? error.message : "Upload failed."} Further uploads stopped. Review the saved photos before choosing files again.`,
      );
    } finally {
      if (input.current) input.current.value = "";

      guard.current = false;
      setBusy(false);
      onBusyChange(false);
    }
  }

  function move(index: number, destination: number) {
    const ids = property.photos.map((photo) => photo.id);
    const [id] = ids.splice(index, 1);

    if (!id) return;

    ids.splice(destination, 0, id);
    void action(
      () => reorderPropertyPhotos(property.id, ids),
      "Saving photo order…",
      "Photo order saved.",
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-sm leading-6 text-muted-foreground">
        Listing photos are public, including draft photos by their direct URL.
        Do not upload IDs, contracts or confidential documents. JPEG, PNG or
        WebP, up to 5 MiB each; maximum 12 photos.
      </p>
      <Field>
        <FieldLabel htmlFor="property-photos">Add photos</FieldLabel>
        <Input
          ref={input}
          id="property-photos"
          aria-invalid={Boolean(validationError)}
          aria-describedby={
            validationError ? "property-photos-error" : undefined
          }
          type="file"
          accept={propertyPhotoMimeTypes.join(",")}
          multiple
          disabled={locked || property.photos.length >= 12}
          onChange={(event) => void upload(event.target.files)}
        />
        {validationError && (
          <FieldError id="property-photos-error">{validationError}</FieldError>
        )}
      </Field>
      <p
        role="status"
        aria-live="polite"
        className="flex items-center gap-2 text-sm text-muted-foreground"
      >
        {busy && <Spinner className="size-5 shrink-0 text-primary" />}
        {progress ||
          `${property.photos.length} of 12 photos saved. The first photo is the cover.`}
      </p>
      {message && (
        <Alert variant="destructive">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
      {needsRefresh && (
        <Button
          type="button"
          variant="outline"
          disabled={disabled || busy}
          aria-busy={busy}
          onClick={() => void refreshSavedPhotos()}
        >
          Refresh saved photos
        </Button>
      )}
      <ol className="grid gap-4 sm:grid-cols-2">
        {property.photos.map((photo, index) => (
          <li
            key={photo.id}
            className="overflow-hidden rounded-xl border border-border bg-card"
          >
            <PropertyImage
              photo={photo}
              alt={`${property.title}, photo ${index + 1}`}
              className="aspect-[4/3] w-full"
            />
            <div className="space-y-2 p-3">
              <p className="text-sm font-medium">
                {index === 0 ? "Cover photo" : `Photo ${index + 1}`}
              </p>
              <div className="flex flex-wrap gap-2">
                {index > 0 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={locked}
                    onClick={() => move(index, 0)}
                  >
                    Set as cover
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  aria-label={`Move photo ${index + 1} earlier`}
                  disabled={locked || index === 0}
                  onClick={() => move(index, index - 1)}
                >
                  Earlier
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  aria-label={`Move photo ${index + 1} later`}
                  disabled={locked || index === property.photos.length - 1}
                  onClick={() => move(index, index + 1)}
                >
                  Later
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={
                    locked ||
                    (property.publishingState === "published" &&
                      property.photos.length === 1)
                  }
                  onClick={() =>
                    void action(
                      () => removePropertyPhoto(property.id, photo.id),
                      `Removing photo ${index + 1}…`,
                      "Photo removed.",
                    )
                  }
                  aria-label={`Remove photo ${index + 1}`}
                >
                  Remove
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ol>
      {property.publishingState === "published" &&
        property.photos.length === 1 && (
          <p className="text-sm text-muted-foreground">
            Unpublish before removing the last photo.
          </p>
        )}
    </div>
  );
}
