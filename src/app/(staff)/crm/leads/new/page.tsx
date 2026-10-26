import Link from "next/link";
import { requireStaffSession } from "@/lib/auth/server";
import { LeadForm } from "@/features/leads/crm/lead-form";
export default async function NewLeadPage() {
  const staff = await requireStaffSession();
  return (
    <main id="main-content" className="min-w-0 flex-1 px-4 py-8 sm:px-8">
      <Link
        href="/crm/leads"
        className="mb-5 inline-flex min-h-11 items-center text-sm text-muted-foreground"
      >
        ← Back to leads
      </Link>
      <h1 className="text-3xl font-semibold tracking-tight">New lead</h1>
      <p className="mt-2 mb-8 text-sm text-muted-foreground">
        Start a conversation. Add contact details and what they are looking for.
      </p>
      <LeadForm manager={staff.role !== "agent"} />
    </main>
  );
}
