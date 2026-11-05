"use client";
import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TextField, TextareaField } from "@/components/forms/fields";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { SubmitButton } from "@/components/ui/submit-button";
import { useClientReady } from "@/lib/use-client-ready";
import { inquiryFormSchema, type InquiryValues } from "../data/input";
import { sendInquiry } from "../data/actions";
import { receiptAfterFailure } from "../data/submissions";
export function PropertyInquiryCard({ propertyId }: { propertyId: string }) {
  const ready = useClientReady();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [editConfirmation, setEditConfirmation] = useState(false);
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
        receipt.current = receiptAfterFailure(
          receipt.current,
          uncertain,
          result.error,
        );
        if (result.error.status === 404) {
          setUnavailable(true);
          setMessage("This property is no longer accepting inquiries");
        } else if (result.error.status === 429) {
          const seconds = result.error.retryAfter || 900;
          setRetryAt(Date.now() + seconds * 1000);
          setMessage(
            `Too many inquiries. Please retry in ${Math.ceil(seconds / 60)} minute${seconds > 60 ? "s" : ""}.`,
          );
        } else {
          setMessage(result.error.message);
          if (result.error.uncertain) setUncertain(true);
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
    <aside className="property-inquiry-card" aria-labelledby="inquiry-heading">
      <h2 id="inquiry-heading" className="display-heading text-2xl">
        Enquire about this property
      </h2>
      <p className="mt-2 mb-5 text-sm leading-6 text-muted-foreground">
        Ask for more information or arrange a viewing.
      </p>
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
          className="space-y-4"
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
            if (uncertain && receipt.current) {
              await save(receipt.current.values);
              return;
            }
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
            rows={3}
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
          {uncertain && (
            <Button
              variant="outline"
              className="w-full"
              disabled={!ready || busy}
              onClick={() => setEditConfirmation(true)}
            >
              Edit as a new inquiry
            </Button>
          )}
        </form>
      )}
      <Dialog open={editConfirmation} onOpenChange={setEditConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start a different inquiry?</DialogTitle>
            <DialogDescription>
              Your earlier inquiry may already be saved. Sending edited details
              will create a separate inquiry. Retry the same inquiry if you only
              want to confirm its receipt.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditConfirmation(false)}
            >
              Keep original inquiry
            </Button>
            <Button
              onClick={() => {
                receipt.current = undefined;
                setUncertain(false);
                setMessage("");
                setEditConfirmation(false);
                requestAnimationFrame(() =>
                  document.getElementById("inquiry-name")?.focus(),
                );
              }}
            >
              Edit as new inquiry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
