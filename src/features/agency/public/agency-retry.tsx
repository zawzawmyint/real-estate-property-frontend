"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function AgencyRetry() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      disabled={pending}
      aria-busy={pending}
      onClick={() => startTransition(() => router.refresh())}
      className="mt-4"
    >
      {pending && <Spinner className="me-2 size-4" />}
      {pending ? "Retrying…" : "Try again"}
    </Button>
  );
}
