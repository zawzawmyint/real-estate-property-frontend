import Link from "next/link";
import type { Metadata } from "next";
import { requireStaffSession } from "@/lib/auth/server";
import { PageHeader } from "@/components/layout/page-header";
import { LeadImport } from "@/features/leads/crm/lead-import";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button-variants";

export const metadata: Metadata = {
  title: "Import leads · Agency workspace",
  robots: { index: false, follow: false },
};

export default async function LeadImportPage() {
  const staff = await requireStaffSession();
  return (
    <main id="main-content" className="min-w-0 flex-1 px-4 py-6 sm:px-8">
      <PageHeader
        title="Import leads"
        description="Create new leads from a CSV. Every lead starts New and unassigned, with no property linked. Existing leads are not matched or updated."
      />
      {staff.role === "agent" ? (
        <Alert variant="destructive">
          <AlertDescription>
            You do not have permission to import leads.{" "}
            <Link href="/crm/leads" className="underline">
              Return to leads
            </Link>
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          <div className="space-y-3">
            <a
              href="/api/v1/staff/leads/imports/template"
              className={buttonVariants({ variant: "outline" })}
            >
              Download CSV template
            </a>
            <p className="max-w-3xl text-sm text-muted-foreground">
              Use the template, not an export report. Each row needs a name,
              purpose (sale or rent), source (call or walk_in), and a phone
              number or email address. Budgets are optional plain decimal AED
              amounts, without commas or currency symbols. Import phone columns
              as text in your spreadsheet to preserve leading zeroes. Every row
              must be valid; nothing is saved until you confirm. Repeated
              contacts and identical rows create separate new leads.
            </p>
          </div>
          <LeadImport staffId={staff.id} />
        </div>
      )}
    </main>
  );
}
