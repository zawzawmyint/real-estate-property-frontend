import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import type { PublicAgentSummary } from "../data/types";
import { AgentPortrait } from "./agent-portrait";

export function AgentCard({
  agent,
  priority = false,
}: {
  agent: PublicAgentSummary;
  priority?: boolean;
}) {
  const href = `/agents/${agent.slug}`;

  return (
    <article className="overflow-hidden rounded-xl border border-border bg-card">
      <AgentPortrait agent={agent} priority={priority} />
      <div className="p-5 sm:p-6">
        <h2 className="display-heading text-2xl leading-tight break-words">
          <Link
            href={href}
            className="rounded-sm hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            {agent.name}
          </Link>
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {agent.title}
        </p>
        {agent.specialties.length > 0 && (
          <ul aria-label="Specialties" className="mt-4 flex flex-wrap gap-2">
            {agent.specialties.slice(0, 2).map((specialty) => (
              <li
                key={specialty}
                className="rounded-md bg-background px-2.5 py-1 text-xs leading-5 text-primary"
              >
                {specialty}
              </li>
            ))}
          </ul>
        )}
        <Link
          href={href}
          aria-label={`View ${agent.name}’s profile`}
          className={buttonVariants({
            variant: "outline",
            className: "mt-6 w-full justify-between",
          })}
        >
          View profile <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </article>
  );
}
