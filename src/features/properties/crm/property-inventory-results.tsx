import "server-only";

import { redirect } from "next/navigation";
import { getStaffProperties } from "@/lib/api/server";
import {
  serializePropertyFilters,
  type PropertyFilters,
} from "../data/filters";
import { PropertyApiError } from "../data/request";
import { PropertyInventory } from "./property-inventory";

export async function PropertyInventoryResults({
  filters,
  canEdit,
}: {
  filters: PropertyFilters;
  canEdit: boolean;
}) {
  let result;

  try {
    result = await getStaffProperties(
      serializePropertyFilters(filters).toString(),
    );
  } catch (error) {
    if (error instanceof PropertyApiError && error.status === 401)
      redirect("/login");

    throw error;
  }

  return (
    <PropertyInventory result={result} filters={filters} canEdit={canEdit} />
  );
}
