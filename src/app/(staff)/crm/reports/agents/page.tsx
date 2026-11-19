import type { Metadata } from "next";
import { AgentPerformancePage } from "@/features/reports/agent-performance/report-page";
import type { ReportSearchParams } from "@/features/reports/agent-performance/filters";

export const metadata: Metadata = {
  title: "Agent performance · Agency workspace",
  robots: { index: false, follow: false },
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<ReportSearchParams>;
}) {
  return <AgentPerformancePage searchParams={await searchParams} />;
}
