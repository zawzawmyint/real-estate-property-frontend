import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .max(254, "Enter a valid email address.")
    .pipe(z.email("Enter a valid email address."))
    .transform((email) => email.toLowerCase()),
  password: z
    .string()
    .min(1, "Enter your password.")
    .max(128, "Password must be 128 characters or fewer."),
});

export function loginErrorMessage(status?: number) {
  if (status === 401) return "Email or password is incorrect.";
  if (status === 429)
    return "Too many sign-in attempts. Please wait before trying again.";

  return "Sign-in is unavailable. Please try again.";
}

export function retryAfterSeconds(value: string | null, now = Date.now()) {
  if (!value || value.startsWith("-")) return 60;

  const seconds = /^\d+$/.test(value)
    ? Number(value)
    : Math.ceil((Date.parse(value) - now) / 1000);

  return Number.isFinite(seconds) && seconds >= 0 ? seconds : 60;
}
