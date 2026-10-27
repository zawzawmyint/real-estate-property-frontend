"use client";

import { NavigationDrawer } from "@/components/layout/navigation-drawer";
import { WorkspaceSidebar } from "@/components/layout/workspace-sidebar";
import { Brand } from "@/components/layout/brand";
import type { ReactNode } from "react";

export function WorkspaceMenu({ account }: { account: ReactNode }) {
  return (
    <NavigationDrawer
      title="Agency workspace"
      desktopQuery="(min-width: 1024px)"
      heading={<Brand />}
    >
      <WorkspaceSidebar account={account} />
    </NavigationDrawer>
  );
}
