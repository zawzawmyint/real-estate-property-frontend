import { describe, expect, it } from "vitest";
import {
  loginSchema,
  loginErrorMessage,
  retryAfterSeconds,
} from "../../src/features/auth/login-input";

describe("staff sign-in input", () => {
  it("normalizes email while preserving the exact password", () => {
    expect(
      loginSchema.parse({
        email: "  STAFF@Example.COM ",
        password: "  password  ",
      }),
    ).toEqual({
      email: "staff@example.com",
      password: "  password  ",
    });
  });
  it("associates missing and invalid values with their fields", () => {
    for (const [email, password, messages] of [
      ["broken", "", ["Enter a valid email address.", "Enter your password."]],
      [
        "a".repeat(255),
        "x".repeat(129),
        [
          "Enter a valid email address.",
          "Password must be 128 characters or fewer.",
        ],
      ],
    ] as const) {
      const result = loginSchema.safeParse({ email, password });

      expect(result.success).toBe(false);

      if (!result.success)
        expect(result.error.issues.map((issue) => issue.message)).toEqual(
          messages,
        );
    }
  });
  it("accepts existing short passwords and enforces exact input limits", () => {
    const email = `${"a".repeat(64)}@${"b".repeat(63)}.${"c".repeat(63)}.${"d".repeat(61)}`;

    expect(email).toHaveLength(254);
    expect(
      loginSchema.safeParse({ email, password: "x".repeat(128) }).success,
    ).toBe(true);
    expect(
      loginSchema.safeParse({ email: `${email}d`, password: "x" }).success,
    ).toBe(false);
    expect(
      loginSchema.safeParse({ email: "staff@example.com", password: "x" })
        .success,
    ).toBe(true);
    expect(
      loginSchema.parse({ email: "staff@example.com", password: " " }).password,
    ).toBe(" ");
  });
  it("does not present outages, permission errors, or malformed success as wrong credentials", () => {
    expect(loginErrorMessage(401)).toBe("Email or password is incorrect.");

    for (const status of [undefined, 200, 400, 403, 500, 503])
      expect(loginErrorMessage(status)).toBe(
        "Sign-in is unavailable. Please try again.",
      );

    expect(loginErrorMessage(429)).toBe(
      "Too many sign-in attempts. Please wait before trying again.",
    );
  });
  it("reads Retry-After seconds or dates without allowing invalid cooldowns", () => {
    expect(retryAfterSeconds("12")).toBe(12);
    expect(retryAfterSeconds("invalid")).toBe(60);
    expect(retryAfterSeconds(null)).toBe(60);
    expect(retryAfterSeconds("-1")).toBe(60);
    expect(
      retryAfterSeconds(
        "Thu, 22 Oct 2026 12:01:00 GMT",
        Date.parse("2026-10-22T12:00:00Z"),
      ),
    ).toBe(60);
  });
});
