"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Spinner } from "@/components/ui/spinner";
import { NavigationPending } from "@/components/ui/navigation-pending";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Field, FieldLabel } from "@/components/ui/field";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { StaffRole } from "@/lib/auth/roles";
import { type PatchProperty, type StaffProperty } from "../data/types";

export function PropertyLifecycleControls({
  property,
  role,
  pending,
  pendingLabel,
  uncertainCreate,
  confirmOpen,
  onConfirmOpenChange,
  onSaveIntent,
  onPublishIntent,
  onTransition,
  onDelete,
  onReload,
}: {
  property: StaffProperty | undefined;
  role: StaffRole;
  pending: boolean;
  pendingLabel?: string;
  uncertainCreate: boolean;
  confirmOpen: boolean;
  onConfirmOpenChange: (open: boolean) => void;
  onSaveIntent: () => void;
  onPublishIntent: () => void;
  onTransition: (patch: PatchProperty, text: string) => Promise<void>;
  onDelete: () => Promise<void>;
  onReload: () => Promise<void>;
}) {
  const archived = property?.publishingState === "archived";

  return (
    <Card className="xl:sticky xl:top-6">
      <CardContent className="space-y-5">
        <h2 className="font-semibold">Publishing</h2>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">
            {property?.publishingState ?? "draft"}
          </Badge>
          {property && <Badge variant="outline">{property.availability}</Badge>}
        </div>
        {property?.publishingState === "published" && (
          <p className="text-sm leading-6 text-muted-foreground">
            Saving changes updates the public listing immediately. There is no
            separate unpublished revision.
          </p>
        )}
        {!archived && (
          <>
            <SubmitButton
              className="w-full"
              pending={pending && pendingLabel === "Saving…"}
              disabled={pending || uncertainCreate}
              label={property ? "Save changes" : "Save draft"}
              pendingLabel="Saving…"
              onClick={onSaveIntent}
            />
            {property &&
              (property.publishingState === "draft" ? (
                <Button
                  className="w-full"
                  type="submit"
                  variant="outline"
                  disabled={pending}
                  onClick={onPublishIntent}
                >
                  {pending && pendingLabel === "Publishing…" && (
                    <Spinner className="size-5 text-primary" />
                  )}
                  {pending && pendingLabel === "Publishing…"
                    ? pendingLabel
                    : "Publish"}
                </Button>
              ) : (
                <Button
                  className="w-full"
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={() =>
                    void onTransition(
                      { publishingState: "draft" },
                      "Property returned to draft.",
                    )
                  }
                >
                  Unpublish
                </Button>
              ))}
            {property && (
              <Field>
                <FieldLabel htmlFor="property-availability">
                  Availability
                </FieldLabel>
                <NativeSelect
                  id="property-availability"
                  className="w-full"
                  disabled={pending}
                  value={property.availability}
                  onChange={(event) =>
                    void onTransition(
                      {
                        availability: event.target
                          .value as StaffProperty["availability"],
                      },
                      "Availability saved.",
                    )
                  }
                >
                  <NativeSelectOption value="available">
                    Available
                  </NativeSelectOption>
                  <NativeSelectOption
                    value={property.purpose === "sale" ? "sold" : "rented"}
                  >
                    {property.purpose === "sale" ? "Sold" : "Rented"}
                  </NativeSelectOption>
                </NativeSelect>
              </Field>
            )}
          </>
        )}
        {property && (
          <div className="space-y-3 border-t border-border pt-5">
            {archived ? (
              <Button
                className="w-full"
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() =>
                  void onTransition(
                    { publishingState: "draft" },
                    "Property restored to draft.",
                  )
                }
              >
                Restore to draft
              </Button>
            ) : (
              <Button
                className="w-full"
                type="button"
                variant="ghost"
                disabled={pending}
                onClick={() =>
                  void onTransition(
                    { publishingState: "archived" },
                    "Property archived.",
                  )
                }
              >
                Archive
              </Button>
            )}
            {archived && role === "admin" && (
              <AlertDialog
                open={confirmOpen}
                onOpenChange={onConfirmOpenChange}
              >
                <AlertDialogTrigger
                  render={
                    <Button
                      className="w-full"
                      variant="destructive"
                      disabled={pending}
                    />
                  }
                >
                  Delete property
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Delete {property.title}?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This permanently deletes this archived property and its
                      photo records. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={pending}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      disabled={pending}
                      aria-busy={
                        pending && pendingLabel === "Deleting property…"
                      }
                      onClick={() => void onDelete()}
                    >
                      {pending && pendingLabel === "Deleting property…" && (
                        <Spinner className="size-5" />
                      )}
                      {pending && pendingLabel === "Deleting property…"
                        ? pendingLabel
                        : "Permanently delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                  <p role="status" className="text-sm text-muted-foreground">
                    {pending && pendingLabel === "Deleting property…"
                      ? pendingLabel
                      : ""}
                  </p>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        )}
        {property?.publishingState === "published" &&
          property.availability === "available" && (
            <Link
              href={`/properties/${property.id}`}
              className="inline-flex min-h-11 items-center text-sm text-primary underline"
            >
              View public listing ↗
              <NavigationPending />
            </Link>
          )}
        <Link
          href="/crm/properties"
          className="inline-flex min-h-11 items-center text-sm text-muted-foreground underline"
        >
          Back to inventory
        </Link>
        {property && (
          <Button
            type="button"
            variant="ghost"
            disabled={pending}
            onClick={onReload}
          >
            Reload saved property
          </Button>
        )}
        <p
          role="status"
          aria-live="polite"
          className="flex items-center gap-2 text-sm text-muted-foreground"
        >
          {pending && pendingLabel && !confirmOpen && (
            <Spinner className="size-5 text-primary" />
          )}
          {pending && !confirmOpen ? pendingLabel : ""}
        </p>
      </CardContent>
    </Card>
  );
}
