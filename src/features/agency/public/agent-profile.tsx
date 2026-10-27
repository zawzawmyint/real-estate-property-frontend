import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import type { PublicAgentDetail } from "../data/types";
import { emailHref, phoneHref } from "../data/contact";
import { AgentPortrait } from "./agent-portrait";
import { DemoDisclosure } from "./agency-states";
import { AgencySupport } from "./agency-support";

export function AgentProfile({ agent }: { agent: PublicAgentDetail }) {
  const phone = phoneHref(agent.publicPhone);
  const email = emailHref(agent.publicEmail);
  const firstName = agent.name.trim().split(/\s+/)[0];

  return (
    <>
      <nav
        aria-label="Breadcrumb"
        className="mb-7 flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground"
      >
        <Link
          href="/agents"
          className="inline-flex min-h-11 items-center rounded-sm hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          Our agents
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{agent.name}</span>
      </nav>
      <article>
        <div className="grid items-start gap-6 md:grid-cols-[minmax(0,4fr)_minmax(0,5fr)] md:gap-x-10 md:gap-y-0 lg:gap-x-20">
          <div className="md:col-start-2 md:row-start-1 md:pt-5 lg:pt-10">
            <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
              Our agents
            </p>
            <h1 className="display-heading mt-4 text-4xl leading-tight break-words sm:text-5xl lg:text-6xl">
              {agent.name}
            </h1>
            <p className="mt-4 leading-7 text-primary">{agent.title}</p>
          </div>
          <AgentPortrait
            agent={agent}
            priority
            className="rounded-xl md:col-start-1 md:row-span-2 md:row-start-1"
          />
          <div className="md:col-start-2 md:row-start-2 md:mt-6">
            <p className="text-lg leading-8 text-muted-foreground">
              {agent.introduction}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              {phone && (
                <a
                  href={phone}
                  className={buttonVariants({ variant: "outline" })}
                >
                  Call {firstName}
                </a>
              )}
              {email && (
                <a
                  href={email}
                  className={buttonVariants({ variant: "outline" })}
                >
                  Email {firstName}
                </a>
              )}
              <Link href="/contact" className={buttonVariants()}>
                Send a property enquiry
              </Link>
            </div>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              {!phone && !email ? "Agency contact: " : "Property enquiries: "}
              The agency team receives your enquiry and coordinates follow-up.
              Enquiries are not assigned directly to this profile.
            </p>
            {agent.isDemo && (
              <div className="mt-7 border-t border-border pt-5">
                <DemoDisclosure />
              </div>
            )}
          </div>
        </div>
        <div className="mt-12 grid gap-10 border-t border-border pt-10 sm:mt-16 md:grid-cols-[minmax(0,5fr)_minmax(0,3fr)] lg:gap-20">
          <section aria-labelledby="agent-about-heading">
            <h2
              id="agent-about-heading"
              className="display-heading text-3xl sm:text-4xl"
            >
              About {firstName}
            </h2>
            <div className="mt-5 space-y-5 leading-8 text-muted-foreground">
              {agent.biography.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </section>
          <div className="space-y-8">
            {agent.specialties.length > 0 && (
              <section aria-labelledby="agent-specialties-heading">
                <h2
                  id="agent-specialties-heading"
                  className="text-sm font-semibold"
                >
                  Specialties
                </h2>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {agent.specialties.map((specialty) => (
                    <li
                      key={specialty}
                      className="rounded-md border border-border bg-card px-3 py-2 text-sm leading-6 text-primary"
                    >
                      {specialty}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {agent.languages.length > 0 && (
              <section aria-labelledby="agent-languages-heading">
                <h2
                  id="agent-languages-heading"
                  className="text-sm font-semibold"
                >
                  Spoken languages
                </h2>
                <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm leading-6 text-muted-foreground">
                  {agent.languages.map((language) => (
                    <li key={language}>{language}</li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>
      </article>
      <AgencySupport />
    </>
  );
}
