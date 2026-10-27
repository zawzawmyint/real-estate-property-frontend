import { NextResponse, type NextRequest } from "next/server";

/** Optimistic redirects only. Express and server reads still verify sessions. */
export function proxy(request: NextRequest) {
  const name =
    process.env.NODE_ENV === "production"
      ? "__Host-agency.session"
      : "agency.session";

  if (!request.cookies.get(name)?.value)
    return NextResponse.redirect(new URL("/login", request.url));

  return NextResponse.next();
}

export const config = { matcher: ["/crm/:path*"] };
