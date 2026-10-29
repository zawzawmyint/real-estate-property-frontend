import "server-only";
import { redirect } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { requireStaffSession } from "@/lib/auth/server";
import { SessionServiceError } from "@/lib/auth/transport";
import { PageHeader } from "@/components/layout/page-header";
import { getDashboard } from "./server";
import { DashboardApiError } from "./request";
import { DashboardView } from "./dashboard-view";
import { DashboardRefresh } from "./dashboard-refresh";

export async function DashboardResults() {
  let summary;
  try {
    [, summary] = await Promise.all([requireStaffSession(), getDashboard()]);
  } catch (error) {
    if (error instanceof DashboardApiError && error.status === 401)
      redirect("/login");
    if (!(
      error instanceof DashboardApiError || error instanceof SessionServiceError
    ))
      throw error;
    return (
      <div className="space-y-6">
        <PageHeader
          title="Overview"
          description="Your lead acquisition and current sales pipeline."
        />
        <Alert>
          <AlertDescription>
            <p>
              {error instanceof SessionServiceError
                ? "Session verification is unavailable. Please try again."
                : error.message}
            </p>
            <DashboardRefresh retry />
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={summary.scope === "agency" ? "Agency overview" : "My overview"}
        description="Your lead acquisition and current sales pipeline."
        actions={<DashboardRefresh />}
        className="mb-5 border-b border-border pb-6"
      />
      <DashboardView summary={summary} />
    </>
  );
}

export function DashboardLoading() {
  return (
    <div
      role="status"
      aria-label="Loading dashboard"
      aria-busy="true"
      className="space-y-6"
    >
      <PageHeader
        title="Overview"
        description="Your lead acquisition and current sales pipeline."
        className="mb-5 border-b border-border pb-6"
      />
      <p className="text-sm text-muted-foreground">Loading dashboard…</p>
      <div
        aria-hidden="true"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {[0, 1, 2, 3].map((key) => (
          <div
            key={key}
            className="h-44 rounded-xl border border-border bg-card p-5"
          >
            <div className="h-3 w-24 rounded bg-muted" />
            <div className="mt-7 h-10 w-16 rounded bg-muted" />
            <div className="mt-5 h-3 w-32 rounded bg-muted" />
          </div>
        ))}
      </div>
      <div aria-hidden="true" className="grid gap-5 xl:grid-cols-2">
        {[0, 1].map((key) => (
          <div
            key={key}
            className="h-[430px] rounded-xl border border-border bg-card p-6"
          >
            <div className="h-4 w-36 rounded bg-muted" />
            <div className="mt-8 h-64 rounded bg-muted/50" />
          </div>
        ))}
      </div>
    </div>
  );
}
