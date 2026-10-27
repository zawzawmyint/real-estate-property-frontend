import type { components } from "@/lib/api/generated/public-agency";

export type PublicAgency = components["schemas"]["PublicAgency"];
export type PublicAgentSummary = components["schemas"]["PublicAgentSummary"];
export type PublicAgentDetail = components["schemas"]["PublicAgentDetail"];
export type PublicAgentList = { items: PublicAgentSummary[]; total: number };
