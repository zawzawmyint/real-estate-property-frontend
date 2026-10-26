import Link from "next/link";
import { NavigationPending } from "@/components/ui/navigation-pending";
import { Brand } from "@/components/layout/brand";
import { PublicHeader } from "@/components/layout/public-header";
import "./public.css";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="public-site flex min-h-dvh flex-col">
      <PublicHeader />
      {children}
      <footer className="mt-auto border-t border-border">
        <div className="public-container flex flex-wrap items-center justify-between gap-5 py-8">
          <Brand />
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <p className="text-sm text-muted-foreground">
              A new place. A new beginning.
            </p>
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center rounded-sm text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              Staff sign-in
              <NavigationPending />
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
