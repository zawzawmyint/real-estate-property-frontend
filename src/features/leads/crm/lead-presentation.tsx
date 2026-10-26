import Link from "next/link";
import { leadsHref } from "../data/filters";
import { Badge } from "@/components/ui/badge";
import { stageLabels, sourceLabels } from "../data/input";
import type { LeadSummary } from "../data/types";
export function StageBadge({ stage }: { stage: LeadSummary["stage"] }) {
  return (
    <Badge variant={stage === "new" ? "default" : "outline"}>
      {stageLabels[stage]}
    </Badge>
  );
}
export function SourceBadge({ source }: { source: LeadSummary["source"] }) {
  return <Badge variant="outline">{sourceLabels[source]}</Badge>;
}
export function LeadDate({ value }: { value: string }) {
  const date = new Date(value);
  return (
    <time
      dateTime={value}
      title={date.toLocaleString("en-GB", {
        timeZone: "Asia/Dubai",
        dateStyle: "full",
        timeStyle: "long",
      })}
    >
      {date.toLocaleDateString("en-GB", {
        timeZone: "Asia/Dubai",
        day: "numeric",
        month: "short",
        year: "numeric",
      })}
    </time>
  );
}
export function budgetLabel(
  value: number | null,
  purpose: LeadSummary["purpose"],
) {
  return value === null
    ? "No budget specified"
    : `${new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED", maximumFractionDigits: 2 }).format(value / 100)}${purpose === "rent" ? " / year" : ""}`;
}
type AssigneeLead = Pick<LeadSummary, "assignedAgent" | "previousAgentName">;
export function assigneeLabel(lead: AssigneeLead) {
  return lead.assignedAgent
    ? `${lead.assignedAgent.name}${lead.assignedAgent.available ? "" : " (unavailable)"}`
    : lead.previousAgentName
      ? `Unassigned · ${lead.previousAgentName} (removed)`
      : "Unassigned";
}

export function AssigneeContext({
  lead,
  manager,
}: {
  lead: AssigneeLead;
  manager: boolean;
}) {
  const agent = lead.assignedAgent;
  if (!manager || !agent) return <>{assigneeLabel(lead)}</>;
  return (
    <Link
      href={leadsHref({
        view: "all",
        agentId: agent.id,
        sort: "newest",
        page: 1,
      })}
      aria-label={`View leads assigned to ${agent.name}`}
      className="inline-flex min-h-11 items-center break-words text-primary underline-offset-4 hover:underline"
    >
      {assigneeLabel(lead)}
    </Link>
  );
}
