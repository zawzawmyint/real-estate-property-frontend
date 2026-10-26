import type { Metadata } from "next";
import Link from "next/link";
import { NavigationPending } from "@/components/ui/navigation-pending";
import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { requireStaffSession } from "@/lib/auth/server";
import { getStaffProperty } from "@/lib/api/server";
import { PropertyApiError } from "@/features/properties/data/request";
import { PropertyReadOnly } from "@/features/properties/crm/property-read-only";

export const metadata: Metadata = {
  title: "Property details · Agency workspace",
  robots: { index: false, follow: false },
};

export default async function PropertyDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const staff = await requireStaffSession();
  const { id } = await params;
  const canEdit = staff.role !== "agent";
  let property;

  try {
    property = await getStaffProperty(id);
  } catch (error) {
    if (error instanceof PropertyApiError && error.status === 404) notFound();
    if (error instanceof PropertyApiError && error.status === 401)
      redirect("/login");

    throw error;
  }

  return (
    <main id="main-content" className="min-w-0 flex-1 px-4 py-10 sm:px-8">
      <h1 className="text-3xl font-semibold tracking-tight">
        Property details
      </h1>
      <p className="mt-3 break-words text-sm text-muted-foreground">
        {property.title}{" "}
        {property.isDemo && <Badge variant="outline">Demo property</Badge>}
      </p>
      <div className="mb-6 flex flex-wrap gap-6">
        {canEdit && (
          <Link
            href={`/crm/properties/${id}/edit`}
            className="inline-flex min-h-11 items-center text-primary underline"
          >
            Edit property
          </Link>
        )}
        {property.publishingState === "published" &&
          property.availability === "available" && (
            <Link
              href={`/properties/${id}`}
              className="inline-flex min-h-11 items-center text-primary underline"
            >
              View public listing
              <NavigationPending />
            </Link>
          )}
      </div>
      <PropertyReadOnly property={property} canEdit={canEdit} />
    </main>
  );
}
