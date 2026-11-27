import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getAccountSession } from "@/features/auth/staff-account-region";
import { canReadAudit } from "@/lib/auth/roles";
import { AuditAccess, AuditDenied } from "@/features/activity-log/access";
import { LogControls } from "@/features/activity-log/log-controls";
import { LogResults } from "@/features/activity-log/log-results";
import {
  auditPath,
  auditQuery,
  parseAuditFilters,
  type Query,
} from "@/features/activity-log/filters";

export async function ActivityLogPage({
  searchParams,
}: {
  searchParams: Promise<Query>;
}) {
  const staff = await getAccountSession();
  const parsed = parseAuditFilters(await searchParams);

  return (
    <main
      id="main-content"
      className="grid min-w-0 content-start gap-4 px-4 py-6 sm:px-8"
    >
      <PageHeader
        title="Activity log"
        description="Investigate recorded changes to agency records."
        variant="workspace"
      />
      {!staff ? (
        <Alert>
          <AlertDescription>
            Session verification unavailable. Retry the session check.
          </AlertDescription>
        </Alert>
      ) : !canReadAudit(staff.role) ? (
        <AuditDenied />
      ) : (
        <AuditAccess staffId={staff.id}>
          <p className="text-sm text-muted-foreground">
            Includes supported application writes. Earlier changes, login
            history and direct database or script edits are excluded. Values
            reflect the time of each event.
          </p>
          {"error" in parsed ? (
            <Alert variant="destructive">
              <AlertDescription>
                {parsed.error}{" "}
                <Link className="underline" href={auditPath}>
                  Reset filters
                </Link>
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <LogControls filters={parsed.filters} />
              <Suspense
                key={auditQuery(parsed.filters)}
                fallback={<p role="status">Loading recorded changes…</p>}
              >
                <LogResults filters={parsed.filters} />
              </Suspense>
            </>
          )}
        </AuditAccess>
      )}
    </main>
  );
}
