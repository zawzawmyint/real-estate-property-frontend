"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { authClient } from "@/lib/auth-client";
import {
  loginErrorMessage,
  retryAfterSeconds,
  loginSchema,
} from "./login-input";
import { useClientReady } from "@/lib/use-client-ready";
import type { DemoLoginConfig } from "./demo-login";

export function LoginForm({ demoLogin }: { demoLogin?: DemoLoginConfig }) {
  const router = useRouter();
  const ready = useClientReady();
  const [visible, setVisible] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    resetField,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<
    z.input<typeof loginSchema>,
    unknown,
    z.output<typeof loginSchema>
  >({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const pending = isPending || isSubmitting;

  const [message, setMessage] = useState("");
  const [retrySeconds, setRetrySeconds] = useState(0);
  const inFlight = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (retrySeconds <= 0) return;

    const timer = setTimeout(
      () => setRetrySeconds((remaining) => Math.max(0, remaining - 1)),
      1_000,
    );

    return () => clearTimeout(timer);
  }, [retrySeconds]);

  function signInAsDemo(email: string) {
    if (!demoLogin || !ready || inFlight.current || pending || retrySeconds > 0)
      return;

    setValue("email", email);
    setValue("password", demoLogin.password);
    formRef.current?.requestSubmit();
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!ready || inFlight.current || pending || retrySeconds > 0) return;

    // Acquire before asynchronous resolver validation, including same-tick submits.
    inFlight.current = true;

    const fields = new FormData(event.currentTarget);

    // Password managers may update native values without dispatching input events.
    setValue("email", String(fields.get("email") ?? ""));
    setValue("password", String(fields.get("password") ?? ""));
    setMessage("");
    await handleSubmit(onSubmit, () => {
      inFlight.current = false;
    })(event);
  }

  function onSubmit(values: z.output<typeof loginSchema>) {
    startTransition(async () => {
      let navigating = false;
      let status: number | undefined;
      let retryAfter: string | null = null;

      try {
        const result = await authClient.signIn.email(
          {
            email: values.email,
            password: values.password,
            rememberMe: true,
          },
          {
            onResponse(context) {
              status = context.response.status;
              retryAfter = context.response.headers.get("Retry-After");
            },
          },
        );

        resetField("password");

        if (result.error || !result.data?.user?.id) {
          setMessage(loginErrorMessage(status));

          if (status === 429) setRetrySeconds(retryAfterSeconds(retryAfter));

          setFocus("password");
          return;
        }

        // The library invalidates its own session atom on sign-in. Refresh the
        // router so the destination is rendered from an Express-verified session.
        navigating = true;
        startTransition(() => {
          router.replace("/crm");
          router.refresh();
        });
      } catch {
        resetField("password");
        setMessage(loginErrorMessage());
        setFocus("password");
      } finally {
        // Successful navigation owns the form until it unmounts.
        if (!navigating) inFlight.current = false;
      }
    });
  }

  return (
    <form
      ref={formRef}
      method="post"
      onSubmit={submit}
      noValidate
      aria-busy={pending}
      className="mt-8 space-y-6"
    >
      <Field data-invalid={Boolean(errors.email)}>
        <FieldLabel htmlFor="email">Email address</FieldLabel>
        <Input
          {...register("email")}
          id="email"
          type="email"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          maxLength={254}
          disabled={!ready}
          readOnly={pending}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
        />
        {errors.email && (
          <FieldError id="email-error">{errors.email.message}</FieldError>
        )}
      </Field>
      <Field data-invalid={Boolean(errors.password)}>
        <FieldLabel htmlFor="password">Password</FieldLabel>
        <div className="relative">
          <Input
            {...register("password")}
            id="password"
            type={visible ? "text" : "password"}
            autoComplete="current-password"
            required
            maxLength={128}
            disabled={!ready}
            readOnly={pending}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
            className="pe-20"
          />
          <Button
            type="button"
            variant="ghost"
            disabled={!ready || pending}
            onClick={() => setVisible((shown) => !shown)}
            aria-label={visible ? "Hide password" : "Show password"}
            aria-controls="password"
            aria-pressed={visible}
            className="absolute end-1 top-0.5 min-w-16 px-3 font-semibold"
          >
            {visible ? "Hide" : "Show"}
          </Button>
        </div>
        {errors.password && (
          <FieldError id="password-error">{errors.password.message}</FieldError>
        )}
      </Field>
      {message && (
        <Alert variant="destructive">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
      <div
        role="status"
        aria-live="polite"
        className="text-sm text-muted-foreground"
      >
        {pending
          ? "Signing you in…"
          : retrySeconds > 0
            ? `Try again in ${retrySeconds} seconds.`
            : ""}
      </div>
      <SubmitButton
        pending={pending}
        label="Sign in"
        pendingLabel="Signing in…"
        disabled={!ready || retrySeconds > 0}
        className="w-full"
      />
      {demoLogin && (
        <section
          aria-labelledby="demo-access-heading"
          className="space-y-3 border-t border-border pt-5"
        >
          <h2 id="demo-access-heading" className="text-sm font-semibold">
            Demo access
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Explore the workspace with a demo role. One click signs you in for
            local testing.
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {demoLogin.accounts.map((account) => (
              <Button
                key={account.role}
                type="button"
                variant="outline"
                aria-label={`Sign in as demo ${account.label}`}
                disabled={!ready || pending || retrySeconds > 0}
                onClick={() => signInAsDemo(account.email)}
              >
                {account.label}
              </Button>
            ))}
          </div>
        </section>
      )}
    </form>
  );
}
