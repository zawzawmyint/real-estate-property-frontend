import type { Metadata } from "next";
import { Suspense } from "react";
import {
  DashboardLoading,
  DashboardResults,
} from "@/features/dashboard/dashboard-results";

export const metadata: Metadata = {
  title: "Agency overview",
  robots: { index: false, follow: false },
};

export default function CrmPage() {
  return (
    <main
      id="main-content"
      className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-10"
    >
      <Suspense fallback={<DashboardLoading />}>
        <DashboardResults />
      </Suspense>
    </main>
  );
}
