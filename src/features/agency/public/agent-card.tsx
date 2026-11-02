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
    <article className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card">
      <AgentPortrait
        agent={agent}
        priority={priority}
        className="aspect-[7/6] [&_img]:object-top"
      />
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h2 className="display-heading text-2xl leading-tight break-words">
          <Link
            href={href}
            className="rounded-sm hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            {agent.name}
          </Link>
        </h2>
        <p className="mt-2 text-sm leading-6 break-words text-muted-foreground">
          {agent.title}
        </p>
        {agent.specialties.length > 0 && (
          <ul aria-label="Specialties" className="mt-4 flex flex-wrap gap-2">
            {agent.specialties.slice(0, 2).map((specialty) => (
              <li
                key={specialty}
                className="max-w-full rounded-md bg-muted px-2.5 py-1 text-xs leading-5 break-words text-foreground"
              >
                {specialty}
              </li>
            ))}
          </ul>
        )}
        {agent.languages?.length > 0 && (
          <p className="mt-4 text-sm leading-6 break-words text-muted-foreground">
            <span className="font-semibold">Languages:</span>{" "}
            {agent.languages.join(", ")}
          </p>
        )}
        <div className="flex-1" />
        <Link
          href={href}
          aria-label={`View profile: ${agent.name}`}
          className={buttonVariants({
            variant: "outline",
            className: "mt-6 w-full gap-3",
          })}
        >
          View profile <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}
