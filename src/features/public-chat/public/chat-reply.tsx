import Link from "next/link";
import { useEffect, useState } from "react";
import {
  formatBedrooms,
  formatPrice,
} from "@/features/properties/data/filters";
import type { PublicChatReply } from "../data/schema";

const linkClass =
  "inline-flex min-h-11 items-center font-medium underline underline-offset-4";

function ReplyText({
  message,
  animate,
}: {
  message: string;
  animate: boolean;
}) {
  const words = message.match(/\S+\s*/g) ?? [];
  const [visibleWords, setVisibleWords] = useState(1);
  const wordCount = words.length;
  const revealing = animate && visibleWords < wordCount;

  useEffect(() => {
    if (!animate || wordCount < 2) return;

    let count = 1;
    const interval = window.setInterval(
      () => {
        count += 1;
        setVisibleWords(count);
        if (count === wordCount) window.clearInterval(interval);
      },
      Math.min(45, 2200 / (wordCount - 1)),
    );

    return () => window.clearInterval(interval);
  }, [animate, wordCount]);

  return (
    <p className="relative whitespace-pre-line [overflow-wrap:anywhere]">
      <span className={revealing ? "motion-safe:opacity-0" : undefined}>
        {message}
      </span>
      {revealing && (
        <span
          aria-hidden="true"
          className="absolute inset-0 motion-reduce:hidden"
        >
          {words.slice(0, visibleWords).join("")}
        </span>
      )}
    </p>
  );
}

export function ChatReply({
  reply,
  animate,
  onNavigate,
}: {
  reply: PublicChatReply;
  animate: boolean;
  onNavigate: () => void;
}) {
  return (
    <div className="grid gap-2">
      <ReplyText message={reply.message} animate={animate} />
      {reply.sources.length > 0 && (
        <ul aria-label="Sources" className="text-xs text-muted-foreground">
          {reply.sources.map((source) => (
            <li key={source.id}>
              <Link
                href={source.path}
                onNavigate={onNavigate}
                className={linkClass}
              >
                Source · {source.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
      {reply.properties.length > 0 && (
        <ul
          aria-label="Matching properties"
          className="grid gap-2 @lg:grid-cols-2"
        >
          {reply.properties.map((property) => {
            const href = `/properties/${property.id}`;
            const purpose = property.purpose === "rent" ? "Rental" : "For sale";
            return (
              <li
                key={property.id}
                className="grid gap-1 rounded-xl border border-border bg-card px-3 py-2.5"
              >
                <p className="text-[0.6875rem] tracking-wider text-muted-foreground uppercase">
                  {property.isDemo ? "Demo · " : ""}
                  {purpose} · {property.community}
                </p>
                <p className="font-semibold [overflow-wrap:anywhere]">
                  {property.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatBedrooms(property.bedrooms)} ·{" "}
                  {formatPrice(property.priceFils, property.purpose)}
                </p>
                <div className="flex flex-wrap gap-x-3 text-xs">
                  <Link
                    href={href}
                    onNavigate={onNavigate}
                    className={linkClass}
                  >
                    View property
                  </Link>
                  <Link
                    href={`${href}#inquiry-heading`}
                    onNavigate={onNavigate}
                    className={linkClass}
                  >
                    Request a viewing
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {(reply.kind === "no_answer" ||
        (reply.kind === "properties" && reply.properties.length === 0)) && (
        <ChatFallbackLinks onNavigate={onNavigate} />
      )}
    </div>
  );
}

export function ChatFallbackLinks({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="flex flex-wrap gap-x-3 text-xs">
      <Link href="/properties" onNavigate={onNavigate} className={linkClass}>
        Browse listings
      </Link>
      <Link href="/contact" onNavigate={onNavigate} className={linkClass}>
        Contact Avenor
      </Link>
    </div>
  );
}
