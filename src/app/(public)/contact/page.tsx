import type { Metadata } from "next";
import { Suspense } from "react";
import { ContactContent } from "@/features/agency/public/contact-content";
import { ContactLoading } from "@/features/agency/public/agency-states";
import { getPublicAgency } from "@/features/agency/data/queries";

export async function generateMetadata(): Promise<Metadata> {
  const agency = await getPublicAgency().catch(() => null);
  return {
    title: "Contact",
    description:
      "Tell Avenor Properties what you’re looking for. Send a buying or renting enquiry to the agency.",
    robots:
      agency && !agency.isDemo ? undefined : { index: false, follow: true },
  };
}

export default function ContactPage() {
  return (
    <main id="main-content">
      <Suspense fallback={<ContactLoading />}>
        <ContactContent />
      </Suspense>
    </main>
  );
}
