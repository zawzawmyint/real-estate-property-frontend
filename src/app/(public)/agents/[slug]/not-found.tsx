import Link from "next/link";
import { PublicSectionHeader } from "@/components/layout/public-section-header";
import { buttonVariants } from "@/components/ui/button-variants";

export default function AgentNotFound() {
  return (
    <main id="main-content" className="public-container py-16 sm:py-24">
      <PublicSectionHeader
        level={1}
        eyebrow="Profile not found"
        title="This profile isn’t available."
        description="The profile may have moved or is no longer published. Explore the public team or contact the agency."
        className="max-w-2xl"
      />
      <div className="flex flex-wrap gap-3">
        <Link href="/agents" className={buttonVariants()}>
          Our agents
        </Link>
        <Link
          href="/contact"
          className={buttonVariants({ variant: "outline" })}
        >
          Contact Avenor
        </Link>
      </div>
    </main>
  );
}
