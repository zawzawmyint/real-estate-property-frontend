"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatCount, sourceCounts, stageCounts } from "./presentation";
import type { DashboardSummary } from "./types";

const chartConfig = { count: { label: "Leads", color: "var(--primary)" } };

function CountList({
  title,
  counts,
  horizontal,
}: {
  title: string;
  counts: { label: string; count: number }[];
  horizontal: boolean;
}) {
  return (
    <dl
      aria-label={`${title} counts`}
      className={`mt-7 grid gap-x-4 gap-y-4 border-t border-border/70 pt-5 ${horizontal ? "grid-cols-3 sm:grid-cols-6" : "grid-cols-3"}`}
    >
      {counts.map(({ label, count }) => (
        <div key={label} className="min-w-0">
          <dt
            className={`text-xs leading-5 text-muted-foreground ${horizontal ? "min-h-10" : ""}`}
          >
            {label}
          </dt>
          <dd className="mt-1 text-lg font-semibold tabular-nums">
            {formatCount(count)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function DistributionChart({
  id,
  title,
  description,
  counts,
  horizontal = false,
  empty,
}: {
  id: string;
  title: string;
  description: string;
  counts: { label: string; count: number }[];
  horizontal?: boolean;
  empty: boolean;
}) {
  return (
    <section aria-labelledby={id} className="min-w-0">
      <Card className="h-full gap-0 rounded-xl shadow-none">
        <CardContent className="min-w-0 px-5 sm:px-6">
          <h2 id={id} className="text-lg font-semibold tracking-tight">
            {title}
          </h2>
          <p className="mt-1 text-xs leading-6 text-muted-foreground">
            {description}
          </p>
          {empty ? (
            <div className="mt-5 flex h-64 items-center justify-center rounded-lg border border-dashed border-border bg-background px-5 text-center text-sm text-muted-foreground">
              No leads yet. Counts will appear here as leads are added.
            </div>
          ) : (
            <ChartContainer
              config={chartConfig}
              className="mt-5 h-64 w-full min-w-0 aspect-auto sm:h-72"
              aria-label={`${title} bar chart`}
            >
              <BarChart
                accessibilityLayer
                data={counts}
                layout={horizontal ? "vertical" : "horizontal"}
                margin={
                  horizontal
                    ? { top: 4, right: 30, bottom: 0, left: 0 }
                    : { top: 24, right: 12, bottom: 0, left: -20 }
                }
                barCategoryGap={horizontal ? "20%" : "24%"}
              >
                <CartesianGrid
                  vertical={horizontal}
                  horizontal={!horizontal}
                  stroke="var(--border)"
                  strokeOpacity={0.65}
                />
                {horizontal ? (
                  <>
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                    />
                    <YAxis
                      type="category"
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      width={128}
                      tick={{ fontSize: 12 }}
                    />
                  </>
                ) : (
                  <>
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={12}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                    />
                  </>
                )}
                <ChartTooltip
                  cursor={{ fill: "var(--muted)", fillOpacity: 0.5 }}
                  content={<ChartTooltipContent />}
                />
                <Bar
                  dataKey="count"
                  fill="var(--color-count)"
                  radius={horizontal ? [0, 3, 3, 0] : [3, 3, 0, 0]}
                  maxBarSize={horizontal ? 26 : 72}
                  isAnimationActive={false}
                >
                  <LabelList
                    dataKey="count"
                    position={horizontal ? "right" : "top"}
                    offset={9}
                    className="fill-foreground text-xs font-medium"
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          )}
          <CountList title={title} counts={counts} horizontal={horizontal} />
        </CardContent>
      </Card>
    </section>
  );
}

export function DashboardCharts({ summary }: { summary: DashboardSummary }) {
  return (
    <div className="grid min-w-0 gap-5 xl:grid-cols-2">
      <DistributionChart
        id="dashboard-sources"
        title="Leads by source"
        description={`${formatCount(summary.totalLeads)} total leads · All time`}
        counts={sourceCounts(summary.leadsBySource)}
        empty={summary.totalLeads === 0}
      />
      <DistributionChart
        id="dashboard-stages"
        title="Pipeline by stage"
        description="Current stages · All time"
        counts={stageCounts(summary.pipelineByStage)}
        horizontal
        empty={summary.totalLeads === 0}
      />
    </div>
  );
}
