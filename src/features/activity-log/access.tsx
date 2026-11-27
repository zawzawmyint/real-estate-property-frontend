"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { canReadAudit } from "@/lib/auth/roles";
import { useStaffAccount } from "@/features/auth/staff-account";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function AuditDenied() {
  return (
    <Alert variant="destructive">
      <AlertDescription>
        Access denied. The activity log requires an Admin or Manager account.
      </AlertDescription>
    </Alert>
  );
}

const AccessContext = createContext<(status: number) => void>(() => {});
export const useAuditDenial = () => useContext(AccessContext);

export function AuditAccess({
  children,
  staffId,
}: {
  children: ReactNode;
  staffId: string;
}) {
  const router = useRouter();
  const { identity, ready, checkingSession, sessionError, retrySession } =
    useStaffAccount();
  const [denied, setDenied] = useState(0);

  useEffect(() => {
    function focus() {
      retrySession();
      router.refresh();
    }
    window.addEventListener("focus", focus);
    return () => window.removeEventListener("focus", focus);
  }, [retrySession, router]);

  const deny = useCallback(
    (status: number) => {
      setDenied(status);
      retrySession();
    },
    [retrySession],
  );

  const lost = ready && !identity && !checkingSession && !sessionError;

  useEffect(() => {
    if (lost || denied === 401) router.replace("/login");
  }, [lost, denied, router]);

  if (
    lost ||
    denied ||
    (identity && (!canReadAudit(identity.role) || identity.id !== staffId))
  )
    return <AuditDenied />;

  if (ready && sessionError)
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Session verification is unavailable.
          <Button
            type="button"
            variant="outline"
            disabled={checkingSession}
            aria-busy={checkingSession}
            onClick={retrySession}
          >
            {checkingSession ? "Checking session…" : "Retry session check"}
          </Button>
        </AlertDescription>
      </Alert>
    );

  return (
    <AccessContext.Provider value={deny}>{children}</AccessContext.Provider>
  );
}

export function ResponseDenied({ status }: { status: number }) {
  const deny = useAuditDenial();
  useEffect(() => deny(status), [deny, status]);

  return <AuditDenied />;
}
