import "server-only";
import Link from "next/link";
import { requireStaffSession } from "@/lib/auth/server";
import { SessionServiceError } from "@/lib/auth/transport";
import { SessionRetry } from "@/features/auth/session-retry";
import { parseLeadFilters } from "../data/filters";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button-variants";
import { Icon } from "@/components/ui/icon";
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
        <Link href="/crm/leads" className="underline">
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

export async function CreateLeadAction() {
  try {
    await requireStaffSession();
  } catch (error) {
    if (!(error instanceof SessionServiceError)) throw error;
    return null;
  }
  return (
    <Link href="/crm/leads/new" className={`${buttonVariants()} gap-2`}>
      <Icon name="plus" />
      New lead
    </Link>
  );
}
