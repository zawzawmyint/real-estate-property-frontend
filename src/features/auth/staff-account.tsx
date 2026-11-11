"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  use,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SessionRetry } from "./session-retry";

const roleLabels: Record<StaffRole, string> = {
  admin: "Admin",
  manager: "Manager",
  agent: "Agent",
};

type StaffAccountState = {
  staff: Promise<StaffSession | null>;
  identity: Pick<StaffSession, "id" | "name" | "role"> | null;
  sessionId: string | null;
  ready: boolean;
  pending: boolean;
  sessionError: boolean;
  checkingSession: boolean;
  message: string;
  signOut: () => Promise<void>;
  retrySession: () => void;
};

const StaffAccountContext = createContext<StaffAccountState | null>(null);

export function useStaffAccount() {
  const account = useContext(StaffAccountContext);
  if (!account)
    throw new Error("StaffAccount requires a StaffAccountProvider.");
  return account;
}

export function StaffAccountProvider({
  staff,
  children,
}: {
  staff: Promise<StaffSession | null>;
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

  const retrySession = useCallback(async () => {
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
  }, [ready, refetch]);

  return (
    <StaffAccountContext.Provider
      value={{
        staff,
        identity: data?.user ?? null,
        sessionId: data?.session?.id ?? null,
        ready,
        pending,
        sessionError: Boolean(error),
        checkingSession: isPending || retryingSession,
        message,
        signOut,
        retrySession,
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
  const account = useStaffAccount();
  // This streamed boundary can hydrate after its provider has become ready.
  const hydrated = useClientReady();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const close = () => setOpen(false);
    media.addEventListener("change", close);
    return () => media.removeEventListener("change", close);
  }, []);

  // The provider outlives the popup so pending sign-out and feedback survive dismissal.
  const staff = use(account.staff);
  if (!staff) return <SessionRetry compact={compact} />;

  const {
    identity: clientIdentity,
    ready,
    pending,
    sessionError,
    checkingSession,
    message,
    signOut,
    retrySession,
  } = account;
  const identity = clientIdentity ?? staff;
  const nameParts = identity.name.trim().split(/\s+/);
  const initials =
    (
      (nameParts[0]?.charAt(0) ?? "") +
      (nameParts.length > 1 ? (nameParts.at(-1)?.charAt(0) ?? "") : "")
    ).toUpperCase() || "S";

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger
        disabled={!ready || !hydrated}
        render={
          <Button
            type="button"
            variant="ghost"
            aria-label="Staff account"
            title={
              compact
                ? `${identity.name} · ${roleLabels[identity.role]}`
                : "Staff account"
            }
            className={
              compact
                ? "size-11 shrink-0 p-1.5 data-popup-open:bg-primary/5"
                : "h-auto min-h-15 w-full min-w-0 justify-start gap-2.5 px-2 py-2 text-start data-popup-open:bg-primary/5"
            }
          />
        }
      >
        <span
          aria-hidden="true"
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary ring-1 ring-inset ring-primary/10"
        >
          {initials}
        </span>
        {!compact && (
          <>
            <span className="min-w-0 flex-1">
              <span
                className="block truncate text-sm font-semibold leading-5"
                title={identity.name}
              >
                {identity.name}
              </span>
              <span className="block text-xs leading-5 text-muted-foreground">
                {roleLabels[identity.role]}
              </span>
            </span>
            <Icon
              name="chevron-down"
              className="size-4 shrink-0 text-muted-foreground"
            />
          </>
        )}
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="end"
        sideOffset={12}
        aria-label="Staff account menu"
      >
        <section aria-label="Staff account" className="min-w-0">
          <div className="flex min-w-0 items-center gap-3 border-b border-border p-4">
            <span
              aria-hidden="true"
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold tracking-wide text-primary ring-1 ring-inset ring-primary/10"
            >
              {initials}
            </span>
            <div className="min-w-0 flex-1 text-sm">
              <p className="wrap-anywhere font-semibold leading-5">
                {identity.name}
              </p>
              <p className="text-xs leading-5 text-muted-foreground">
                {roleLabels[identity.role]}
              </p>
            </div>
          </div>
          <div className="p-2">
            <Button
              type="button"
              variant="ghost"
              className="min-h-11 w-full justify-start gap-3 px-3 text-primary hover:bg-primary/5"
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
            <Alert variant="destructive" className="m-2 w-auto">
              <AlertDescription>
                <p>Session verification is unavailable.</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2 max-w-full gap-2 whitespace-normal text-start"
                  aria-label={
                    checkingSession
                      ? "Checking session…"
                      : "Retry session check"
                  }
                  title={
                    checkingSession
                      ? "Checking session…"
                      : "Retry session check"
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
                  {checkingSession
                    ? "Checking session…"
                    : "Retry session check"}
                </Button>
              </AlertDescription>
            </Alert>
          )}
          {message && (
            <Alert variant="destructive" className="m-2 w-auto">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
        </section>
      </PopoverContent>
    </Popover>
  );
}
