import { z } from "zod";
import type { DashboardSummary } from "./types";

const count = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const source = <T extends string>(value: T) =>
  z.strictObject({ source: z.literal(value), count });
const stage = <T extends string>(value: T) =>
  z.strictObject({ stage: z.literal(value), count });

export const dashboardSchema = z
  .strictObject({
    generatedAt: z.iso.datetime(),
    scope: z.enum(["agency", "mine"]),
    timezone: z.literal("Asia/Dubai"),
    weekStart: z.iso.datetime(),
    weekEndExclusive: z.iso.datetime(),
    totalLeads: count,
    newLeadsThisWeek: count,
    wonLeads: count,
    conversionRatePercent: z
      .number()
      .min(0)
      .max(100)
      .multipleOf(0.1)
      .nullable(),
    leadsBySource: z.tuple([
      source("website"),
      source("call"),
      source("walk_in"),
    ]),
    pipelineByStage: z.tuple([
      stage("new"),
      stage("contacted"),
      stage("viewing_scheduled"),
      stage("offer"),
      stage("won"),
      stage("lost"),
    ]),
  })
  .refine((summary) => {
    // Verify contract consistency, while Express remains the aggregation owner.
    const generated = Date.parse(summary.generatedAt);
    return (
      Date.parse(summary.weekStart) <= generated &&
      generated < Date.parse(summary.weekEndExclusive) &&
      summary.newLeadsThisWeek <= summary.totalLeads &&
      summary.wonLeads <= summary.totalLeads &&
      (summary.conversionRatePercent === null) === (summary.totalLeads === 0) &&
      summary.leadsBySource.reduce((sum, item) => sum + item.count, 0) ===
        summary.totalLeads &&
      summary.pipelineByStage.reduce((sum, item) => sum + item.count, 0) ===
        summary.totalLeads &&
      summary.pipelineByStage[4].count === summary.wonLeads
    );
  }, "Inconsistent dashboard snapshot") satisfies z.ZodType<DashboardSummary>;
