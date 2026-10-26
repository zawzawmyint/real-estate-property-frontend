"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <main id="main-content" className="mx-auto w-full max-w-xl px-6 py-20">
      <h1 className="text-3xl font-semibold tracking-tight">
        We couldn’t load this page
      </h1>
      <p className="mt-4 mb-7 leading-7 text-muted-foreground">
        Please try again in a moment.
      </p>
      <Button onClick={retry}>Try again</Button>
    </main>
  );
}
