import { redirect } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getStaffViewings } from "../data/server";
import { weekQuery } from "../data/calendar";
import { ViewingApiError } from "../data/request";
import { ViewingCalendar } from "./calendar";
import { LoadingState } from "@/components/ui/loading-state";
import { RetryViewings } from "./retry-results";
export function ViewingLoading() {
  return (
    <LoadingState
      label="Loading viewings…"
      className="mt-6 rounded-xl border border-border bg-card"
    />
  );
}
export async function ViewingResults({
  date,
  status,
  leadId,
}: {
  date: string;
  status: string;
  leadId?: string;
}) {
  let initial;
  try {
    initial = await getStaffViewings(weekQuery(date, status, leadId));
  } catch (error) {
    if (error instanceof ViewingApiError && error.status === 401)
      redirect("/login");
    return (
      <Alert variant="destructive" className="mt-6">
        <AlertDescription>
          {error instanceof ViewingApiError && [403, 404].includes(error.status)
            ? "These viewings are no longer available to your account."
            : "Viewings could not be loaded."}{" "}
          <RetryViewings />
        </AlertDescription>
      </Alert>
    );
  }
  return (
    <ViewingCalendar
      initial={initial}
      date={date}
      status={status}
      leadId={leadId}
    />
  );
}
