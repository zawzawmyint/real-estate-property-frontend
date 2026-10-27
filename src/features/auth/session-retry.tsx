"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Icon } from "@/components/ui/icon";

export function SessionRetry({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <div className="space-y-2 text-sm" role="alert">
      <p className={compact ? "sr-only" : undefined}>
        Session verification is unavailable.
      </p>
      <Button
        variant="ghost"
        size={compact ? "icon" : "sm"}
        disabled={pending}
        aria-label="Retry session check"
        title="Retry session check"
        aria-busy={pending}
        onClick={() => startTransition(() => router.refresh())}
      >
        {pending ? (
          <Spinner className="size-5" />
        ) : compact ? (
          <Icon name="retry" />
        ) : (
          "Retry session check"
        )}
      </Button>
    </div>
  );
}
