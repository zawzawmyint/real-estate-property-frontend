"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useClientReady } from "@/lib/use-client-ready";
import { Icon } from "@/components/ui/icon";

function CloseAfterNavigation({ close }: { close: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const destination = `${pathname}?${searchParams}`;
  const previous = useRef(destination);

  useEffect(() => {
    if (previous.current !== destination) close();
    previous.current = destination;
  }, [destination, close]);

  return null;
}

/** The public and staff menus share dismissal and breakpoint behaviour. */
export function NavigationDrawer({
  title,
  desktopQuery,
  children,
  heading,
  triggerLabel = "Menu",
  triggerIcon = "menu",
  description = "Find your way around Avenor.",
}: {
  title: string;
  desktopQuery: string;
  children: React.ReactNode;
  heading?: React.ReactNode;
  triggerLabel?: string;
  triggerIcon?: "menu" | "user";
  description?: string;
}) {
  const ready = useClientReady();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const media = window.matchMedia(desktopQuery);
    const closeOnDesktop = () => {
      if (media.matches) setOpen(false);
    };

    media.addEventListener("change", closeOnDesktop);
    return () => media.removeEventListener("change", closeOnDesktop);
  }, [desktopQuery]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Suspense fallback={null}>
        <CloseAfterNavigation close={close} />
      </Suspense>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            disabled={!ready}
            title={triggerLabel}
            aria-label={triggerLabel}
          />
        }
      >
        <Icon name={triggerIcon} />
      </SheetTrigger>
      <SheetContent
        side="left"
        style={{ width: "min(320px, calc(100vw - 32px))" }}
        className="gap-0 overflow-y-auto motion-reduce:transition-none"
      >
        <SheetHeader className="shrink-0 border-b border-border px-6 py-7 pe-14">
          {heading}
          <SheetTitle className={heading ? "sr-only" : undefined}>
            {title}
          </SheetTitle>
          <SheetDescription className={heading ? "sr-only" : undefined}>
            {description}
          </SheetDescription>
        </SheetHeader>
        <div
          className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4"
          onClick={(event) => {
            if (!(event.target instanceof Element)) return;
            const anchor = event.target.closest<HTMLAnchorElement>("a[href]");
            if (
              !anchor ||
              event.metaKey ||
              event.ctrlKey ||
              event.shiftKey ||
              event.altKey
            )
              return;
            const target = new URL(anchor.href);
            // Keep the pending Link mounted until the destination commits.
            // A link to this same page still dismisses the menu immediately.
            if (
              target.pathname === window.location.pathname &&
              target.search === window.location.search
            )
              close();
          }}
        >
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
