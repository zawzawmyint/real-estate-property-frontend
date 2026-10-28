"use client";
import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TextField, TextareaField } from "@/components/forms/fields";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { useClientReady } from "@/lib/use-client-ready";
import { inquiryFormSchema, type InquiryValues } from "../data/input";
import { sendInquiry } from "../data/actions";
export function PropertyInquiryCard({
  propertyId,
  title,
  location,
}: {
  propertyId: string;
  title: string;
  location: string;
}) {
  const ready = useClientReady();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [retryAt, setRetryAt] = useState<number>();
  const guard = useRef(false);
  const receipt = useRef<{ id: string; values: InquiryValues } | undefined>(
    undefined,
  );
  const summary = useRef<HTMLDivElement>(null);
  const form = useForm<InquiryValues>({
    resolver: zodResolver(inquiryFormSchema),
    defaultValues: { name: "", phone: "", email: "", message: "" },
  });
  const {
    register,
    formState: { errors, isSubmitting },
  } = form;
  const busy = pending || isSubmitting;
  async function save(values: InquiryValues) {
    if (!receipt.current) receipt.current = { id: crypto.randomUUID(), values };
    const saved = receipt.current;
    startTransition(async () => {
      try {
        const result = await sendInquiry(propertyId, {
          submissionId: saved.id,
          name: saved.values.name,
          phone: saved.values.phone || null,
          email: saved.values.email || null,
          message: saved.values.message || null,
        });
        if (result.ok) {
          setSuccess(true);
          return;
        }
        if (result.error.status === 404) {
          setUnavailable(true);
          setMessage("This property is no longer accepting inquiries");
        } else if (result.error.status === 429) {
          if (!uncertain) receipt.current = undefined;
          const seconds = result.error.retryAfter || 900;
          setRetryAt(Date.now() + seconds * 1000);
          setMessage(
            `Too many inquiries. Please retry in ${Math.ceil(seconds / 60)} minute${seconds > 60 ? "s" : ""}.`,
          );
        } else {
          setMessage(result.error.message);
          if (result.error.uncertain) setUncertain(true);
          else if (!uncertain) receipt.current = undefined;
        }
        requestAnimationFrame(() => summary.current?.focus());
      } catch {
        setUncertain(true);
        setMessage(
          "The response could not be confirmed. Retry explicitly to check the same inquiry. Your details are preserved.",
        );
      } finally {
        guard.current = false;
      }
    });
  }
  return (
    <aside
      className="min-w-0 rounded-xl border border-border bg-card p-5 sm:p-6 lg:sticky lg:top-28"
      aria-labelledby="inquiry-heading"
    >
      <h2 id="inquiry-heading" className="display-heading text-2xl">
        Enquire about this property
      </h2>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Tell us how to reach you. Our team can help you take the next step.
      </p>
      <div className="my-6 border-y border-border py-4">
        <p className="text-sm font-semibold break-words">{title}</p>
        <p className="mt-1 text-xs break-words text-muted-foreground">
          {location}
        </p>
      </div>
      {success ? (
        <div role="status" className="space-y-3 py-4">
          <p className="font-semibold">
            Thank you. Our team will contact you about this property.
          </p>
          <p className="text-sm text-muted-foreground">
            Your inquiry has been received.
          </p>
        </div>
      ) : (
        <form
          noValidate
          className="space-y-5"
          aria-busy={busy}
          onSubmit={async (event) => {
            event.preventDefault();
            if (guard.current || busy || !ready || unavailable) return;
            if (retryAt && Date.now() < retryAt) {
              setMessage(
                `Please retry after ${new Date(retryAt).toLocaleTimeString("en-GB", { timeZone: "Asia/Dubai", hour: "2-digit", minute: "2-digit" })} Dubai time.`,
              );
              return;
            }
            guard.current = true;
            setMessage("");
            if (!uncertain) {
              const data = new FormData(event.currentTarget);
              for (const key of ["name", "phone", "email", "message"] as const)
                form.setValue(key, String(data.get(key) || ""));
            }
            await form.handleSubmit(save, () => {
              guard.current = false;
              setMessage("Check the highlighted fields.");
              requestAnimationFrame(() => summary.current?.focus());
            })(event);
          }}
        >
          {message && (
            <div ref={summary} tabIndex={-1}>
              <Alert variant="destructive">
                <AlertDescription>
                  {message}
                  {Object.keys(errors).length > 0 && (
                    <ul className="mt-2 list-inside list-disc">
                      {Object.entries(errors).map(([key, error]) => (
                        <li key={key}>
                          <a href={`#inquiry-${key}`} className="underline">
                            {error.message}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                  {unavailable && (
                    <p className="mt-2">
                      <Link
                        href="/properties?purpose=sale"
                        className="underline"
                      >
                        Browse listings
                      </Link>
                    </p>
                  )}
                </AlertDescription>
              </Alert>
            </div>
          )}
          {(["name", "phone", "email"] as const).map((key) => (
            <TextField
              key={key}
              id={`inquiry-${key}`}
              label={
                key === "name" ? "Name" : key === "phone" ? "Phone" : "Email"
              }
              {...register(key)}
              type={
                key === "phone" ? "tel" : key === "email" ? "email" : "text"
              }
              autoComplete={key === "phone" ? "tel" : key}
              disabled={!ready || busy || uncertain}
              error={errors[key]?.message}
              help={
                key === "phone"
                  ? "Provide a phone number or email address."
                  : undefined
              }
              maxLength={
                key === "name" ? 120 : key === "email" ? 254 : undefined
              }
            />
          ))}
          <TextareaField
            id="inquiry-message"
            label="Message (optional)"
            {...register("message")}
            rows={4}
            maxLength={2000}
            disabled={!ready || busy || uncertain}
            error={errors.message?.message}
          />
          <p className="text-xs leading-5 text-muted-foreground">
            Your details will be used to respond to this property inquiry.
          </p>
          <SubmitButton
            className="w-full"
            pending={busy}
            label={uncertain ? "Retry same inquiry" : "Send inquiry"}
            pendingLabel="Sending inquiry…"
            disabled={!ready || unavailable}
          />
        </form>
      )}
    </aside>
  );
}
