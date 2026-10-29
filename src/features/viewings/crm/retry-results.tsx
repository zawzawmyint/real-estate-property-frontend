"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useClientReady } from "@/lib/use-client-ready";
export function RetryViewings() {
  const router = useRouter();
  const ready = useClientReady();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="ghost"
      disabled={!ready || pending}
      onClick={() => startTransition(() => router.refresh())}
    >
      {pending ? "Retrying…" : "Retry viewings"}
    </Button>
  );
}
