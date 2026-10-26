import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main-content" className="mx-auto max-w-xl px-6 py-24">
      <p className="text-sm font-medium text-primary">404</p>
      <h1 className="mt-4 text-3xl font-semibold">
        This page couldn’t be found
      </h1>
      <p className="mt-4 mb-8 leading-7 text-muted-foreground">
        The address may have changed or the page is no longer available.
      </p>
      <Link
        href="/"
        className="font-medium text-primary underline underline-offset-4"
      >
        Return home
      </Link>
    </main>
  );
}
