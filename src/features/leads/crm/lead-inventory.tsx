import "server-only";
import Link from "next/link";
import { requireStaffSession } from "@/lib/auth/server";
import { SessionServiceError } from "@/lib/auth/transport";
import { SessionRetry } from "@/features/auth/session-retry";
import { leadExportQuery, parseLeadFilters } from "../data/filters";
import { CsvExportButton } from "@/components/crm/csv-export-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button-variants";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { LeadFilters } from "./lead-filters";
import { LeadResults } from "./lead-results";

async function inventoryContext(query: string) {
  const staff = await requireStaffSession();
  try {
    return {
      staff,
      filters: parseLeadFilters(new URLSearchParams(query), staff.role),
    };
  } catch {
    return { staff, filters: null };
  }
}

export function InvalidLeadFilters() {
  return (
    <Alert variant="destructive">
      <AlertDescription>
        These lead filters are invalid.{" "}
        <Link
          href="/crm/leads"
          className={buttonVariants({ variant: "outline" })}
        >
          Clear filters and try again
        </Link>
      </AlertDescription>
    </Alert>
  );
}

export async function LeadFilterRegion({ query }: { query: string }) {
  let context;
  try {
    context = await inventoryContext(query);
  } catch (error) {
    if (!(error instanceof SessionServiceError)) throw error;
    return <SessionRetry />;
  }
  if (!context.filters) return <InvalidLeadFilters />;
  return (
    <LeadFilters
      filters={context.filters}
      manager={context.staff.role !== "agent"}
    />
  );
}

export async function LeadResultRegion({ query }: { query: string }) {
  let context;
  try {
    context = await inventoryContext(query);
  } catch (error) {
    if (!(error instanceof SessionServiceError)) throw error;
    return null; // The filters region presents the session error and retry.
  }
  if (!context.filters) return null;
  return (
    <LeadResults
      filters={context.filters}
      manager={context.staff.role !== "agent"}
    />
  );
}

export async function CreateLeadAction({ query }: { query?: string } = {}) {
  let context;
  try {
    context = await inventoryContext(query || "");
  } catch (error) {
    if (!(error instanceof SessionServiceError)) throw error;
    return null;
  }
  if (!context.filters) return null;
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-3">
      {query !== undefined && (
        <CsvExportButton
          entity="leads"
          query={leadExportQuery(context.filters)}
          scope={query}
        />
      )}
      {query !== undefined && context.staff.role !== "agent" && (
        <Link
          href="/crm/leads/import"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "gap-2 px-3 sm:px-5",
          )}
        >
          Import CSV
        </Link>
      )}
      <Link
        href="/crm/leads/new"
        className={cn(buttonVariants(), "gap-2 px-3 sm:px-5")}
      >
        <Icon name="plus" />
        New lead
      </Link>
    </div>
  );
}
