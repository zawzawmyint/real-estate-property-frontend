import Link from "next/link";

export default function PropertyNotFound() {
  return (
    <main id="main-content" className="public-container py-20 sm:py-28">
      <p className="text-sm font-medium text-primary">404</p>
      <h1 className="display-heading mt-4 text-4xl sm:text-5xl">
        This home is no longer available
      </h1>
      <p className="mt-5 max-w-lg text-sm leading-7 text-muted-foreground">
        The listing may have changed or been removed. Explore the collection to
        find another place for your next chapter.
      </p>
      <Link
        href="/properties?purpose=sale"
        className="mt-6 inline-flex min-h-11 items-center text-sm font-medium text-primary underline underline-offset-4"
      >
        Explore properties
      </Link>
      <Link
        href="/"
        className="ms-6 inline-flex min-h-11 items-center text-sm font-medium text-primary underline underline-offset-4"
      >
        Return home
      </Link>
    </main>
  );
}
