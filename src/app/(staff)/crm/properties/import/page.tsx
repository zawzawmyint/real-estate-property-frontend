import Link from "next/link";
import type { Metadata } from "next";
import { requireStaffSession } from "@/lib/auth/server";
import { PageHeader } from "@/components/layout/page-header";
import { PropertyImport } from "@/features/properties/crm/property-import";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button-variants";
export const metadata: Metadata = {
  title: "Import properties · Agency workspace",
  robots: { index: false, follow: false },
};
export default async function PropertyImportPage() {
  const staff = await requireStaffSession();
  return (
    <main id="main-content" className="min-w-0 flex-1 px-4 py-6 sm:px-8">
      <PageHeader
        title="Import properties"
        description="Create new drafts from a CSV. Existing properties are not matched or updated. Photos must be added later."
      />
      {staff.role === "agent" ? (
        <Alert variant="destructive">
          <AlertDescription>
            You do not have permission to import properties.{" "}
            <Link href="/crm/properties" className="underline">
              Return to inventory
            </Link>
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          <div className="space-y-3">
            <a
              href="/api/v1/staff/properties/imports/template"
              className={buttonVariants({ variant: "outline" })}
            >
              Download CSV template
            </a>
            <p className="text-sm text-muted-foreground">
              Use the template columns. Import phone columns as text in your
              spreadsheet to preserve leading zeroes. Every row must be valid;
              nothing is saved until you confirm.
            </p>
          </div>
          <PropertyImport staffId={staff.id} />
        </div>
      )}
    </main>
  );
}
