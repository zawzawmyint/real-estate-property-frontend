"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { components } from "@/lib/api/generated/notifications";

export type NotificationItem = components["schemas"]["NotificationItem"];
type NotificationPage = components["schemas"]["NotificationPage"];
type InboxSnapshot = NotificationPage & { pagesLoaded: number };

const inboxPath = "/api/v1/staff/notifications";

export function useNotificationInbox(
  accountId: string,
  retrySession: () => void,
) {
  const [snapshot, setSnapshot] = useState<InboxSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [readError, setReadError] = useState(false);
  const [disconnected, setDisconnected] = useState(false);
  const [accessLost, setAccessLost] = useState(false);
  const requestedPages = useRef(1);
  const request = useRef<AbortController | null>(null);
  const accessLostRef = useRef(false);
  const reconnect = useRef<(() => void) | null>(null);

  const loseAccess = useCallback(() => {
    if (accessLostRef.current) return;
    accessLostRef.current = true;
    request.current?.abort();
    setSnapshot(null);
    setAccessLost(true);
    retrySession();
  }, [retrySession]);

  const refresh = useCallback(async () => {
    if (accessLostRef.current) return;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    const isCurrent = () => !controller.signal.aborted;
    setLoading(true);

    try {
      const items = new Map<string, NotificationItem>();
      let cursor: string | null = null;
      let unreadCount = 0;
      let pagesLoaded = 0;
      const maxPages = requestedPages.current;

      // Rebuild the loaded prefix with fresh cursors. A live insert or retirement
      // may have moved page boundaries while the popover was open.
      do {
        const query = cursor ? `?${new URLSearchParams({ cursor })}` : "";
        const response = await fetch(`${inboxPath}${query}`, {
          cache: "no-store",
          headers: { Accept: "application/json", "X-Staff-Account": accountId },
          signal: AbortSignal.any([
            controller.signal,
            AbortSignal.timeout(8_000),
          ]),
        });
        if (!isCurrent()) return;
        if (response.status === 401 || response.status === 403) {
          loseAccess();
          return;
        }
        if (!response.ok) throw new Error("Inbox request failed");
        const page: NotificationPage = await response.json();
        if (!isCurrent()) return;
        if (
          !Array.isArray(page?.items) ||
          !Number.isInteger(page.unreadCount) ||
          page.unreadCount < 0 ||
          (page.nextCursor !== null && typeof page.nextCursor !== "string")
        )
          throw new Error("Invalid inbox response");

        for (const item of page.items) {
          if (!items.has(item.id)) items.set(item.id, item);
        }
        if (pagesLoaded === 0) unreadCount = page.unreadCount;
        cursor = page.nextCursor;
        pagesLoaded++;
      } while (cursor && pagesLoaded < maxPages);

      requestedPages.current = pagesLoaded;
      setSnapshot({
        items: Array.from(items.values()),
        unreadCount,
        nextCursor: cursor,
        pagesLoaded,
      });
      setReadError(false);
    } catch {
      if (isCurrent()) setReadError(true);
    } finally {
      if (isCurrent()) {
        request.current = null;
        setLoading(false);
      }
    }
  }, [accountId, loseAccess]);

  useEffect(() => {
    if (accessLost) return;
    let source: EventSource | undefined;
    let retry: number | undefined;
    let invalidation: number | undefined;
    let delay = 1_000;
    let disposed = false;

    function close() {
      window.clearTimeout(retry);
      window.clearTimeout(invalidation);
      invalidation = undefined;
      source?.close();
      source = undefined;
    }

    function connect() {
      if (disposed || accessLostRef.current) return;
      close();
      const connection = new EventSource(`${inboxPath}/stream`);
      source = connection;
      connection.onopen = () => {
        if (source !== connection) return;
        delay = 1_000;
        setDisconnected(false);
      };
      // The first named event after each connection also reconciles missed changes.
      connection.addEventListener("notifications.changed", () => {
        if (source !== connection || invalidation !== undefined) return;
        invalidation = window.setTimeout(() => {
          invalidation = undefined;
          void refresh();
        }, 50);
      });
      connection.onerror = () => {
        if (source !== connection) return;
        setDisconnected(true);
        // EventSource hides the HTTP status, so a snapshot also checks access.
        void refresh();
        if (connection.readyState === EventSource.CLOSED && navigator.onLine) {
          // Native retries cover CONNECTING. Restart a terminal failure with backoff.
          retry = window.setTimeout(connect, delay);
          delay = Math.min(delay * 2, 15_000);
        }
      };
    }

    function wentOnline() {
      connect();
      void refresh();
    }

    reconnect.current = () => {
      if (source?.readyState !== EventSource.OPEN) connect();
    };
    window.addEventListener("online", wentOnline);
    // Schedule after the effect so the initial spinner also covers mount/replay.
    queueMicrotask(() => {
      if (!disposed) wentOnline();
    });

    return () => {
      disposed = true;
      close();
      request.current?.abort();
      reconnect.current = null;
      window.removeEventListener("online", wentOnline);
    };
  }, [accessLost, refresh]);

  function loadMore() {
    if (!snapshot?.nextCursor || loading) return;
    requestedPages.current = snapshot.pagesLoaded + 1;
    void refresh();
  }

  function retry() {
    reconnect.current?.();
    void refresh();
  }

  return {
    snapshot,
    loading,
    readError,
    disconnected,
    accessLost,
    loseAccess,
    refresh,
    loadMore,
    retry,
  };
}
