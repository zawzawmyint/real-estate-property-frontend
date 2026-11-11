"use client";

import { useState, type ReactNode } from "react";
import { Brand } from "@/components/layout/brand";
import { WorkspaceSidebar } from "@/components/layout/workspace-sidebar";
import { WorkspaceMenu } from "@/components/layout/workspace-menu";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { useClientReady } from "@/lib/use-client-ready";

export function WorkspaceShell({
  children,
  account,
  compactAccount,
  toolbar,
}: {
  children: ReactNode;
  account: ReactNode;
  compactAccount: ReactNode;
  toolbar: ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const ready = useClientReady();
  const label = expanded ? "Collapse sidebar" : "Expand sidebar";

  return (
    <div
      className={cn(
        "min-h-dvh lg:grid",
        expanded
          ? "lg:grid-cols-[240px_minmax(0,1fr)]"
          : "lg:grid-cols-[88px_minmax(0,1fr)]",
      )}
    >
      <aside
        id="workspace-sidebar"
        className="sticky top-0 hidden h-dvh flex-col border-e border-border bg-background lg:flex"
      >
        <div className="flex min-h-[88px] shrink-0 items-center justify-center border-b border-border px-3 py-3">
          <Brand compact={!expanded} />
        </div>
        <div
          className={cn(
            "flex px-3 pt-3",
            expanded ? "justify-end" : "justify-center",
          )}
        >
          <Button
            variant="ghost"
            size="icon"
            aria-label={label}
            title={label}
            aria-expanded={expanded}
            aria-controls="workspace-sidebar"
            disabled={!ready}
            onClick={() => setExpanded((value) => !value)}
          >
            <Icon name={expanded ? "collapse" : "expand"} />
          </Button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col px-3 py-4">
          <WorkspaceSidebar
            compact={!expanded}
            account={expanded ? account : compactAccount}
          />
        </div>
      </aside>
      <div className="flex min-w-0 flex-col">
        <div
          role="region"
          aria-label="Workspace controls"
          className="flex min-h-14 items-center justify-between gap-2 border-b border-border px-4 sm:px-6 lg:px-8"
        >
          <div className="lg:hidden">
            <WorkspaceMenu account={account} />
          </div>
          <span className="hidden text-sm font-medium text-muted-foreground lg:inline">
            Workspace
          </span>
          <div className="flex items-center gap-2">{toolbar}</div>
        </div>
        {children}
      </div>
    </div>
  );
}
