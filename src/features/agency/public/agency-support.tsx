import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";

export function AgencySupport() {
  return (
    <section
      aria-labelledby="agency-support-heading"
      className="mt-12 flex flex-col items-start justify-between gap-7 rounded-xl bg-primary p-6 text-primary-foreground sm:mt-16 sm:p-10 lg:flex-row lg:items-center"
    >
      <div className="max-w-xl">
        <p className="text-xs font-medium tracking-[0.16em] uppercase">
          Your next chapter
        </p>
        <h2
          id="agency-support-heading"
          className="display-heading mt-3 text-3xl sm:text-4xl"
        >
          Let’s start with what matters to you.
        </h2>
        <p className="mt-4 text-sm leading-7">
          Share what you’re looking for, or explore the agency’s property
          collection at your own pace.
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-3">
        <Link
          href="/contact"
          className={buttonVariants({
            variant: "outline",
            className: "border-transparent bg-card",
          })}
        >
          Contact the agency
        </Link>
        <Link
          href="/properties"
          className={buttonVariants({
            variant: "ghost",
            className: "text-primary-foreground hover:bg-primary-foreground/10",
          })}
        >
          Browse properties{" "}
          <span aria-hidden="true" className="ms-2">
            ↗
          </span>
        </Link>
      </div>
    </section>
  );
}
