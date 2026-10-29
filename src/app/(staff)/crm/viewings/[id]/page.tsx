import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { requireStaffSession } from "@/lib/auth/server";
import { getStaffLead } from "@/features/leads/data/server";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getStaffViewing } from "@/features/viewings/data/server";
import { ViewingApiError } from "@/features/viewings/data/request";
import { ViewingDetail } from "@/features/viewings/crm/viewing-detail";
export default async function ViewingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireStaffSession();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const query = await searchParams;
  let viewing;
  try {
    viewing = await getStaffViewing(id);
  } catch (error) {
    if (error instanceof ViewingApiError && error.status === 401)
      redirect("/login");
    return (
      <main id="main-content" className="min-w-0 flex-1 p-6">
        <Alert variant="destructive">
          <AlertDescription>
            {error instanceof ViewingApiError &&
            [403, 404].includes(error.status)
              ? "This viewing is no longer available to your account."
              : "This viewing could not be loaded."}{" "}
            <Link href="/crm/viewings" className="underline">
              Back to viewings
            </Link>{" "}
            <Link href={`/crm/viewings/${id}`} className="ms-4 underline">
              Retry
            </Link>
          </AlertDescription>
        </Alert>
      </main>
    );
  }
  const lead = await getStaffLead(viewing.lead.id).catch(() => null);
  return (
    <ViewingDetail
      key={id}
      initial={viewing}
      initialLead={lead}
      saved={query.saved === "1"}
    />
  );
}
