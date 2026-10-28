import Link from "next/link";
import { getPublicAgents } from "../data/queries";
import { buttonVariants } from "@/components/ui/button-variants";
import { AgentCard } from "./agent-card";
import { AgencyUnavailable, DemoDisclosure } from "./agency-states";

export async function AgentDirectory() {
  let directory;
  try {
    directory = await getPublicAgents();
  } catch {
    return <AgencyUnavailable />;
  }

  if (directory.items.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card px-6 py-12 text-center sm:p-16">
        <h2 className="display-heading text-3xl">
          Our team profiles are being prepared.
        </h2>
        <p className="mx-auto mt-4 max-w-lg leading-7 text-muted-foreground">
          There are no public profiles available at the moment. You can still
          send a buying or renting enquiry to the agency.
        </p>
        <Link href="/contact" className={buttonVariants({ className: "mt-6" })}>
          Contact Avenor
        </Link>
      </div>
    );
  }

  return (
    <>
      {directory.items.some((agent) => agent.isDemo) && (
        <div className="mb-6 rounded-lg border border-border px-4 py-3">
          <DemoDisclosure />
        </div>
      )}
      <div className="grid items-start gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {directory.items.map((agent, index) => (
          <AgentCard key={agent.slug} agent={agent} priority={index === 0} />
        ))}
      </div>
    </>
  );
}
