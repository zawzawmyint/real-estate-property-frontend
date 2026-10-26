import type { Metadata } from "next";
import Link from "next/link";
import { requireStaffSession } from "@/lib/auth/server";
import { PropertyForm } from "@/features/properties/crm/property-form";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const metadata: Metadata = {
  title: "Add property · Agency workspace",
  robots: { index: false, follow: false },
};

export default async function NewPropertyPage() {
  const staff = await requireStaffSession();

  return (
    <main id="main-content" className="min-w-0 flex-1 px-4 py-10 sm:px-8">
      <h1 className="mb-3 text-3xl font-semibold tracking-tight">
        Add property
      </h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Start with a title and purpose, then save a draft to add photos.
      </p>
      {staff.role === "agent" ? (
        <Alert variant="destructive">
          <AlertDescription>
            You have read-only access.{" "}
            <Link href="/crm/properties" className="underline">
              Return to inventory.
            </Link>
          </AlertDescription>
        </Alert>
      ) : (
        <PropertyForm role={staff.role} />
      )}
    </main>
  );
}
