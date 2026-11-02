import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  getPublicAgency,
  getPublicAgents,
} from "@/features/agency/data/queries";
import { AgentDirectory } from "@/features/agency/public/agent-directory";
import {
  AgentDirectoryLoading,
  ContactLoading,
} from "@/features/agency/public/agency-states";
import { DirectoryEnquiry } from "@/features/agency/public/directory-enquiry";

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
    <main id="main-content">
      <header className="bg-primary/5">
        <div className="public-container pb-8 pt-4 sm:pb-10 sm:pt-6">
          <nav
            aria-label="Breadcrumb"
            className="mb-6 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground"
          >
            <Link
              href="/"
              className="inline-flex min-h-11 items-center rounded-sm hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              Home
            </Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page" className="text-primary">
              Our agents
            </span>
          </nav>
          <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
            Our agents
          </p>
          <h1 className="display-heading mt-3 text-4xl leading-tight sm:text-5xl lg:text-6xl">
            People behind your next move.
          </h1>
          <p className="mt-4 leading-7 text-muted-foreground">
            Get to know our team, their specialties and their approach.
          </p>
        </div>
      </header>
      <div className="public-container pb-12 pt-7 sm:pb-16 sm:pt-9">
        <Suspense fallback={<AgentDirectoryLoading />}>
          <AgentDirectory />
        </Suspense>
        <div className="mt-10 sm:mt-12">
          <Suspense fallback={<ContactLoading presentation="directory" />}>
            <DirectoryEnquiry />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
