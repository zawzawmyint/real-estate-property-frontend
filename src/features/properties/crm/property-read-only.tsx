import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { type StaffProperty } from "../data/types";
import { formatArea, formatBedrooms, formatPrice } from "../data/filters";
import { PropertyFormSection } from "./property-form-section";
import { PropertyImage } from "../shared/property-image";

export function PropertyReadOnly({
  property,
  canEdit = false,
}: {
  property: StaffProperty;
  canEdit?: boolean;
}) {
  return (
    <div className="space-y-6">
      {!canEdit && (
        <Alert>
          <AlertDescription>
            You have read-only access to property inventory.
          </AlertDescription>
        </Alert>
      )}
      <PropertyFormSection title="Property details">
        <dl className="grid gap-5 sm:grid-cols-2">
          {[
            ["Title", property.title],
            ["Purpose", property.purpose],
            ["Property type", property.type],
            [
              "Price",
              property.priceFils == null
                ? null
                : formatPrice(property.priceFils, property.purpose),
            ],
            [
              "Location",
              [property.community, property.city].filter(Boolean).join(", "),
            ],
            [
              "Bedrooms",
              property.bedrooms == null
                ? null
                : formatBedrooms(property.bedrooms),
            ],
            ["Bathrooms", property.bathrooms],
            [
              "Area",
              property.areaSqft == null ? null : formatArea(property.areaSqft),
            ],
            ["Publishing state", property.publishingState],
            ["Availability", property.availability],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-sm text-muted-foreground">{label}</dt>
              <dd className="mt-1 font-medium">{value ?? "Not set"}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 whitespace-pre-line text-sm leading-7">
          {property.description ?? "No description saved."}
        </p>
      </PropertyFormSection>
      {canEdit && (
        <PropertyFormSection title="Owner contacts">
          <dl className="grid gap-5 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">Owner name</dt>
              <dd className="mt-1 font-medium">
                {property.ownerName ?? "Not set"}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Owner phone</dt>
              <dd className="mt-1 font-medium">
                {property.ownerPhone ?? "Not set"}
              </dd>
            </div>
          </dl>
        </PropertyFormSection>
      )}
      <PropertyFormSection title="Photos">
        {property.photos.length === 0 && (
          <p className="text-sm text-muted-foreground">No photos saved.</p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          {property.photos.map((photo, index) => (
            <div key={photo.id}>
              <PropertyImage
                photo={photo}
                alt={`${property.title}, photo ${index + 1}`}
                className="aspect-[4/3] w-full rounded-lg"
              />
            </div>
          ))}
        </div>
      </PropertyFormSection>
      <Link href="/crm/properties" className="text-primary underline">
        Back to inventory
      </Link>
    </div>
  );
}
