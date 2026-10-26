"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PropertyFormSection } from "./property-form-section";
import {
  PropertyFormFields,
  propertyFieldLabels,
} from "./property-form-fields";
import { PropertyLifecycleControls } from "./property-lifecycle-controls";
import { PropertyReadOnly } from "./property-read-only";
import type { StaffRole } from "@/lib/auth/roles";
import {
  createProperty,
  deleteProperty,
  updateProperty,
} from "../data/actions";
import { getProperty } from "../data/queries";
import {
  type PatchProperty,
  type StaffProperty,
  type PropertyActionError,
} from "../data/types";
import {
  propertyFormDefaults,
  propertyFormSchema,
  publishingRequirements,
  toPropertyInput,
  type PropertyFormValues,
} from "../data/input";
import { PropertyPhotos } from "./property-photos";

type Intent = "save" | "publish";

export function PropertyForm({
  initialProperty,
  role,
}: {
  initialProperty?: StaffProperty;
  role: StaffRole;
}) {
  const router = useRouter();
  const [property, setProperty] = useState(initialProperty);
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState("");
  const [photosBusy, setPhotosBusy] = useState(false);
  const [actionLabel, setActionLabel] = useState("Saving…");
  const [uncertainCreate, setUncertainCreate] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [photosError, setPhotosError] = useState("");
  const [isPending, startTransition] = useTransition();
  const guard = useRef(false);
  const intent = useRef<Intent>("save");

  const form = useForm<
    z.input<typeof propertyFormSchema>,
    unknown,
    PropertyFormValues
  >({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: propertyFormDefaults(initialProperty),
  });
  const {
    handleSubmit,
    setError,
    clearErrors,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = form;

  const pending = isPending || isSubmitting || photosBusy;
  const archived = property?.publishingState === "archived";
  const readOnly = role === "agent";

  function failed(error: PropertyActionError) {
    setMessage(error.message);

    if (!property && error.uncertain) setUncertainCreate(true);

    for (const [name, messages] of Object.entries(error.fieldErrors ?? {})) {
      const field = name === "priceFils" ? "price" : name;

      if (field in propertyFieldLabels)
        setError(field as keyof PropertyFormValues, {
          message: messages.join(" "),
        });
    }
  }

  function saved(result: StaffProperty, text: string) {
    setProperty(result);
    reset(propertyFormDefaults(result));
    setFeedback(text);
    setMessage("");
    startTransition(() => router.refresh());
  }

  async function save(values: PropertyFormValues) {
    const publishing =
      intent.current === "publish" || property?.publishingState === "published";

    if (publishing) {
      const requirements = publishingRequirements(
        values,
        property?.photos.length ?? 0,
      );

      if (
        Object.keys(requirements).length ||
        (intent.current === "publish" && property?.availability !== "available")
      ) {
        for (const [key, error] of Object.entries(requirements)) {
          if (key === "photos") setPhotosError(error);
          else setError(key as keyof PropertyFormValues, { message: error });
        }

        setMessage(
          intent.current === "publish" && property?.availability !== "available"
            ? "Set availability to Available before publishing."
            : "Complete the highlighted fields and add a saved photo before publishing.",
        );
        guard.current = false;
        return;
      }
    }

    startTransition(async () => {
      let navigating = false;

      try {
        const input = toPropertyInput(values);

        if (property) {
          const result = await updateProperty(property.id, {
            ...input,
            ...(intent.current === "publish"
              ? { publishingState: "published" }
              : {}),
          });

          if (!result.ok) {
            failed(result.error);
            return;
          }

          saved(
            result.data,
            intent.current === "publish"
              ? "Property published."
              : "Changes saved.",
          );
        } else {
          const result = await createProperty(input);

          if (!result.ok) {
            failed(result.error);
            return;
          }

          navigating = true;
          startTransition(() => {
            router.replace(`/crm/properties/${result.data.id}/edit`);
          });
        }
      } catch {
        // A dropped action response may follow a successful backend create.
        if (!property) setUncertainCreate(true);

        setMessage(
          "The saved property could not be confirmed. Check inventory before retrying.",
        );
      } finally {
        if (!navigating) guard.current = false;
      }
    });
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (guard.current || pending || readOnly || archived || uncertainCreate)
      return;

    guard.current = true;
    setActionLabel(intent.current === "publish" ? "Publishing…" : "Saving…");
    setMessage("");
    setFeedback("");
    setPhotosError("");
    clearErrors();

    const fields = new FormData(event.currentTarget);

    // Preserve autofill and password-manager style native input changes.
    for (const key of Object.keys(
      propertyFieldLabels,
    ) as (keyof PropertyFormValues)[]) {
      if (key !== "featured")
        form.setValue(key, String(fields.get(key) ?? "") as never);
    }

    form.setValue("featured", fields.get("featured") === "on");
    await handleSubmit(save, () => {
      guard.current = false;
      setMessage("Check the highlighted fields.");
    })(event);
  }

  async function transitionProperty(patch: PatchProperty, text: string) {
    if (!property || guard.current || pending) return;
    if (isDirty) {
      setMessage(
        "Save your changes before changing publishing state or availability.",
      );
      return;
    }

    guard.current = true;
    setActionLabel(
      patch.publishingState === "archived"
        ? "Archiving…"
        : patch.publishingState === "draft"
          ? property.publishingState === "archived"
            ? "Restoring to draft…"
            : "Unpublishing…"
          : "Saving availability…",
    );
    setMessage("");
    setFeedback("");
    startTransition(async () => {
      try {
        const result = await updateProperty(property.id, patch);

        if (!result.ok) {
          failed(result.error);
          return;
        }

        saved(result.data, text);
      } catch {
        setMessage(
          "The action could not be confirmed. Refresh the saved property before retrying.",
        );
      } finally {
        guard.current = false;
      }
    });
  }

  async function remove() {
    if (!property || guard.current || pending) return;

    guard.current = true;
    setActionLabel("Deleting property…");
    startTransition(async () => {
      try {
        const result = await deleteProperty(property.id);

        if (!result.ok) {
          setConfirmOpen(false);
          failed(result.error);
          return;
        }

        startTransition(() => {
          router.replace("/crm/properties");
        });
      } catch {
        setConfirmOpen(false);
        setMessage(
          "The deletion could not be confirmed. Check inventory before retrying.",
        );
      } finally {
        guard.current = false;
      }
    });
  }

  if (readOnly && property) return <PropertyReadOnly property={property} />;

  return (
    <form
      noValidate
      onSubmit={submit}
      className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_16rem]"
      aria-busy={pending}
    >
      <div className="min-w-0 space-y-6">
        {message && (
          <Alert variant="destructive">
            <AlertDescription>
              <p>{message}</p>
              {Object.keys(errors).length > 0 && (
                <ul className="mt-2 list-inside list-disc">
                  {Object.keys(errors).map((key) => (
                    <li key={key}>
                      <a href={`#property-${key}`} className="underline">
                        {propertyFieldLabels[key as keyof PropertyFormValues]}:{" "}
                        {errors[key as keyof PropertyFormValues]?.message}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </AlertDescription>
          </Alert>
        )}
        {feedback && (
          <Alert>
            <AlertDescription>
              <span role="status">{feedback}</span>
            </AlertDescription>
          </Alert>
        )}
        {uncertainCreate && (
          <Alert variant="destructive">
            <AlertDescription>
              The save result is uncertain. Your entered values are preserved.{" "}
              <Link href="/crm/properties" className="underline">
                Check inventory
              </Link>{" "}
              before starting another property to avoid duplicates.
            </AlertDescription>
          </Alert>
        )}
        {archived && (
          <Alert>
            <AlertDescription>
              This property is archived. Restore it to draft before editing or
              adding photos.
            </AlertDescription>
          </Alert>
        )}
        <PropertyFormFields
          form={form}
          pending={pending}
          disabled={pending || Boolean(archived) || uncertainCreate}
        />
        <PropertyFormSection title="Photos">
          {property ? (
            <PropertyPhotos
              property={property}
              validationError={photosError}
              disabled={pending || Boolean(archived)}
              onChange={setProperty}
              onBusyChange={setPhotosBusy}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Save your draft before adding photos.
            </p>
          )}
        </PropertyFormSection>
      </div>
      <PropertyLifecycleControls
        property={property}
        role={role}
        pending={pending}
        pendingLabel={photosBusy ? undefined : actionLabel}
        uncertainCreate={uncertainCreate}
        confirmOpen={confirmOpen}
        onConfirmOpenChange={setConfirmOpen}
        onSaveIntent={() => {
          intent.current = "save";
        }}
        onPublishIntent={() => {
          intent.current = "publish";
        }}
        onTransition={transitionProperty}
        onDelete={remove}
        onReload={async () => {
          if (!property || guard.current || pending) return;

          guard.current = true;
          setActionLabel("Reloading saved property…");
          setMessage("");
          setFeedback("");
          startTransition(async () => {
            try {
              saved(
                await getProperty(property.id),
                "Saved property refreshed.",
              );
            } catch (error) {
              setMessage(
                error instanceof Error ? error.message : "Refresh failed.",
              );
            } finally {
              guard.current = false;
            }
          });
        }}
      />
    </form>
  );
}
