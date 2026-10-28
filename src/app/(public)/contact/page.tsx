import type { Metadata } from "next";
import { Suspense } from "react";
import { PublicSectionHeader } from "@/components/layout/public-section-header";
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
    <main
      id="main-content"
      className="public-container py-10 sm:py-14 lg:py-16"
    >
      <PublicSectionHeader
        level={1}
        eyebrow="Contact Avenor"
        title={
          <>
            Your next move
            <br />
            starts with a conversation.
          </>
        }
        description="Buying or renting? Tell us what you have in mind."
        className="max-w-3xl sm:mb-10"
      />
      <Suspense fallback={<ContactLoading />}>
        <ContactContent />
      </Suspense>
    </main>
  );
}
