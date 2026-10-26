import "server-only";
import { createHmac } from "node:crypto";
import { isIP } from "node:net";

/** The ingress must overwrite this configured header and prevent direct access to Next. */
export function inquiryRelayHeaders(incoming: Headers): Record<string, string> {
  const secret = process.env.INQUIRY_RELAY_SECRET;
  if (!secret || secret.length < 32)
    throw new Error("Inquiry relay unavailable");
  const trustedHeader =
    process.env.INQUIRY_TRUSTED_CLIENT_HEADER?.trim().toLowerCase();
  let identity: string | null = null;
  if (
    trustedHeader &&
    /^[a-z0-9-]+$/.test(trustedHeader) &&
    !["host", "origin", "cookie"].includes(trustedHeader)
  ) {
    const value = incoming.get(trustedHeader)?.trim();
    if (value && isIP(value)) identity = value;
  } else if (process.env.NODE_ENV !== "production") {
    const value = incoming.get("x-forwarded-for")?.trim();
    if (
      value === "127.0.0.1" ||
      value === "::1" ||
      value === "::ffff:127.0.0.1"
    )
      identity = value;
  }
  if (!identity) throw new Error("Trusted inquiry client unavailable");
  const clientKey = createHmac("sha256", secret).update(identity).digest("hex");
  return {
    "x-inquiry-client-key": clientKey,
    "x-inquiry-relay-signature": createHmac("sha256", secret)
      .update(clientKey)
      .digest("hex"),
  };
}
