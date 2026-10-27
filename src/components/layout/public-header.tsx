"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Brand } from "@/components/layout/brand";
import { NavigationDrawer } from "@/components/layout/navigation-drawer";
import { cn } from "@/lib/utils";
import { NavigationPending } from "@/components/ui/navigation-pending";

function PublicLinks({
  purpose,
  pathname,
}: {
  purpose?: string;
  pathname?: string;
}) {
  return (
    <nav
      aria-label="Main navigation"
      className="flex flex-col gap-2 md:flex-row md:items-center md:gap-1"
    >
      {[
        ["sale", "Buy"],
        ["rent", "Rent"],
      ].map(([value, label]) => (
        <Link
          key={value}
          href={`/properties?purpose=${value}`}
          aria-current={purpose === value ? "page" : undefined}
          aria-label={label}
          title={label}
          className={cn(
            "inline-flex min-h-11 items-center justify-center rounded-lg px-4 text-sm font-medium transition-colors hover:bg-muted hover:text-primary",
            purpose === value &&
              "bg-muted text-primary ring-1 ring-inset ring-primary",
          )}
        >
          {label}
          <NavigationPending />
        </Link>
      ))}
      {(
        [
          ["/agents", "Our agents"],
          ["/contact", "Contact"],
        ] as const
      ).map(([href, label]) => {
        const active =
          pathname === href ||
          (href === "/agents" && pathname?.startsWith("/agents/"));

        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 items-center justify-center rounded-lg px-4 text-sm font-medium transition-colors hover:bg-muted hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring",
              active && "bg-muted text-primary ring-1 ring-inset ring-primary",
            )}
          >
            {label}
            <NavigationPending />
          </Link>
        );
      })}
    </nav>
  );
}

function PublicNavigation() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return (
    <PublicLinks
      pathname={pathname}
      purpose={
        pathname === "/properties"
          ? (searchParams.get("purpose") ?? undefined)
          : undefined
      }
    />
  );
}

export function PublicHeader() {
  const links = (
    <Suspense fallback={<PublicLinks />}>
      <PublicNavigation />
    </Suspense>
  );

  return (
    <header className="border-b border-border bg-card">
      <div className="public-container flex min-h-[72px] items-center justify-between gap-4 py-3 md:min-h-20">
        <Brand />
        <div className="hidden md:block">{links}</div>
        <div className="md:hidden">
          <NavigationDrawer
            title="Explore Avenor"
            desktopQuery="(min-width: 768px)"
          >
            {links}
          </NavigationDrawer>
        </div>
      </div>
    </header>
  );
}
