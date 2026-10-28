import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PublicSectionHeader } from "@/components/layout/public-section-header";
import { buttonVariants } from "@/components/ui/button-variants";
import {
  getPublicAgency,
  getPublicAgents,
} from "@/features/agency/data/queries";
import { AgentDirectory } from "@/features/agency/public/agent-directory";
import { AgentDirectoryLoading } from "@/features/agency/public/agency-states";
import { AgencySupport } from "@/features/agency/public/agency-support";

export async function generateMetadata(): Promise<Metadata> {
  const [agency, directory] = await Promise.all([
    getPublicAgency().catch(() => null),
    getPublicAgents().catch(() => null),
  ]);
  return {
    title: "Our agents",
    description:
      "Meet the public team at Avenor Properties. Explore their interests, specialties and approach to your next move.",
    robots:
      agency &&
      directory &&
      !agency.isDemo &&
      !directory.items.some((agent) => agent.isDemo)
        ? undefined
        : { index: false, follow: true },
  };
}

export default function AgentsPage() {
  return (
    <main
      id="main-content"
      className="public-container py-10 sm:py-14 lg:py-16"
    >
      <div className="mb-9 flex flex-wrap items-end justify-between gap-6 sm:mb-11">
        <PublicSectionHeader
          level={1}
          eyebrow="Our agents"
          title={
            <>
              Meet the people behind
              <br />
              your next move.
            </>
          }
          description="Get to know the people, their specialties and their approach."
          className="mb-0 max-w-3xl"
        />
        <Link
          href="/contact"
          className={buttonVariants({ variant: "outline" })}
        >
          Contact Avenor{" "}
          <span aria-hidden="true" className="ms-3">
            ↗
          </span>
        </Link>
      </div>
      <Suspense fallback={<AgentDirectoryLoading />}>
        <AgentDirectory />
      </Suspense>
      <AgencySupport />
    </main>
  );
}
