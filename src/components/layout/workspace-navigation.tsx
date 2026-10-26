"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";

const destinations = [
  ["/crm", "Overview", "overview"],
  ["/crm/properties", "Properties", "properties"],
] as const;

export function WorkspaceNavigation({
  showLabels = false,
}: {
  showLabels?: boolean;
}) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Workspace navigation"
      className={cn("flex gap-2", showLabels ? "flex-col" : "lg:flex-col")}
    >
      {destinations.map(([href, label, icon]) => {
        const active =
          href === "/crm"
            ? pathname === href
            : pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            aria-label={label}
            title={label}
            className={cn(
              "relative flex min-h-11 items-center rounded-lg text-sm font-medium transition-colors before:absolute before:inset-y-3 before:start-0 before:w-[3px] before:rounded-full",
              showLabels ? "gap-3 px-4 py-3" : "size-11 justify-center",
              active
                ? "bg-muted text-primary before:bg-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon name={icon} />
            {showLabels && <span>{label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
