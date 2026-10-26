/** Shared by Next config and server-only API entry point; never import from client code. */
export function parseApiOrigin(value: string | undefined): string {
  const input = value ?? "http://localhost:4311";

  try {
    const url = new URL(input);

    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    )
      throw new Error();

    return url.origin;
  } catch {
    throw new Error(
      "API_URL must be an HTTP(S) origin without credentials, paths, queries, or fragments",
    );
  }
}
