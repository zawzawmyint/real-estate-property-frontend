import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicSectionHeader } from "@/components/layout/public-section-header";
import { ApiError } from "@/lib/api/transport";
import {
  getPublicAgent,
  getPublicAgency,
} from "@/features/agency/data/queries";
import { AgentProfile } from "@/features/agency/public/agent-profile";
import { AgencyUnavailable } from "@/features/agency/public/agency-states";

type Props = { params: Promise<{ slug: string }> };

async function readProfile(slug: string) {
  try {
    return await getPublicAgent(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [agent, agency] = await Promise.all([
    readProfile(slug),
    getPublicAgency().catch(() => null),
  ]);
  return {
    title: agent ? `${agent.name} — Our agents` : "Agent profile unavailable",
    description:
      agent?.introduction ??
      "This public agent profile is temporarily unavailable. Contact Avenor Properties for property enquiries.",
    robots:
      agent && agency && !agency.isDemo && !agent.isDemo
        ? undefined
        : { index: false, follow: true },
  };
}

export default async function AgentPage({ params }: Props) {
  const { slug } = await params;
  // Resolve publication before rendering a stream boundary, preserving a real 404.
  const agent = await readProfile(slug);

  return (
    <main
      id="main-content"
      className="public-container pb-12 pt-6 sm:pb-16 sm:pt-8"
    >
      {agent ? (
        <AgentProfile agent={agent} />
      ) : (
        <>
          <PublicSectionHeader level={1} title="Agent profile unavailable" />
          <AgencyUnavailable profile />
        </>
      )}
    </main>
  );
}
