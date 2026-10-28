import "server-only";
import { redirect } from "next/navigation";
import { requireStaffSession } from "@/lib/auth/server";
import { SessionServiceError } from "@/lib/auth/transport";
import { SessionRetry } from "@/features/auth/session-retry";
import {
  parsePipelineFilters,
  pipelineQuery,
  type PipelineColumnData,
} from "../../data/pipeline";
import { getStaffLeads } from "../../data/server";
import { leadQuery } from "../../data/filters";
import { LeadApiError } from "../../data/request";
import { stages } from "../../data/input";
import { LeadFilters } from "../lead-filters";
import { InvalidLeadFilters } from "../lead-inventory";
import { PipelineBoard } from "./pipeline-board";

async function context(query: string) {
  const staff = await requireStaffSession();
  try {
    return { staff, filters: parsePipelineFilters(query, staff.role) };
  } catch {
    return { staff, filters: null };
  }
}

export async function PipelineFilterRegion({ query }: { query: string }) {
  let data;
  try {
    data = await context(query);
  } catch (error) {
    if (!(error instanceof SessionServiceError)) throw error;
    return <SessionRetry />;
  }
  if (!data.filters) return <InvalidLeadFilters />;
  return (
    <LeadFilters
      filters={data.filters}
      manager={data.staff.role !== "agent"}
      pipeline
    />
  );
}

export async function PipelineResultRegion({ query }: { query: string }) {
  let data;
  try {
    data = await context(query);
  } catch (error) {
    if (!(error instanceof SessionServiceError)) throw error;
    return null;
  }
  if (!data.filters) return null;
  const filters = data.filters;
  const columns = await Promise.all(
    stages.map(async (stage): Promise<PipelineColumnData> => {
      try {
        return {
          stage,
          result: await getStaffLeads(pipelineQuery(filters, stage)),
        };
      } catch (error) {
        if (error instanceof LeadApiError && error.status === 401)
          redirect("/login");
        return {
          stage,
          result: null,
          error: "This stage could not be loaded.",
        };
      }
    }),
  );
  return (
    <PipelineBoard
      key={leadQuery(filters)}
      initialColumns={columns}
      filters={filters}
    />
  );
}
