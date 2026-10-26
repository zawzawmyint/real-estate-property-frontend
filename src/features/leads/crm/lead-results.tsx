import { redirect } from "next/navigation";
import Link from "next/link";
import { getStaffLeads } from "../data/server";
import { LeadApiError } from "../data/request";
import { leadQuery, leadsHref, type LeadFilters } from "../data/filters";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LeadList } from "./lead-list";
export async function LeadResults({
  filters,
  manager,
}: {
  filters: LeadFilters;
  manager: boolean;
}) {
  let result;
  try {
    result = await getStaffLeads(leadQuery(filters));
  } catch (error) {
    if (error instanceof LeadApiError && error.status === 401)
      redirect("/login");
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Leads could not be loaded.{" "}
          <Link href={leadsHref(filters)} className="underline">
            Retry with these filters
          </Link>
        </AlertDescription>
      </Alert>
    );
  }
  return <LeadList result={result} filters={filters} manager={manager} />;
}
