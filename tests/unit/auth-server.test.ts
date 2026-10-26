import { beforeEach, expect, it, vi } from "vitest";

const boundary = vi.hoisted(() => ({
  cookies: vi.fn(),
  session: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: boundary.cookies }));
vi.mock("next/navigation", () => ({ redirect: boundary.redirect }));
vi.mock("@/lib/api/server", () => ({
  getStaffSessionFromBackend: boundary.session,
}));

import {
  getStaffSession,
  requireStaffSession,
} from "../../src/lib/auth/server";

beforeEach(() => {
  vi.clearAllMocks();
  boundary.cookies.mockResolvedValue({
    getAll: () => [{ name: "agency.session", value: "signed" }],
  });
});

it("awaits request cookies and obtains identity from the server transport", async () => {
  const staff = {
    id: "a",
    name: "Admin",
    email: "admin@example.com",
    role: "admin",
    expiresAt: "2026-10-22T20:00:00Z",
  };

  boundary.session.mockResolvedValue(staff);
  await expect(requireStaffSession()).resolves.toEqual(staff);
  expect(boundary.session).toHaveBeenCalledWith([
    { name: "agency.session", value: "signed" },
  ]);
  expect(boundary.redirect).not.toHaveBeenCalled();
});

it("redirects only a successful anonymous response", async () => {
  boundary.session.mockResolvedValue(null);
  await expect(requireStaffSession()).rejects.toThrow("redirect:/login");
  expect(boundary.redirect).toHaveBeenCalledWith("/login");
});

it("propagates outages to the retry boundary without redirecting", async () => {
  boundary.session.mockRejectedValue(
    new Error("Session verification is unavailable"),
  );
  await expect(getStaffSession()).rejects.toThrow(
    "Session verification is unavailable",
  );
  await expect(requireStaffSession()).rejects.toThrow(
    "Session verification is unavailable",
  );
  expect(boundary.redirect).not.toHaveBeenCalled();
});

it("does not reuse identity across independent requests", async () => {
  boundary.session
    .mockResolvedValueOnce({ id: "first" })
    .mockResolvedValueOnce({ id: "second" });
  expect(await getStaffSession()).toEqual({ id: "first" });
  expect(await getStaffSession()).toEqual({ id: "second" });
});
