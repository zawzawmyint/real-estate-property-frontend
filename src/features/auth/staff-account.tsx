"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { authClient } from "@/lib/auth-client";
import type { StaffSession } from "@/lib/auth/transport";
import type { StaffRole } from "@/lib/auth/roles";
import { useClientReady } from "@/lib/use-client-ready";
import { Icon } from "@/components/ui/icon";
import { NavigationDrawer } from "@/components/layout/navigation-drawer";

const roleLabels: Record<StaffRole, string> = {
  admin: "Admin",
  manager: "Manager",
  agent: "Agent",
};

type StaffAccountState = {
  identity: Pick<StaffSession, "name" | "role">;
  ready: boolean;
  pending: boolean;
  sessionError: boolean;
  checkingSession: boolean;
  message: string;
  signOut: () => Promise<void>;
  retrySession: () => void;
};

const StaffAccountContext = createContext<StaffAccountState | null>(null);

export function StaffAccountProvider({
  staff,
  children,
}: {
  staff: StaffSession;
  children?: ReactNode;
}) {
  const router = useRouter();
  const ready = useClientReady();
  const { data, isPending, error, refetch } = authClient.useSession();
  const [pending, setPending] = useState(false);
  const [retryingSession, setRetryingSession] = useState(false);
  const [message, setMessage] = useState("");
  const inFlight = useRef(false);
  const sessionCheckInFlight = useRef(false);

  useEffect(() => {
    if (!isPending && !error && !data && !inFlight.current) router.refresh();
  }, [data, error, isPending, router]);

  async function signOut() {
    if (!ready || inFlight.current) return;

    inFlight.current = true;
    setPending(true);
    setMessage("");
    let navigating = false;

    try {
      const result = await authClient.signOut();

      if (result.error || result.data?.success !== true) {
        setMessage("We couldn’t sign you out. Please try again.");
        return;
      }

      // Native sign-out invalidates the library session and broadcasts to tabs.
      navigating = true;
      router.replace("/login");
      router.refresh();
    } catch {
      navigating = false;
      setMessage("We couldn’t sign you out. Please try again.");
    } finally {
      if (!navigating) {
        inFlight.current = false;
        setPending(false);
      }
    }
  }

  async function retrySession() {
    if (!ready || sessionCheckInFlight.current) return;

    sessionCheckInFlight.current = true;
    setRetryingSession(true);

    try {
      await refetch();
    } catch {
      setMessage("Session verification is unavailable. Please try again.");
    } finally {
      sessionCheckInFlight.current = false;
      setRetryingSession(false);
    }
  }

  return (
    <StaffAccountContext.Provider
      value={{
        identity: data?.user ?? staff,
        ready,
        pending,
        sessionError: Boolean(error),
        checkingSession: isPending || retryingSession,
        message,
        signOut,
        retrySession: () => void retrySession(),
      }}
    >
      {children}
      <span role="status" className="sr-only">
        {pending
          ? "Signing out…"
          : isPending || retryingSession
            ? "Checking session…"
            : ""}
      </span>
    </StaffAccountContext.Provider>
  );
}

export function StaffAccount({ compact = false }: { compact?: boolean }) {
  const account = useContext(StaffAccountContext);

  if (!account)
    throw new Error("StaffAccount requires a StaffAccountProvider.");

  if (compact)
    return (
      <NavigationDrawer
        triggerLabel="Staff account"
        triggerIcon="user"
        title="Staff account"
        description="View your signed-in staff account and sign out."
        desktopQuery="(max-width: 1023px)"
      >
        <StaffAccount />
      </NavigationDrawer>
    );

  const {
    identity,
    ready,
    pending,
    sessionError,
    checkingSession,
    message,
    signOut,
    retrySession,
  } = account;
  const nameParts = identity.name.trim().split(/\s+/);
  const initials =
    (
      (nameParts[0]?.charAt(0) ?? "") +
      (nameParts.length > 1 ? (nameParts.at(-1)?.charAt(0) ?? "") : "")
    ).toUpperCase() || "S";

  return (
    <section
      aria-label="Staff account"
      className="flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-card p-2"
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2.5">
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold tracking-wide text-primary ring-1 ring-inset ring-primary/10"
        >
          {initials}
        </span>
        <div className="min-w-16 flex-1 text-sm">
          <p className="truncate font-semibold leading-5" title={identity.name}>
            {identity.name}
          </p>
          <p className="text-xs leading-5 text-muted-foreground">
            {roleLabels[identity.role]}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="shrink-0 gap-2"
          aria-label={pending ? "Signing out…" : "Sign out"}
          title={pending ? "Signing out…" : "Sign out"}
          onClick={signOut}
          disabled={!ready || pending}
          aria-busy={pending}
        >
          {pending ? (
            <Spinner className="size-5 text-primary" />
          ) : (
            <Icon name="logout" />
          )}
          {pending ? "Signing out…" : "Sign out"}
        </Button>
      </div>
      {sessionError && (
        <Alert variant="destructive" className="basis-full">
          <AlertDescription>
            <p>Session verification is unavailable.</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-2 max-w-full gap-2 whitespace-normal text-start"
              aria-label={
                checkingSession ? "Checking session…" : "Retry session check"
              }
              title={
                checkingSession ? "Checking session…" : "Retry session check"
              }
              disabled={!ready || checkingSession}
              aria-busy={checkingSession}
              onClick={retrySession}
            >
              {checkingSession ? (
                <Spinner className="size-5 text-primary" />
              ) : (
                <Icon name="retry" />
              )}
              {checkingSession ? "Checking session…" : "Retry session check"}
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {message && (
        <Alert variant="destructive" className="basis-full">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
    </section>
  );
}
