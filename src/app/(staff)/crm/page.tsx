import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { requireStaffSession } from "@/lib/auth/server";

export const metadata: Metadata = {
  title: "Agency workspace",
  robots: { index: false, follow: false },
};

export default async function CrmPage() {
  await requireStaffSession();

  return (
    <main id="main-content" className="min-w-0 flex-1 px-6 py-10 sm:px-10">
      <p className="text-xs font-semibold uppercase tracking-widest text-primary">
        Overview
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
        Your agency workspace
      </h1>
      <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
        A dedicated space for your agency’s daily work.
      </p>
      <div className="mt-10">
        <Card>
          <CardContent className="p-6 sm:p-8">
            <h2 className="text-xl font-semibold">Property inventory</h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
              Browse your agency’s properties, keep listing details up to date
              and manage what appears on the public website.
            </p>
            <Link
              href="/crm/properties"
              className="mt-5 inline-flex min-h-11 items-center font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              Open properties{" "}
              <span aria-hidden="true" className="ms-2">
                →
              </span>
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
