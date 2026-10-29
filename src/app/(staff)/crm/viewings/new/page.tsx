import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireStaffSession } from "@/lib/auth/server";
import { getStaffLead } from "@/features/leads/data/server";
import { LeadApiError } from "@/features/leads/data/request";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BookingForm } from "@/features/viewings/crm/booking-form";
import { getStaffProperty } from "@/lib/api/server";
export default async function NewViewingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireStaffSession();
  const query = await searchParams;
  if (!z.uuid().safeParse(query.leadId).success) redirect("/crm/leads");
  let lead;
  try {
    lead = await getStaffLead(String(query.leadId));
  } catch (error) {
    if (error instanceof LeadApiError && error.status === 401)
      redirect("/login");
    return (
      <main id="main-content" className="min-w-0 flex-1 p-6">
        <Alert variant="destructive">
          <AlertDescription>
            This lead could not be loaded or is no longer available.{" "}
            <Link className="underline" href="/crm/leads">
              Back to leads
            </Link>
          </AlertDescription>
        </Alert>
      </main>
    );
  }
  const property = lead.property?.id
    ? await getStaffProperty(lead.property.id).catch(() => null)
    : null;
  const bookable =
    property?.publishingState === "published" &&
    property.availability === "available"
      ? { id: property.id, title: property.title }
      : null;
  return <BookingForm initialLead={lead} initialProperty={bookable} />;
}
