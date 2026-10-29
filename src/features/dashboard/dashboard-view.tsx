import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { DashboardCharts } from "./dashboard-charts";
import {
  formatConversion,
  formatCount,
  formatDashboardWeek,
  formatUpdatedAt,
} from "./presentation";
import type { DashboardSummary } from "./types";

export function DashboardView({ summary }: { summary: DashboardSummary }) {
  const metrics = [
    {
      title: "Total leads",
      value: formatCount(summary.totalLeads),
      description: "All time",
      icon: "leads" as const,
    },
    {
      title: "New leads this week",
      value: formatCount(summary.newLeadsThisWeek),
      description: formatDashboardWeek(
        summary.weekStart,
        summary.weekEndExclusive,
      ),
      icon: "calendar" as const,
    },
    {
      title: "Deals won",
      value: formatCount(summary.wonLeads),
      description: "Current Won leads · All time",
      icon: "won" as const,
    },
    {
      title: "Conversion rate",
      value: formatConversion(summary.conversionRatePercent),
      description:
        summary.totalLeads === 0
          ? "No leads yet"
          : `${formatCount(summary.wonLeads)} Won / ${formatCount(summary.totalLeads)} total leads · All time`,
      icon: "conversion" as const,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs leading-6 text-muted-foreground">
        <p>
          <span className="font-medium text-foreground">
            {summary.scope === "agency" ? "Agency totals" : "My assigned leads"}
          </span>
          <span aria-hidden="true"> · </span>Updated{" "}
          <time dateTime={summary.generatedAt}>
            {formatUpdatedAt(summary.generatedAt)}
          </time>
        </p>
        <span className="rounded-full border border-border bg-card px-3 py-0.5">
          {summary.scope === "agency"
            ? "All agency leads"
            : "Current assignments"}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ title, value, description, icon }) => (
          <article key={title} aria-label={title} className="min-w-0">
            <Card className="h-full gap-0 rounded-xl shadow-none">
              <CardContent className="px-5">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-sm font-medium leading-6">{title}</h2>
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-primary">
                    <Icon name={icon} className="size-4" />
                  </span>
                </div>
                <p className="mt-4 text-5xl font-semibold leading-none tracking-tight text-primary tabular-nums">
                  {value}
                </p>
                <p className="mt-4 text-xs leading-5 text-muted-foreground">
                  {description}
                </p>
              </CardContent>
            </Card>
          </article>
        ))}
      </div>
      {summary.totalLeads === 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-5 py-4">
          <p className="text-sm text-muted-foreground">
            {summary.scope === "mine"
              ? "No leads are currently assigned to you."
              : "Your agency has no leads yet."}{" "}
            Start with your lead workspace.
          </p>
          <Link
            href="/crm/leads"
            className="text-sm font-medium text-primary underline underline-offset-4"
          >
            Open leads
          </Link>
        </div>
      )}
      <DashboardCharts summary={summary} />
      <p className="text-xs leading-6 text-muted-foreground">
        Conversion shows current Won leads divided by all leads. Counts reflect
        current stages and assignments.
      </p>
    </div>
  );
}
