import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import type { PublicAgentDetail } from "../data/types";
import { emailHref, phoneHref } from "../data/contact";
import { AgentPortrait } from "./agent-portrait";
import { DemoDisclosure } from "./agency-states";

export function AgentProfile({ agent }: { agent: PublicAgentDetail }) {
  const phone = phoneHref(agent.publicPhone);
  const email = emailHref(agent.publicEmail);
  const firstName = agent.name.trim().split(/\s+/)[0];
  const breadcrumbLink =
    "inline-flex min-h-11 items-center rounded-sm hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring";

  return (
    <article>
      <header className="bg-primary/5">
        <div className="public-container pb-9 pt-4 sm:pb-12 sm:pt-6">
          <nav
            aria-label="Breadcrumb"
            className="mb-7 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground"
          >
            <Link href="/" className={breadcrumbLink}>
              Home
            </Link>
            <span aria-hidden="true">/</span>
            <Link href="/agents" className={breadcrumbLink}>
              Our agents
            </Link>
            <span aria-hidden="true">/</span>
            <span
              aria-current="page"
              className="min-w-0 break-words text-primary"
            >
              {agent.name}
            </span>
          </nav>
          <h1 className="display-heading text-5xl leading-tight break-words sm:text-6xl lg:text-7xl">
            {agent.name}
          </h1>
          <p className="mt-4 text-lg leading-7 break-words text-primary sm:text-2xl">
            {agent.title}
          </p>
          {agent.isDemo && (
            <div className="mt-5 max-w-3xl">
              <DemoDisclosure />
            </div>
          )}
        </div>
      </header>
      <div className="public-container pb-12 pt-9 sm:pb-16 sm:pt-12">
        <div className="grid items-start gap-9 lg:grid-cols-[minmax(0,2fr)_minmax(0,4fr)_minmax(0,3fr)] lg:gap-7 xl:gap-9">
          <aside
            aria-label="Agent specialties and languages"
            className="min-w-0 space-y-7 lg:pe-6"
          >
            {agent.specialties.length > 0 && (
              <section aria-labelledby="agent-specialties-heading">
                <h2
                  id="agent-specialties-heading"
                  className="text-xs font-semibold tracking-[0.18em] text-primary uppercase"
                >
                  Specialties
                </h2>
                <ul className="mt-5 space-y-2 text-sm leading-7 break-words">
                  {agent.specialties.map((specialty) => (
                    <li key={specialty}>{specialty}</li>
                  ))}
                </ul>
              </section>
            )}
            {agent.languages.length > 0 && (
              <section
                aria-labelledby="agent-languages-heading"
                className="border-t border-border pt-7"
              >
                <h2
                  id="agent-languages-heading"
                  className="text-xs font-semibold tracking-[0.18em] text-primary uppercase"
                >
                  Spoken languages
                </h2>
                <ul className="mt-5 space-y-2 text-sm leading-7 break-words">
                  {agent.languages.map((language) => (
                    <li key={language}>{language}</li>
                  ))}
                </ul>
              </section>
            )}
            <div className="border-t border-border pt-7">
              <Link
                href="/agents"
                className={buttonVariants({
                  variant: "outline",
                  className: "w-full",
                })}
              >
                Meet the team
              </Link>
            </div>
          </aside>
          <section
            aria-labelledby="agent-about-heading"
            className="min-w-0 lg:border-x lg:border-border lg:px-7 xl:px-9"
          >
            <h2 id="agent-about-heading" className="sr-only">
              About {firstName}
            </h2>
            <p className="display-heading text-3xl leading-snug break-words sm:text-4xl">
              {agent.introduction}
            </p>
            <div className="mt-7 space-y-5 text-sm leading-7 break-words text-muted-foreground sm:text-base sm:leading-8">
              {agent.biography.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
            <Link
              href="/contact"
              className={buttonVariants({ className: "mt-8 max-w-full gap-3" })}
            >
              Send a property enquiry <span aria-hidden="true">→</span>
            </Link>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              {!phone && !email ? "Agency contact: " : "Property enquiries: "}
              The agency team receives your enquiry and coordinates follow-up.
              Enquiries are not assigned directly to this profile.
            </p>
            {(phone || email) && (
              <div className="mt-6 flex flex-wrap gap-3">
                {phone && (
                  <a
                    href={phone}
                    className={buttonVariants({
                      variant: "outline",
                      className: "min-w-0 max-w-full break-all",
                    })}
                  >
                    Call {firstName}
                  </a>
                )}
                {email && (
                  <a
                    href={email}
                    className={buttonVariants({
                      variant: "outline",
                      className: "min-w-0 max-w-full break-all",
                    })}
                  >
                    Email {firstName}
                  </a>
                )}
              </div>
            )}
          </section>
          <AgentPortrait
            agent={agent}
            priority
            className="w-full rounded-lg lg:aspect-[4/7]"
          />
        </div>
        <p className="display-heading mt-10 border-t border-border pt-8 text-3xl leading-snug text-primary italic sm:mt-12 sm:pt-10 sm:text-4xl lg:text-5xl">
          A home is more than a place — it’s the foundation for the life you
          want to build in Dubai.
        </p>
      </div>
    </article>
  );
}
