import { afterEach, expect, it, vi, expectTypeOf } from "vitest";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

it("uses native browser auth operations with same-origin credentials and typed roles", async () => {
  const fetcher = vi.fn().mockImplementation(async (url: string) => {
    if (String(url).endsWith("/sign-out"))
      return Response.json({ success: true });
    if (String(url).endsWith("/get-session")) return Response.json(null);

    return Response.json({
      redirect: false,
      token: "native-only",
      user: {
        id: "s1",
        name: "Maya",
        email: "maya@example.com",
        role: "agent",
      },
    });
  });

  vi.stubGlobal("fetch", fetcher);
  vi.stubGlobal("window", { location: { origin: "http://localhost:3100" } });

  const { authClient } = await import("../../src/lib/auth-client");

  type Role = typeof authClient.$Infer.Session.user.role;

  expectTypeOf<Role>().toEqualTypeOf<"admin" | "manager" | "agent">();
  expect(typeof authClient.useSession).toBe("function");
  await authClient.signIn.email({
    email: "maya@example.com",
    password: "unchanged",
    rememberMe: true,
  });

  const signIn = fetcher.mock.calls.find(([url]) =>
    String(url).endsWith("/sign-in/email"),
  );

  expect(String(signIn?.[0])).toBe(
    "http://localhost:3100/api/v1/auth/sign-in/email",
  );
  expect(signIn?.[1]).toMatchObject({
    method: "POST",
    credentials: "same-origin",
  });
  expect(JSON.parse(signIn?.[1].body)).toEqual({
    email: "maya@example.com",
    password: "unchanged",
    rememberMe: true,
  });
  expect((await authClient.getSession()).data).toBeNull();

  const session = fetcher.mock.calls.find(([url]) =>
    String(url).endsWith("/get-session"),
  );

  expect(session?.[1].method).toBe("GET");
  expect((await authClient.signOut()).data).toEqual({ success: true });

  const signOut = fetcher.mock.calls.find(([url]) =>
    String(url).endsWith("/sign-out"),
  );

  expect(signOut?.[1]).toMatchObject({
    method: "POST",
    credentials: "same-origin",
  });
});
