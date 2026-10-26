"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function PropertiesError({ retry }: { retry: () => void }) {
  return (
    <main
      id="main-content"
      className="min-w-0 flex-1 space-y-6 px-4 py-10 sm:px-8"
    >
      <h1 className="text-3xl font-semibold">Properties are unavailable</h1>
      <Alert variant="destructive">
        <AlertDescription>
          The agency service could not load this property information. Please
          try again.
        </AlertDescription>
      </Alert>
      <Button onClick={retry}>Try again</Button>
      <Link href="/crm/properties" className="ms-4 text-primary underline">
        Back to inventory
      </Link>
    </main>
  );
}
