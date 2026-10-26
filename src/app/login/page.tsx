import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Brand } from "@/components/layout/brand";
import { Card, CardContent } from "@/components/ui/card";
import { LoginForm } from "@/features/auth/login-form";
import { getDemoLoginConfig } from "@/features/auth/demo-login";
import { getStaffSession } from "@/lib/auth/server";

export const metadata: Metadata = {
  title: "Staff sign in",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  if (await getStaffSession()) redirect("/crm");

  return (
    <main
      id="main-content"
      className="min-h-dvh px-6 py-8 sm:px-10 lg:flex lg:items-center lg:py-16"
    >
      <div className="mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-2 lg:items-center lg:gap-24">
        <section aria-label="Agency workspace" className="max-w-lg">
          <Brand />
          <p className="mt-12 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            For our team
          </p>
          <h2 className="mt-4 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            A considered approach.
            <br />A connected team.
          </h2>
          <p className="mt-6 max-w-sm text-base leading-8 text-muted-foreground">
            Your agency workspace brings the working day together. Sign in with
            your staff account to get started.
          </p>
          <Link
            href="/"
            className="mt-7 inline-flex min-h-11 items-center text-sm font-semibold text-primary"
          >
            ← Return to website
          </Link>
        </section>
        <Card
          role="region"
          aria-labelledby="login-heading"
          className="min-w-0 py-0"
        >
          <CardContent className="p-6 sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Staff access
            </p>
            <h1
              id="login-heading"
              className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              Sign in to your workspace
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Welcome back. Enter your agency credentials.
            </p>
            <LoginForm demoLogin={getDemoLoginConfig(process.env)} />
            <p className="mt-8 border-t border-border pt-6 text-sm leading-6 text-muted-foreground">
              Need access or a password reset? Contact your agency
              administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
