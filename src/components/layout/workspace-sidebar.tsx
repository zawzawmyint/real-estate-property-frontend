import Link from "next/link";
import { WorkspaceNavigation } from "@/components/layout/workspace-navigation";
import { Icon } from "@/components/ui/icon";
import { StaffAccount } from "@/features/auth/staff-account";
import { cn } from "@/lib/utils";

export function WorkspaceSidebar({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto",
        compact && "items-center",
      )}
    >
      <div className="flex-1">
        <p className="sr-only">Workspace</p>
        <WorkspaceNavigation showLabels={!compact} />
      </div>
      <div
        className={cn(
          "space-y-4 border-t border-border pt-4",
          compact && "flex flex-col items-center",
        )}
      >
        <Link
          href="/"
          aria-label="View website"
          title="View website"
          className={cn(
            "flex min-h-11 items-center rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-primary",
            compact ? "size-11 justify-center" : "gap-3 px-4",
          )}
        >
          <Icon name="external" />
          {!compact && <span>View website</span>}
        </Link>
        <StaffAccount compact={compact} />
      </div>
    </div>
  );
}
