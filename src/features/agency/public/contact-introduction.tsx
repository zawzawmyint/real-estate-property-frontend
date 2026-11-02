import type { ReactNode } from "react";

export function ContactIntroduction({ children }: { children?: ReactNode }) {
  return (
    <section className="agency-contact-intro" aria-labelledby="contact-heading">
      <p className="text-xs font-semibold tracking-[0.18em] uppercase">
        Contact Avenor
      </p>
      <h1 id="contact-heading" className="display-heading">
        Tell us what home means to you.
      </h1>
      <p className="mt-6 text-lg leading-8">
        Buying or renting, your next move starts with a conversation.
      </p>
      <p className="mt-6 text-sm leading-7 text-white/85">
        Whether you’re exploring Dubai for a new home or considering a change,
        tell us your preferred areas and what matters most to you.
      </p>
      {children}
    </section>
  );
}
