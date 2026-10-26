"use client";

import { NavigationDrawer } from "@/components/layout/navigation-drawer";
import { WorkspaceSidebar } from "@/components/layout/workspace-sidebar";
import { Brand } from "@/components/layout/brand";

export function WorkspaceMenu() {
  return (
    <NavigationDrawer
      title="Agency workspace"
      desktopQuery="(min-width: 1024px)"
      heading={<Brand />}
    >
      <WorkspaceSidebar />
    </NavigationDrawer>
  );
}
