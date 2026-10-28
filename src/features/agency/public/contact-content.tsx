import Link from "next/link";
import { PublicSectionHeader } from "@/components/layout/public-section-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button-variants";
import { AgencyInquiryCard } from "@/features/leads/public/agency-inquiry-card";
import { getPublicAgency } from "../data/queries";
import type { PublicAgency } from "../data/types";
import { emailHref, mapHref, phoneHref } from "../data/contact";
import { AgencyRetry } from "./agency-retry";

export async function ContactContent() {
  let agency: PublicAgency | null;
  try {
    agency = await getPublicAgency();
  } catch {
    agency = null;
  }

  const phone = phoneHref(agency?.phone ?? null);
  const email = emailHref(agency?.email ?? null);
  const map = mapHref(agency?.mapUrl ?? null);
  const hasDirectContact = Boolean(phone || email);
  const hasOffice = Boolean(agency?.address || agency?.officeHours.length);

  return (
    <div>
      {agency === null ? (
        <Alert className="mb-7">
          <AlertDescription>
            Agency contact details are temporarily unavailable. You can still
            send an enquiry using the form below.
            <div>
              <AgencyRetry />
            </div>
          </AlertDescription>
        </Alert>
      ) : (
        agency.isDemo && (
          <p className="mb-7 rounded-lg border border-border px-4 py-3 text-sm leading-6 text-muted-foreground">
            <span className="font-medium text-primary">Demo agency.</span> This
            is a demonstration website.{" "}
            {hasDirectContact
              ? "Contact information is sample content."
              : "Public phone, email and office details have not been published."}{" "}
            Use sample contact details when trying the enquiry form.
          </p>
        )
      )}
      <div
        key="contact-enquiry-layout"
        className={
          hasDirectContact
            ? "grid items-start gap-8 lg:grid-cols-[5fr_7fr] lg:gap-16"
            : "min-w-0"
        }
      >
        {agency && hasDirectContact && (
          <section
            aria-labelledby="direct-contact-heading"
            className="min-w-0 py-2"
          >
            <PublicSectionHeader
              level={2}
              id="direct-contact-heading"
              title="A conversation starts here."
              description="Choose the way that works for you."
            />
            <dl className="divide-y divide-border border-y border-border">
              {phone && (
                <div className="py-5">
                  <dt className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                    Call the agency
                  </dt>
                  <dd className="mt-2">
                    <a
                      href={phone}
                      className="inline-flex min-h-11 items-center rounded-sm text-lg break-all text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                    >
                      {agency.phone}
                    </a>
                  </dd>
                </div>
              )}
              {email && (
                <div className="py-5">
                  <dt className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                    Email the agency
                  </dt>
                  <dd className="mt-2">
                    <a
                      href={email}
                      className="inline-flex min-h-11 items-center rounded-sm break-all text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                    >
                      {agency.email}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </section>
        )}
        <AgencyInquiryCard
          key="agency-inquiry"
          isDemo={agency?.isDemo ?? null}
          showDemoNotice={false}
        />
      </div>
      {agency && hasOffice && (
        <section
          aria-labelledby="office-heading"
          className={`mt-10 grid gap-8 rounded-xl border border-border bg-card p-6 sm:p-8${agency.address && agency.officeHours.length ? " md:grid-cols-2" : ""}`}
        >
          {agency.address && (
            <div>
              <h2 id="office-heading" className="display-heading text-3xl">
                Visit our office
              </h2>
              <p className="mt-4 leading-7 whitespace-pre-line text-muted-foreground">
                {agency.address}
              </p>
              {map && (
                <a
                  href={map}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({
                    variant: "outline",
                    className: "mt-5",
                  })}
                >
                  Open map <span className="sr-only">(opens in a new tab)</span>
                  <span aria-hidden="true" className="ms-2">
                    ↗
                  </span>
                </a>
              )}
            </div>
          )}
          {agency.officeHours.length > 0 && (
            <div>
              <h2
                id={agency.address ? undefined : "office-heading"}
                className="display-heading text-3xl"
              >
                Office hours
              </h2>
              <p className="mt-2 text-xs text-muted-foreground">
                Dubai time · {agency.timeZone}
              </p>
              <dl className="mt-4 space-y-3">
                {agency.officeHours.map((entry) => (
                  <div
                    key={entry.days}
                    className="flex flex-wrap justify-between gap-x-6 gap-y-1 text-sm leading-6"
                  >
                    <dt>{entry.days}</dt>
                    <dd className="text-muted-foreground">{entry.hours}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </section>
      )}
      <section
        aria-labelledby="contact-context-heading"
        className="mt-12 grid items-start gap-6 border-t border-border pt-9 sm:mt-16 md:grid-cols-[1fr_auto]"
      >
        <div className="max-w-2xl">
          <h2 id="contact-context-heading" className="display-heading text-3xl">
            A little context goes a long way.
          </h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            Tell us whether you’re buying or renting, the areas you have in
            mind, and what would make a place feel like home. You don’t need to
            have chosen a property to get in touch.
          </p>
        </div>
        <Link href="/agents" className={buttonVariants({ variant: "outline" })}>
          Meet our agents{" "}
          <span aria-hidden="true" className="ms-3">
            ↗
          </span>
        </Link>
      </section>
    </div>
  );
}
