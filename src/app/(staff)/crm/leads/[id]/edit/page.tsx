import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { requireStaffSession } from "@/lib/auth/server";
import { getStaffLead } from "@/features/leads/data/server";
import { LeadApiError } from "@/features/leads/data/request";
import { LeadForm } from "@/features/leads/crm/lead-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
export default async function EditLeadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const staff = await requireStaffSession();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  let lead;
  try {
    lead = await getStaffLead(id);
  } catch (error) {
    if (error instanceof LeadApiError && error.status === 401)
      redirect("/login");
    return (
      <main id="main-content" className="min-w-0 flex-1 px-4 py-10 sm:px-8">
        <Alert variant="destructive">
          <AlertDescription>
            {error instanceof LeadApiError && [403, 404].includes(error.status)
              ? "This lead is no longer available to your account"
              : "Lead details could not be loaded."}{" "}
            <Link href="/crm/leads" className="underline">
              Back to leads
            </Link>
          </AlertDescription>
        </Alert>
      </main>
    );
  }
  return (
    <main id="main-content" className="min-w-0 flex-1 px-4 py-8 sm:px-8">
      <Link
        href={`/crm/leads/${id}`}
        className="mb-5 inline-flex min-h-11 items-center text-sm text-muted-foreground"
      >
        ← Back to lead
      </Link>
      <h1 className="mb-8 text-3xl font-semibold tracking-tight">
        Edit details
      </h1>
      <LeadForm initialLead={lead} manager={staff.role !== "agent"} />
    </main>
  );
}
