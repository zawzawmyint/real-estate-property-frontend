"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function PropertyRetry() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      disabled={pending}
      aria-busy={pending}
      onClick={() => startTransition(() => router.refresh())}
      className="gap-2"
    >
      {pending && <Spinner className="size-5 text-primary" />}
      {pending ? "Retrying…" : "Try again"}
    </Button>
  );
}
