import "server-only";

import { redirect } from "next/navigation";
import { getStaffProperties } from "@/lib/api/server";
import {
  serializePropertyFilters,
  type PropertyFilters,
} from "../data/filters";
import { PropertyApiError } from "../data/request";
import { PropertyInventory } from "./property-inventory";
import { requireStaffSession } from "@/lib/auth/server";
import { SessionServiceError } from "@/lib/auth/transport";
import { SessionRetry } from "@/features/auth/session-retry";

export async function PropertyInventoryResults({
  filters,
}: {
  filters: PropertyFilters;
}) {
  let staff;
  let result;

  try {
    // Express independently authorizes the inventory request. Render nothing
    // private until both that request and live UI session verification succeed.
    [staff, result] = await Promise.all([
      requireStaffSession(),
      getStaffProperties(serializePropertyFilters(filters).toString()),
    ]);
  } catch (error) {
    if (error instanceof SessionServiceError) return <SessionRetry />;
    if (error instanceof PropertyApiError && error.status === 401)
      redirect("/login");

    throw error;
  }

  return (
    <PropertyInventory
      result={result}
      filters={filters}
      canEdit={staff.role !== "agent"}
    />
  );
}
