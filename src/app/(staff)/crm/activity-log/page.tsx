import { ActivityLogPage } from "@/features/activity-log/log-page";
import type { Query } from "@/features/activity-log/filters";

export default function Page({
  searchParams,
}: {
  searchParams: Promise<Query>;
}) {
  return <ActivityLogPage searchParams={searchParams} />;
}
