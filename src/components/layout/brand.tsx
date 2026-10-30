import Link from "next/link";
import { NavigationPending } from "@/components/ui/navigation-pending";

export function Brand({
  compact = false,
  inverse = false,
}: {
  compact?: boolean;
  inverse?: boolean;
}) {
  return (
    <Link
      href="/"
      className={`inline-flex shrink-0 items-center gap-2.5 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring ${inverse ? "brand-inverse" : ""}`}
      aria-label="Avenor Properties home"
    >
      <NavigationPending />
      {/* A static vector logo keeps the mark crisp without an image runtime. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/avenor-mark.svg"
        width="44"
        height="44"
        alt=""
        aria-hidden="true"
        className="size-10 sm:size-11"
      />
      {!compact && (
        <span className="flex flex-col gap-1">
          <span className="font-display text-[22px] leading-none tracking-[0.12em] text-foreground sm:text-[24px]">
            AVENOR
          </span>
          <span className="text-[9px] font-medium leading-none tracking-[0.36em] text-primary sm:text-[10px]">
            PROPERTIES
          </span>
        </span>
      )}
    </Link>
  );
}
