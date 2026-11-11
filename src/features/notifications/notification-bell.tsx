"use client";

import {
  startTransition,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { useStaffAccount } from "@/features/auth/staff-account";
import { cn } from "@/lib/utils";
import { markNotificationRead } from "./actions";
import {
  useNotificationInbox,
  type NotificationItem,
} from "./use-notification-inbox";

const presentation = {
  lead_assigned: {
    title: "New lead assigned",
    icon: "user-plus",
    resource: "lead",
  },
  viewing_rescheduled: {
    title: "Viewing rescheduled",
    icon: "calendar",
    resource: "viewing",
  },
  viewing_cancelled: {
    title: "Viewing cancelled",
    icon: "calendar",
    resource: "viewing",
  },
  task_due_soon: {
    title: "Follow-up task due soon",
    icon: "clock",
    resource: "task",
  },
  website_inquiry_received: {
    title: "New website inquiry",
    icon: "leads",
    resource: "lead",
  },
} satisfies Record<
  NotificationItem["type"],
  {
    title: string;
    icon: ComponentProps<typeof Icon>["name"];
    resource: "lead" | "viewing" | "task";
  }
>;

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Dubai",
});

export function NotificationBell() {
  const { identity, sessionId, ready, pending, retrySession } =
    useStaffAccount();
  if (!identity || !sessionId || !ready || pending) return <InactiveBell />;

  return (
    <AccountNotificationBell
      key={sessionId}
      accountId={identity.id}
      retrySession={retrySession}
    />
  );
}

function InactiveBell() {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label="Notifications"
      disabled
    >
      <Icon name="bell" />
    </Button>
  );
}

