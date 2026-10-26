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
      variant="ghost"
      disabled={pending}
      aria-busy={pending}
      onClick={() => startTransition(() => router.refresh())}
      className="px-2 underline underline-offset-4"
    >
      {pending && <Spinner className="size-5 text-primary" />}
      {pending ? "Retrying…" : "Try again"}
    </Button>
  );
}
