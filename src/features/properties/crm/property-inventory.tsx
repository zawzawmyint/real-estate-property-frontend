import { DataTable, type DataColumn } from "@/components/crm/data-table";
import { CollectionPagination } from "@/components/crm/collection-pagination";
import Link from "next/link";
import { NavigationPending } from "@/components/ui/navigation-pending";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import type { PropertyList, StaffProperty } from "../data/types";
import { PropertyImage } from "../shared/property-image";
import {
  formatPrice,
  serializePropertyFilters,
  type PropertyFilters,
} from "../data/filters";

export function PropertyInventory({
  result,
  filters,
  canEdit,
}: {
  result: PropertyList<StaffProperty>;
  filters: PropertyFilters;
  canEdit: boolean;
}) {
  const pageHref = (page: number) =>
    `/crm/properties?${serializePropertyFilters({ ...filters, page })}`;
  const filtered = Boolean(
    filters.q ||
    filters.type ||
    filters.purpose ||
    filters.publishingState ||
    filters.availability,
  );

  const columns: DataColumn<StaffProperty>[] = [
    {
      id: "property",
      header: "Property",
      cell: (property) => (
        <div className="flex max-w-72 items-center gap-3">
          <Cover property={property} />
          <div className="min-w-0">
            <Link
              className="line-clamp-2 font-medium text-primary underline-offset-4 hover:underline"
              href={`/crm/properties/${property.id}`}
            >
              {property.title}
            </Link>
            <p className="mt-1 text-xs text-muted-foreground">
              {[property.community, property.city].filter(Boolean).join(", ") ||
                "Location not set"}
            </p>
            {property.isDemo && (
              <Badge variant="outline" className="mt-1">
                Demo property
              </Badge>
            )}
          </div>
        </div>
      ),
    },
    {
      id: "price",
      header: "Price",
      cell: (property) =>
        property.priceFils == null
          ? "Not set"
          : formatPrice(property.priceFils, property.purpose),
    },
    {
      id: "state",
      header: "State",
      cell: (property) => (
        <Badge variant="outline">{property.publishingState}</Badge>
      ),
    },
    {
      id: "availability",
      header: "Availability",
      cell: (property) => property.availability,
    },
    {
      id: "updated",
      header: "Updated",
      cell: (property) =>
        new Date(property.updatedAt).toLocaleDateString("en-GB", {
          timeZone: "UTC",
        }),
    },
    {
      id: "actions",
      header: "Actions",
      cell: (property) => <Actions property={property} canEdit={canEdit} />,
    },
  ];
  return (
    <div className="space-y-6">
      <p role="status" className="text-sm text-muted-foreground">
        {result.total} propert{result.total === 1 ? "y" : "ies"}
        {filtered ? " matching your filters" : " in inventory"}
      </p>
      <DataTable
        rows={result.items}
        columns={columns}
        getRowKey={(property) => property.id}
        label="Property inventory"
        empty={
          <Empty className="min-h-48 border">
            <EmptyHeader>
              <EmptyTitle>
                {filtered
                  ? "No matching properties"
                  : result.total
                    ? "No properties on this page"
                    : "Your property inventory is empty"}
              </EmptyTitle>
              <EmptyDescription>
                {filtered
                  ? "Try another search or clear the filters."
                  : canEdit
                    ? "Add a property to save your first draft."
                    : "Properties will appear here when staff add them."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        }
        renderMobile={(property) => (
          <article className="rounded-xl border border-border bg-card p-4">
            <div className="flex gap-3">
              <Cover property={property} />
              <div className="min-w-0">
                <Link
                  href={`/crm/properties/${property.id}`}
                  className="break-words font-semibold text-primary"
                >
                  {property.title}
                </Link>
                <p className="mt-1 text-sm text-muted-foreground">
                  {[property.community, property.city]
                    .filter(Boolean)
                    .join(", ") || "Location not set"}
                </p>
              </div>
            </div>
            <p className="my-3 text-sm font-medium">
              {property.priceFils == null
                ? "Price not set"
                : formatPrice(property.priceFils, property.purpose)}
            </p>
            <div className="mb-3 flex flex-wrap gap-2">
              <Badge variant="outline">{property.publishingState}</Badge>
              <Badge variant="outline">{property.availability}</Badge>
              {property.isDemo && (
                <Badge variant="outline">Demo property</Badge>
              )}
            </div>
            <Actions property={property} canEdit={canEdit} />
          </article>
        )}
      />
      <CollectionPagination
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
        href={pageHref}
      />
    </div>
  );
}

function Cover({ property }: { property: StaffProperty }) {
  const photo = property.photos[0];

  return photo ? (
    <PropertyImage
      photo={photo}
      alt=""
      className="h-16 w-20 shrink-0 rounded-lg"
    />
  ) : (
    <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground">
      No photo
    </div>
  );
}

function Actions({
  property,
  canEdit,
}: {
  property: StaffProperty;
  canEdit: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      <Link
        href={`/crm/properties/${property.id}`}
        aria-label="View details"
        title="View details"
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-primary transition-colors hover:bg-muted"
      >
        <Icon name="view" />
      </Link>
      {canEdit && (
        <Link
          href={`/crm/properties/${property.id}/edit`}
          aria-label="Edit"
          title="Edit"
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-primary transition-colors hover:bg-muted"
        >
          <Icon name="edit" />
        </Link>
      )}
      {property.publishingState === "published" &&
        property.availability === "available" && (
          <Link
            href={`/properties/${property.id}`}
            aria-label="View public listing"
            title="View public listing"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-primary transition-colors hover:bg-muted"
          >
            <Icon name="external" />
            <NavigationPending />
          </Link>
        )}
    </div>
  );
}