function AccountNotificationBell({
  accountId,
  retrySession,
}: {
  accountId: string;
  retrySession: () => void;
}) {
  const router = useRouter();
  const titleId = useId();
  const closeButton = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const pageAdvance = useRef<{
    button: HTMLButtonElement;
    knownIds: Set<string>;
  } | null>(null);
  const mounted = useRef(false);
  const marking = useRef(false);
  const [open, setOpen] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [markError, setMarkError] = useState<"missing" | "unavailable" | null>(
    null,
  );
  const {
    snapshot,
    loading,
    readError,
    disconnected,
    accessLost,
    loseAccess,
    refresh,
    loadMore,
    retry,
  } = useNotificationInbox(accountId, retrySession);
  const count = snapshot?.unreadCount ?? 0;

  useLayoutEffect(() => {
    mounted.current = !accessLost;
    return () => {
      mounted.current = false;
    };
  }, [accessLost]);

  useLayoutEffect(() => {
    const advance = pageAdvance.current;
    if (loading || !advance) return;
    pageAdvance.current = null;
    if (
      !open ||
      (document.activeElement !== advance.button &&
        document.activeElement !== document.body)
    )
      return;

    const links = Array.from(
      list.current?.querySelectorAll<HTMLAnchorElement>(
        "a[data-notification-id]",
      ) ?? [],
    );
    const lastKnown = links.findLastIndex((link) =>
      advance.knownIds.has(link.dataset.notificationId ?? ""),
    );
    links[lastKnown + 1]?.focus();
  }, [loading, open, snapshot]);

  function openNotification(
    item: NotificationItem,
    href: string,
    navigate: boolean,
  ) {
    if (navigate && marking.current) return;
    if (item.readAt) {
      if (navigate) {
        setOpen(false);
        router.push(href);
      }
      return;
    }

    if (navigate) {
      marking.current = true;
      setPendingId(item.id);
    }
    startTransition(async () => {
      const result = await markNotificationRead(item.id, accountId).catch(
        () => ({ ok: false as const, error: "unavailable" as const }),
      );
      if (!mounted.current) return;
      if (navigate) {
        marking.current = false;
        setPendingId(null);
      }
      if (!result.ok && result.error === "session") {
        loseAccess();
        return;
      }

      if (!result.ok && result.error === "missing") {
        setMarkError("missing");
        if (navigate) closeButton.current?.focus();
        void refresh();
        return;
      }

      setMarkError(result.ok ? null : "unavailable");
      if (result.ok) void refresh();
      if (navigate) {
        startTransition(() => {
          setOpen(false);
          router.push(href);
        });
      }
    });
  }

  if (accessLost) return <InactiveBell />;

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next && !loading) void refresh();
      }}
      modal={false}
    >
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={
              count > 0 ? `Notifications, ${count} unread` : "Notifications"
            }
            title="Notifications"
            className="relative data-popup-open:bg-primary/5"
          />
        }
      >
        <Icon name="bell" className="size-5" />
        {count > 0 && (
          <span
            aria-hidden="true"
            className="absolute end-0.5 top-0.5 min-w-4 rounded-full bg-primary px-1 text-[10px] leading-4 font-semibold text-primary-foreground"
          >
            {count > 99 ? "99+" : count}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={7}
        className="w-[355px] shadow-lg"
        aria-labelledby={titleId}
        initialFocus={closeButton}
      >
        <div className="flex items-center justify-between gap-2 border-b border-border py-2 ps-4 pe-2">
          <div>
            <h2 id={titleId} className="text-base font-semibold">
              Notifications
            </h2>
            {snapshot && (
              <p className="text-xs text-muted-foreground">
                {count > 0 ? `${count} unread` : "No unread notifications"}
              </p>
            )}
          </div>
          <PopoverClose
            render={
              <Button
                ref={closeButton}
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Close notifications"
              />
            }
          >
            <Icon name="close" />
          </PopoverClose>
        </div>

        {(readError || disconnected || markError) && (
          <Alert variant="destructive" className="m-2 w-auto p-3">
            <AlertDescription className="space-y-2 text-xs leading-5">
              {markError === "missing" && (
                <div>This notification is no longer available.</div>
              )}
              {markError === "unavailable" && (
                <div>
                  Couldn’t mark the notification as read. Open it again to
                  retry.
                </div>
              )}
              {(readError || disconnected) && (
                <>
                  <div>
                    {readError
                      ? "Couldn’t refresh notifications."
                      : "Live updates are reconnecting."}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    aria-disabled={loading}
                    onClick={() => {
                      if (!loading) retry();
                    }}
                  >
                    Retry notifications
                  </Button>
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        {!snapshot && loading && (
          <p
            role="status"
            className="flex items-center gap-2 px-4 py-5 text-sm text-muted-foreground"
          >
            <Spinner /> Loading notifications…
          </p>
        )}
        {snapshot?.items.length === 0 && (
          <p className="px-4 py-5 text-sm text-muted-foreground">
            You’re all caught up.
          </p>
        )}

        {snapshot && snapshot.items.length > 0 && (
          <ul ref={list} className="divide-y divide-border">
            {snapshot.items.map((item) => {
              const { title, icon, resource } = presentation[item.type] ?? {
                title: "CRM notification",
                icon: "bell",
                resource: "lead",
              };
              const id = {
                lead: item.leadId,
                viewing: item.viewingId,
                task: item.taskId,
              }[resource];
              if (!id) return null;
              const href = `/crm/${resource}s/${encodeURIComponent(id)}`;
              return (
                <li key={item.id}>
                  <Link
                    href={href}
                    prefetch={false}
                    data-notification-id={item.id}
                    aria-busy={pendingId === item.id || undefined}
                    onClick={(event) => {
                      if (
                        event.ctrlKey ||
                        event.metaKey ||
                        event.shiftKey ||
                        event.altKey
                      )
                        openNotification(item, href, false);
                    }}
                    onAuxClick={(event) => {
                      if (event.button === 1)
                        openNotification(item, href, false);
                    }}
                    onNavigate={(event) => {
                      event.preventDefault();
                      openNotification(item, href, true);
                    }}
                    className={cn(
                      "grid min-h-15 grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-2.5 px-3 py-2.5 hover:bg-primary/10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
                      !item.readAt && "bg-primary/5",
                    )}
                  >
                    <span className="grid size-8 place-items-center rounded-lg border border-border bg-card text-primary">
                      <Icon name={icon} className="size-4" />
                    </span>
                    <span className="grid min-w-0 gap-0.5">
                      <span className="text-sm leading-5 font-semibold">
                        {title}
                      </span>
                      <span className="text-xs leading-4 text-muted-foreground">
                        <time dateTime={item.createdAt} title="Dubai time">
                          {dateFormat.format(new Date(item.createdAt))}
                        </time>
                        <span aria-hidden="true"> · </span>Open {resource}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "text-xs text-muted-foreground",
                        !item.readAt && "font-semibold text-primary",
                      )}
                    >
                      {pendingId === item.id ? (
                        <Spinner className="size-4" />
                      ) : item.readAt ? (
                        "Read"
                      ) : (
                        <>
                          <span aria-hidden="true">New</span>
                          <span className="sr-only">Unread</span>
                        </>
                      )}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        {snapshot?.nextCursor && (
          <div className="border-t border-border p-1 text-center">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-disabled={loading}
              onClick={(event) => {
                if (loading) return;
                pageAdvance.current = {
                  button: event.currentTarget,
                  knownIds: new Set(snapshot.items.map((item) => item.id)),
                };
                loadMore();
              }}
            >
              Load more
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
