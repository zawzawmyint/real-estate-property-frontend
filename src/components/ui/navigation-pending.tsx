"use client";

import { useLinkStatus } from "next/link";
import { Spinner } from "./spinner";

export function NavigationPending() {
  const { pending } = useLinkStatus();

  if (!pending) return null;

  return (
    <span
      role="status"
      className="pointer-events-none fixed inset-x-4 bottom-5 z-50 mx-auto inline-flex w-fit max-w-[calc(100%-2rem)] items-center gap-3 rounded-xl border border-border bg-card px-5 py-3 text-sm text-primary shadow-lg"
    >
      <Spinner />
      <span className="text-muted-foreground">Opening page…</span>
    </span>
  );
}
