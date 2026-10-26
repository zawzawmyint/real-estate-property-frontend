import { isStaffRole, type StaffRole } from "./roles";

export type StaffSession = {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  expiresAt: string;
};

export class SessionServiceError extends Error {
  constructor() {
    super("Session verification is unavailable. Please try again.");
    this.name = "SessionServiceError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Called only by the server boundary. Native token metadata never leaves it. */
export async function requestStaffSession(
  origin: string,
  cookies: readonly { name: string; value: string }[],
  production: boolean,
): Promise<StaffSession | null> {
  try {
    const name = production ? "__Host-agency.session" : "agency.session";
    const cookie = cookies.find((entry) => entry.name === name);
    const response = await fetch(`${origin}/api/v1/auth/get-session`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...(cookie ? { Cookie: `${name}=${cookie.value}` } : {}),
      },
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });

    if (!response.ok) throw new SessionServiceError();

    const body: unknown = await response.json();

    if (body === null) return null;
    if (!isRecord(body) || !isRecord(body.user) || !isRecord(body.session))
      throw new SessionServiceError();

    const { id, name: staffName, email, role } = body.user;
    const { expiresAt } = body.session;

    if (
      typeof id !== "string" ||
      !id ||
      typeof staffName !== "string" ||
      !staffName ||
      typeof email !== "string" ||
      !email ||
      !isStaffRole(role) ||
      typeof expiresAt !== "string" ||
      !Number.isFinite(Date.parse(expiresAt))
    )
      throw new SessionServiceError();

    return { id, name: staffName, email, role, expiresAt };
  } catch {
    throw new SessionServiceError();
  }
}
