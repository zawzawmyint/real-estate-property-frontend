import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button-variants";
import { AgencyInquiryCard } from "@/features/leads/public/agency-inquiry-card";
import { getPublicAgency } from "../data/queries";
import type { PublicAgency } from "../data/types";
import { emailHref, mapHref, phoneHref } from "../data/contact";
import { AgencyRetry } from "./agency-retry";
import { ContactIllustration } from "./contact-illustration";
import { ContactIntroduction } from "./contact-introduction";

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
  const hasOffice = Boolean(
    agency?.address || agency?.officeHours.length || map,
  );

  return (
    <div className="agency-contact-layout">
      <ContactIntroduction>
        {agency && hasDirectContact && (
          <section
            aria-labelledby="direct-contact-heading"
            className="mt-8 border-t border-white/30 pt-6"
          >
            <h2
              id="direct-contact-heading"
              className="display-heading text-2xl"
            >
              A conversation starts here.
            </h2>
            <dl className="mt-4 space-y-4 text-sm leading-7">
              {phone && (
                <div>
                  <dt className="text-white/75">Call the agency</dt>
                  <dd>
                    <a
                      href={phone}
                      className="inline-flex min-h-11 items-center break-all underline underline-offset-4"
                    >
                      {agency.phone}
                    </a>
                  </dd>
                </div>
              )}
              {email && (
                <div>
                  <dt className="text-white/75">Email the agency</dt>
                  <dd>
                    <a
                      href={email}
                      className="inline-flex min-h-11 items-center break-all underline underline-offset-4"
                    >
                      {agency.email}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </section>
        )}
      </ContactIntroduction>
      <div className="agency-contact-form">
        <nav
          aria-label="Breadcrumb"
          className="mb-9 flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
        >
          <Link
            href="/"
            className="inline-flex min-h-11 items-center hover:text-primary"
          >
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page" className="text-primary">
            Contact
          </span>
        </nav>
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
        ) : agency.isDemo ? (
          <p className="mb-6 text-sm leading-6 text-muted-foreground">
            <span className="font-medium text-primary">Demo agency.</span> This
            is a demonstration website.{" "}
            {hasDirectContact || hasOffice
              ? "Contact information is sample content."
              : "Public phone, email and office details have not been published."}{" "}
            Use sample contact details when trying the enquiry form.
          </p>
        ) : null}
        <AgencyInquiryCard
          key="agency-inquiry"
          presentation="contact"
          isDemo={agency?.isDemo ?? null}
          showDemoNotice={false}
        />
      </div>
      <div className="agency-contact-media">
        <ContactIllustration />
        {agency && hasOffice && (
          <section
            aria-labelledby="office-heading"
            className="mt-7 border-t border-white/30 pt-6 text-sm leading-7"
          >
            <h2 id="office-heading" className="display-heading text-2xl">
              {agency.address
                ? "Visit our office"
                : agency.officeHours.length
                  ? "Office hours"
                  : "Office location"}
            </h2>
            {agency.address && (
              <p className="mt-3 whitespace-pre-line">{agency.address}</p>
            )}
            {agency.officeHours.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-white/75">
                  Dubai time · {agency.timeZone}
                </p>
                <dl className="mt-3 space-y-2">
                  {agency.officeHours.map((entry) => (
                    <div
                      key={entry.days}
                      className="flex flex-wrap justify-between gap-x-4"
                    >
                      <dt>{entry.days}</dt>
                      <dd>{entry.hours}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
            {map && (
              <a
                href={map}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({
                  variant: "outline",
                  tone: "inverse",
                  className: "mt-5",
                })}
              >
                Open map <span className="sr-only">(opens in a new tab)</span>
                <span aria-hidden="true" className="ms-2">
                  ↗
                </span>
              </a>
            )}
          </section>
        )}
        <Link
          href="/agents"
          className={buttonVariants({
            variant: "outline",
            tone: "inverse",
            className: "mt-6",
          })}
        >
          Meet our agents{" "}
          <span aria-hidden="true" className="ms-3">
            →
          </span>
        </Link>
      </div>
    </div>
  );
}
