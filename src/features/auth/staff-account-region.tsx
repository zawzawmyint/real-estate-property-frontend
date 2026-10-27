import { Suspense } from "react";
import { requireStaffSession } from "@/lib/auth/server";
import { SessionServiceError } from "@/lib/auth/transport";
import { StaffAccount } from "./staff-account";
import { Spinner } from "@/components/ui/spinner";

export async function getAccountSession() {
  try {
    return await requireStaffSession();
  } catch (error) {
    if (!(error instanceof SessionServiceError)) throw error;
    return null;
  }
}

export function StaffAccountRegion({ compact = false }: { compact?: boolean }) {
  return (
    <Suspense
      fallback={
        <div
          role="status"
          aria-label="Checking staff account"
          className="flex min-h-11 items-center gap-2 text-sm text-muted-foreground"
        >
          <Spinner className="size-5 shrink-0" />
          <span className={compact ? "sr-only" : undefined}>
            Checking account…
          </span>
        </div>
      }
    >
      <StaffAccount compact={compact} />
    </Suspense>
  );
}
