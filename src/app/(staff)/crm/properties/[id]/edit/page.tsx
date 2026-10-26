import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireStaffSession } from "@/lib/auth/server";
import { getStaffProperty } from "@/lib/api/server";
import { PropertyForm } from "@/features/properties/crm/property-form";
import { PropertyApiError } from "@/features/properties/data/request";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Edit property · Agency workspace",
  robots: { index: false, follow: false },
};

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const staff = await requireStaffSession();
  const { id } = await params;

  if (staff.role === "agent") redirect(`/crm/properties/${id}`);

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
      <h1 className="text-3xl font-semibold tracking-tight">Edit property</h1>
      <p className="mb-8 mt-3 break-words text-sm text-muted-foreground">
        {property.title}{" "}
        {property.isDemo && <Badge variant="outline">Demo property</Badge>}
      </p>
      <Link
        href={`/crm/properties/${id}`}
        className="mb-6 inline-flex min-h-11 items-center text-primary underline"
      >
        Back to details
      </Link>
      <PropertyForm initialProperty={property} role={staff.role} />
    </main>
  );
}
