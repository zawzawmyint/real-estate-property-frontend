import {
  StaffAccountRegion,
  getAccountSession,
} from "@/features/auth/staff-account-region";
import { StaffAccountProvider } from "@/features/auth/staff-account";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { NotificationBell } from "@/features/notifications/notification-bell";

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StaffAccountProvider staff={getAccountSession()}>
      <WorkspaceShell
        account={<StaffAccountRegion />}
        compactAccount={<StaffAccountRegion compact />}
        toolbar={<NotificationBell />}
      >
        {children}
      </WorkspaceShell>
    </StaffAccountProvider>
  );
}
