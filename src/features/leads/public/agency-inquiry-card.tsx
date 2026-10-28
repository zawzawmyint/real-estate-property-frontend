"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  TextField,
  SelectField,
  TextareaField,
} from "@/components/forms/fields";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useClientReady } from "@/lib/use-client-ready";
import {
  agencyInquiryFormSchema,
  type AgencyInquiryValues,
} from "../data/input";
import { sendAgencyInquiry } from "../data/actions";
import { receiptAfterFailure } from "../data/submissions";

const initialValues = { name: "", phone: "", email: "", message: "" };

export function AgencyInquiryCard({
  isDemo = null,
  showDemoNotice = true,
}: {
  isDemo?: boolean | null;
  showDemoNotice?: boolean;
}) {
  const ready = useClientReady();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [editConfirmation, setEditConfirmation] = useState(false);
  const [retryAt, setRetryAt] = useState<number>();
  const [retrySeconds, setRetrySeconds] = useState(0);
  const guard = useRef(false);
  const receipt = useRef<
    { id: string; values: AgencyInquiryValues } | undefined
  >(undefined);
  const summary = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const form = useForm<AgencyInquiryValues>({
    resolver: zodResolver(agencyInquiryFormSchema),
    shouldFocusError: false,
    defaultValues: initialValues,
  });
  const {
    register,
    formState: { errors, isSubmitting },
  } = form;
  const busy = pending || isSubmitting;

  useEffect(() => {
    if (success) successRef.current?.focus();
  }, [success]);
  useEffect(() => {
    if (!retryAt) return;
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((retryAt - Date.now()) / 1000));
      setRetrySeconds(remaining);
      if (remaining === 0) {
        setRetryAt(undefined);
        clearInterval(timer);
      }
    }, 500);
    return () => clearInterval(timer);
  }, [retryAt]);

  async function save(values: AgencyInquiryValues) {
    if (!receipt.current) receipt.current = { id: crypto.randomUUID(), values };
    const submitted = receipt.current;
    startTransition(async () => {
      try {
        const result = await sendAgencyInquiry({
          submissionId: submitted.id,
          name: submitted.values.name,
          purpose: submitted.values.purpose,
          phone: submitted.values.phone || null,
          email: submitted.values.email || null,
          message: submitted.values.message,
        });
        if (result.ok) {
          setSuccess(true);
          setUncertain(false);
          setMessage("");
          return;
        }
        receipt.current = receiptAfterFailure(
          receipt.current,
          uncertain,
          result.error,
        );
        if (uncertain || result.error.uncertain) {
          setUncertain(true);
          setMessage(
            "We could not confirm whether your enquiry was saved. Your details are preserved. Retry the same enquiry to safely confirm its receipt.",
          );
        } else setMessage(result.error.message);
        if (result.error.status === 429) {
          const seconds = result.error.retryAfter || 900;
          setRetryAt(Date.now() + seconds * 1000);
          setRetrySeconds(seconds);
          setMessage(
            uncertain
              ? "The earlier enquiry may already be saved. Please wait before retrying the same enquiry; your details are preserved."
              : "You have reached the enquiry limit. Please wait before trying again; your details are preserved.",
          );
        }
        requestAnimationFrame(() => summary.current?.focus());
      } catch {
        setUncertain(true);
        setMessage(
          "We could not confirm whether your enquiry was saved. Your details are preserved. Retry the same enquiry to safely confirm its receipt.",
        );
        requestAnimationFrame(() => summary.current?.focus());
      } finally {
        guard.current = false;
      }
    });
  }

  function beginAnother() {
    receipt.current = undefined;
    guard.current = false;
    setSuccess(false);
    setUncertain(false);
    setMessage("");
    form.reset({ ...initialValues, purpose: undefined });
    requestAnimationFrame(() =>
      document.getElementById("agency-name")?.focus(),
    );
  }

  return (
    <section
      aria-labelledby="agency-inquiry-heading"
      aria-describedby={isDemo === null ? "agency-mode-notice" : undefined}
      className="min-w-0 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-8 lg:p-10"
    >
      <p className="mb-3 text-[11px] font-semibold tracking-[0.18em] text-primary uppercase">
        A conversation starts here
      </p>
      <h2
        id="agency-inquiry-heading"
        className="display-heading text-3xl leading-tight sm:text-4xl"
      >
        Send a property enquiry
      </h2>
      <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
        Tell us a little about your next move. You don’t need a particular
        property in mind.
      </p>
      {isDemo === null && (
        <p
          id="agency-mode-notice"
          className="mt-4 rounded-lg border border-border bg-background px-4 py-3 text-sm leading-6 text-muted-foreground"
        >
          Agency details and demo status could not be confirmed. Try loading the
          agency details again before sharing personal contact information. If
          you are testing a demonstration, use fictional details.
        </p>
      )}
      {isDemo && showDemoNotice && (
        <p className="mt-4 rounded-lg border border-border bg-background px-4 py-3 text-xs leading-6 text-muted-foreground">
          This is a demonstration. Please use fictional contact details.
        </p>
      )}
      {success ? (
        <div
          ref={successRef}
          role="status"
          tabIndex={-1}
          className="mt-8 rounded-xl border border-border bg-background p-6 outline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
        >
          <span
            aria-hidden="true"
            className="mb-5 inline-flex size-12 items-center justify-center rounded-full bg-primary text-xl text-primary-foreground"
          >
            ✓
          </span>
          <h3 className="display-heading text-2xl">
            Your enquiry has been received.
          </h3>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            {isDemo
              ? "Your demo enquiry has been saved. No real agent will contact you."
              : isDemo === false
                ? "Our team will follow up using the details you provided."
                : "Your enquiry has been saved. Agency details are still unavailable, so follow-up cannot be confirmed."}
          </p>
          <Button
            variant="outline"
            className="mt-6 bg-card"
            onClick={beginAnother}
          >
            Send another enquiry
          </Button>
        </div>
      ) : (
        <form
          noValidate
          aria-busy={busy}
          className="mt-8 space-y-6"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!ready || guard.current || busy || retrySeconds > 0) return;
            guard.current = true;
            setMessage("");
            if (uncertain && receipt.current) {
              await save(receipt.current.values);
              return;
            }
            const data = new FormData(event.currentTarget);
            for (const key of ["name", "phone", "email", "message"] as const)
              form.setValue(key, String(data.get(key) || ""));
            form.setValue(
              "purpose",
              String(
                data.get("purpose") || "",
              ) as AgencyInquiryValues["purpose"],
            );
            await form.handleSubmit(save, () => {
              guard.current = false;
              setMessage("Check the highlighted fields.");
              requestAnimationFrame(() => summary.current?.focus());
            })(event);
          }}
        >
          {message && (
            <div
              ref={summary}
              tabIndex={-1}
              className="outline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
            >
              <Alert variant="destructive">
                <AlertDescription>
                  {message}
                  {Object.keys(errors).length > 0 && (
                    <ul className="mt-2 list-inside list-disc">
                      {Object.entries(errors).map(([key, error]) => (
                        <li key={key}>
                          <a
                            href={`#agency-${key}`}
                            className="underline underline-offset-4"
                          >
                            {error.message}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </AlertDescription>
              </Alert>
            </div>
          )}
          {retrySeconds > 0 && (
            <p role="status" className="text-sm text-primary">
              You can try again in {Math.floor(retrySeconds / 60)}:
              {String(retrySeconds % 60).padStart(2, "0")}.
            </p>
          )}
          <fieldset
            disabled={!ready || busy || uncertain}
            className="min-w-0 space-y-5"
          >
            <legend className="sr-only">Enquiry details</legend>
            <div className="grid min-w-0 gap-5 sm:grid-cols-2">
              <TextField
                id="agency-name"
                label="Full name"
                {...register("name")}
                autoComplete="name"
                required
                maxLength={120}
                error={errors.name?.message}
              />
              <SelectField
                id="agency-purpose"
                label="I'm looking to"
                {...register("purpose")}
                defaultValue=""
                required
                error={errors.purpose?.message}
              >
                <option value="" disabled>
                  Select buy or rent
                </option>
                <option value="sale">Buy a property</option>
                <option value="rent">Rent a property</option>
              </SelectField>
            </div>
            <p
              id="agency-contact-help"
              className="text-xs leading-6 text-muted-foreground"
            >
              {isDemo === null
                ? "Enter a phone number or email to submit your enquiry."
                : "Enter a phone number or email so we can reply."}
            </p>
            <div className="grid min-w-0 gap-5 sm:grid-cols-2">
              <TextField
                id="agency-phone"
                label="Phone"
                type="tel"
                {...register("phone")}
                autoComplete="tel"
                aria-describedby="agency-contact-help"
                error={errors.phone?.message}
              />
              <TextField
                id="agency-email"
                label="Email"
                type="email"
                {...register("email")}
                autoComplete="email"
                maxLength={254}
                aria-describedby="agency-contact-help"
                error={errors.email?.message}
              />
            </div>
            <TextareaField
              id="agency-message"
              label="Message"
              {...register("message")}
              rows={5}
              required
              maxLength={2000}
              placeholder="Tell us about the home, neighbourhood or next step you have in mind."
              error={errors.message?.message}
            />
          </fieldset>
          <div className="border-t border-border pt-5">
            <p className="mb-5 max-w-xl text-xs leading-6 text-muted-foreground">
              {isDemo === null
                ? "Submitting this form records the contact details and message you enter. Share only the information needed for your enquiry."
                : "Your details will be used to respond to this property enquiry."}
              {isDemo
                ? " Demonstration messages are recorded for this demo only."
                : ""}
            </p>
            <SubmitButton
              pending={busy}
              label={uncertain ? "Retry same enquiry" : "Send enquiry"}
              pendingLabel="Sending enquiry…"
              disabled={!ready || retrySeconds > 0}
              className="w-full sm:w-auto sm:min-w-48"
            />
            {uncertain && (
              <Button
                variant="ghost"
                disabled={busy || !ready}
                className="mt-3 w-full sm:ms-2 sm:mt-0 sm:w-auto"
                onClick={() => setEditConfirmation(true)}
              >
                Edit as a new enquiry
              </Button>
            )}
          </div>
        </form>
      )}
      <Dialog open={editConfirmation} onOpenChange={setEditConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start a different enquiry?</DialogTitle>
            <DialogDescription>
              Your earlier enquiry may already be saved. Sending edited details
              will create a separate enquiry. Retry the same enquiry if you only
              want to confirm its receipt.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditConfirmation(false)}
            >
              Keep original enquiry
            </Button>
            <Button
              onClick={() => {
                receipt.current = undefined;
                setUncertain(false);
                setMessage("");
                setEditConfirmation(false);
                requestAnimationFrame(() =>
                  document.getElementById("agency-name")?.focus(),
                );
              }}
            >
              Edit as new enquiry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
