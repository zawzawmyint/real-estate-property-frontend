import { requireStaffSession } from "@/lib/auth/server";
import { StaffAccountProvider } from "@/features/auth/staff-account";
import { WorkspaceShell } from "@/components/layout/workspace-shell";

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const staff = await requireStaffSession();

  return (
    <StaffAccountProvider staff={staff}>
      <WorkspaceShell>{children}</WorkspaceShell>
    </StaffAccountProvider>
  );
}
