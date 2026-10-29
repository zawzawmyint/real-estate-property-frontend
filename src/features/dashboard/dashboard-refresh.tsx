"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Spinner } from "@/components/ui/spinner";
import { useClientReady } from "@/lib/use-client-ready";

export function DashboardRefresh({ retry = false }: { retry?: boolean }) {
  const router = useRouter();
  const ready = useClientReady();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      disabled={!ready || pending}
      aria-busy={pending}
      onClick={() => startTransition(() => router.refresh())}
    >
      {pending ? <Spinner className="size-4" /> : <Icon name="retry" />}
      {pending ? "Refreshing…" : retry ? "Retry" : "Refresh"}
    </Button>
  );
}
