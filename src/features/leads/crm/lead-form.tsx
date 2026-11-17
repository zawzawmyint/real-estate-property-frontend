"use client";
import { buttonVariants } from "@/components/ui/button-variants";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { useClientReady } from "@/lib/use-client-ready";
import {
  budgetToFils,
  leadFormSchema,
  type LeadFormValues,
} from "../data/input";
import { createLead, updateLead } from "../data/actions";
import { getLead } from "../data/queries";
import type { ActionError, LeadDetail } from "../data/types";
import { receiptAfterFailure } from "../data/submissions";
import { LeadFormFields } from "./lead-form-fields";
import { useDirtyForm } from "./use-dirty-form";
import { checkLeadDuplicates } from "../data/duplicate-actions";
import type { DuplicateReview } from "../data/duplicate-types";
import { LeadDuplicateWarning } from "./lead-duplicate-warning";
function defaults(lead?: LeadDetail): LeadFormValues {
  return {
    name: lead?.name || "",
    phone: lead?.phone || "",
    email: lead?.email || "",
    purpose: lead?.purpose || "sale",
    budget: lead?.budgetFils ? (lead.budgetFils / 100).toString() : "",
    propertyId: lead?.property?.id || "",
    source: lead?.source === "walk_in" ? "walk_in" : "call",
    assignedAgentId: lead?.assignedAgent?.id || "",
  };
}
export function LeadForm({
  initialLead,
  manager,
}: {
  initialLead?: LeadDetail;
  manager: boolean;
}) {
  const ready = useClientReady();
  const router = useRouter();
  const [lead, setLead] = useState(initialLead);
  const [message, setMessage] = useState("");
  const [denied, setDenied] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [needsReview, setNeedsReview] = useState(false);
  const [reviewLoaded, setReviewLoaded] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [pending, startTransition] = useTransition();
  const [, startPhoneTransition] = useTransition();
  const guard = useRef(false);
  const duplicateGeneration = useRef(0);
  const [duplicate, setDuplicate] = useState<{
    phone: string;
    review: DuplicateReview;
    acknowledged: boolean;
  }>();
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [duplicateError, setDuplicateError] = useState("");
  const baselineCanonical = useRef<string | undefined>(undefined);
  const receipt = useRef<{ id: string; payload: unknown } | undefined>(
    undefined,
  );
  const summary = useRef<HTMLDivElement>(null);
  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: defaults(initialLead),
  });
  const busy = pending || form.formState.isSubmitting;
  useEffect(() => {
    if (message && !busy) summary.current?.focus();
  }, [message, busy]);
  useDirtyForm(form.formState.isDirty && !navigating);
  function resetDuplicate() {
    duplicateGeneration.current++;
    setDuplicate(undefined);
    setDuplicateError("");
    setCheckingPhone(false);
  }
  async function checkPhone(
    phone: string,
  ): Promise<DuplicateReview | undefined> {
    if (!phone || (lead && phone === lead.phone)) return undefined;
    const generation = ++duplicateGeneration.current;
    setCheckingPhone(true);
    setDuplicateError("");
    try {
      const result = await checkLeadDuplicates({
        phone,
        ...(lead ? { excludeLeadId: lead.id } : {}),
      });
      if (
        generation !== duplicateGeneration.current ||
        form.getValues("phone").trim() !== phone
      )
        return undefined;
      if (!result.ok) {
        setDuplicate(undefined);
        setDuplicateError(result.error.message);
        return undefined;
      }
      if (lead?.phone && !baselineCanonical.current) {
        const baseline = await checkLeadDuplicates({
          phone: lead.phone,
          excludeLeadId: lead.id,
        });
        if (baseline.ok)
          baselineCanonical.current = baseline.data.canonicalPhone;
      }
      if (
        generation !== duplicateGeneration.current ||
        form.getValues("phone").trim() !== phone
      )
        return undefined;
      const review = result.data;
      if (lead && baselineCanonical.current === review.canonicalPhone) {
        setDuplicate(undefined);
        return undefined;
      }
      setDuplicate({ phone, review, acknowledged: false });
      return review;
    } catch {
      if (
        generation === duplicateGeneration.current &&
        form.getValues("phone").trim() === phone
      )
        setDuplicateError(
          "Matching leads could not be checked. Retry the check.",
        );
      return undefined;
    } finally {
      if (generation === duplicateGeneration.current) setCheckingPhone(false);
    }
  }
  function fail(error: ActionError) {
    setMessage(error.message);
    for (const [key, messages] of Object.entries(error.fieldErrors || {})) {
      const field = key === "budgetFils" ? "budget" : key;
      if (field in form.getValues())
        form.setError(field as keyof LeadFormValues, {
          message: messages.join(" "),
        });
    }
  }
  async function reconcile() {
    if (!lead) return;
    try {
      const fresh = await getLead(lead.id);
      setLead(fresh);
      setReviewLoaded(true);
      setNeedsReview(true);
      setMessage(
        "This lead changed. Your draft is preserved. Review the latest saved details below before explicitly saving again.",
      );
    } catch (error) {
      setReviewLoaded(false);
      if (
        error instanceof Error &&
        "status" in error &&
        [403, 404].includes(Number(error.status))
      ) {
        setDenied(true);
        return;
      }
      setNeedsReview(true);
      setMessage(
        "Refresh could not be completed. Reload the latest lead before saving.",
      );
    }
  }
  async function save(values: LeadFormValues) {
    startTransition(async () => {
      try {
        const phone = values.phone.trim();
        let currentDuplicate =
          duplicate?.phone === phone ? duplicate : undefined;
        if (
          !uncertain &&
          phone &&
          (!lead || phone !== lead.phone) &&
          !currentDuplicate
        ) {
          const review = await checkPhone(phone);
          if (review?.totalMatches) {
            fail({
              code: "LEAD_DUPLICATE_REVIEW_REQUIRED",
              message:
                "Review matching leads and acknowledge before saving a separate lead.",
            });
            return;
          }
          currentDuplicate = undefined;
        }
        if (
          !uncertain &&
          currentDuplicate?.review.totalMatches &&
          !currentDuplicate.acknowledged
        ) {
          fail({
            code: "LEAD_DUPLICATE_REVIEW_REQUIRED",
            message: "Acknowledge the matching phone number before saving.",
          });
          return;
        }
        const duplicateAcknowledgement = currentDuplicate?.acknowledged
          ? { reviewToken: currentDuplicate.review.reviewToken }
          : undefined;
        const input = {
          name: values.name,
          phone: values.phone || null,
          email: values.email || null,
          purpose: values.purpose,
          budgetFils: budgetToFils(values.budget),
          propertyId: values.propertyId || null,
        };
        let result;
        if (lead) {
          const { propertyId, ...rest } = input;
          const unchangedUnavailable =
            lead.property &&
            !lead.property.available &&
            propertyId === lead.property.id;
          result = await updateLead(lead.id, {
            ...rest,
            ...(!unchangedUnavailable ? { propertyId } : {}),
            expectedVersion: lead.version,
            ...(duplicateAcknowledgement ? { duplicateAcknowledgement } : {}),
          });
        } else {
          if (!receipt.current || !uncertain)
            receipt.current = {
              id: receipt.current?.id ?? crypto.randomUUID(),
              payload: {
                ...input,
                source: values.source,
                ...(manager
                  ? { assignedAgentId: values.assignedAgentId || null }
                  : {}),
              },
            };
          result = await createLead({
            ...(receipt.current.payload as Parameters<typeof createLead>[0]),
            submissionId: receipt.current.id,
            ...(duplicateAcknowledgement ? { duplicateAcknowledgement } : {}),
          });
        }
        if (!result.ok) {
          if (result.error.code === "LEAD_DUPLICATE_REVIEW_REQUIRED") {
            setDuplicate(
              result.error.duplicateReview
                ? {
                    phone,
                    review: result.error.duplicateReview,
                    acknowledged: false,
                  }
                : undefined,
            );
            fail(result.error);
            return;
          }
          if ([403, 404].includes(result.error.status || 0) && lead) {
            setDenied(true);
            return;
          }
          if (lead && (result.error.status === 409 || result.error.uncertain)) {
            await reconcile();
            return;
          }
          if (result.error.uncertain) setUncertain(true);
          receipt.current = receiptAfterFailure(
            receipt.current,
            uncertain,
            result.error,
          );
          fail(result.error);
          return;
        }
        setNavigating(true);
        form.reset(defaults(result.data));
        startTransition(() =>
          router.replace(`/crm/leads/${result.data.id}?saved=1`),
        );
      } catch {
        if (lead) await reconcile();
        else {
          setUncertain(true);
          setMessage(
            "The save could not be confirmed. Your entries and submission key have been preserved. Explicitly retry to reconcile the same lead.",
          );
        }
      } finally {
        guard.current = false;
      }
    });
  }
  if (denied)
    return (
      <Alert>
        <AlertDescription>
          This lead is no longer available to your account.{" "}
          <Link href="/crm/leads?view=mine" className="underline">
            My leads
          </Link>
        </AlertDescription>
      </Alert>
    );
  return (
    <form
      noValidate
      onSubmit={async (event) => {
        event.preventDefault();
        if (guard.current || busy || needsReview || !ready) return;
        guard.current = true;
        setMessage("");
        const data = new FormData(event.currentTarget);
        for (const key of [
          "name",
          "phone",
          "email",
          "budget",
          "purpose",
          "source",
        ] as const)
          if (data.has(key)) form.setValue(key, String(data.get(key)) as never);
        await form.handleSubmit(save, () => {
          guard.current = false;
          setMessage("Check the highlighted fields.");
          requestAnimationFrame(() => summary.current?.focus());
        })(event);
      }}
      className="max-w-[880px] space-y-6"
      aria-busy={busy}
    >
      {message && (
        <div ref={summary} tabIndex={-1} className="outline-none">
          <Alert variant="destructive">
            <AlertDescription>
              <p>{message}</p>
              {Object.entries(form.formState.errors).length > 0 && (
                <ul className="mt-2 list-inside list-disc">
                  {Object.entries(form.formState.errors).map(([key, error]) => (
                    <li key={key}>
                      <a className="underline" href={`#lead-${key}`}>
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
      {needsReview && lead && (
        <section className="space-y-3 rounded-xl border border-border bg-muted p-5">
          <h2 className="font-semibold">Latest saved details</h2>
          <p className="break-words text-sm">
            {lead.name} · {lead.phone || lead.email} ·{" "}
            {lead.purpose === "rent" ? "Rent" : "Buy"}
          </p>
          <p className="break-words text-sm">
            {lead.property?.title || "No property selected"}
          </p>
          <p className="break-words text-sm">
            {lead.email || "No email provided"} ·{" "}
            {lead.phone || "No phone provided"}
          </p>
          <p className="break-words text-sm">
            Budget:{" "}
            {lead.budgetFils === null
              ? "No budget specified"
              : `AED ${lead.budgetFils / 100}`}
          </p>
          <Button
            type="button"
            variant="outline"
            disabled={!reviewLoaded}
            onClick={() => {
              setNeedsReview(false);
              setMessage(
                "Latest version reviewed. Save again to apply your preserved draft.",
              );
            }}
          >
            I have reviewed the latest version
          </Button>
          {!reviewLoaded && (
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() =>
                startTransition(async () => {
                  await reconcile();
                })
              }
            >
              Reload latest lead
            </Button>
          )}
        </section>
      )}
      <LeadFormFields
        form={form}
        disabled={!ready || busy || uncertain || needsReview}
        lead={lead}
        manager={manager}
        onPhoneChange={resetDuplicate}
        onPhoneBlur={() =>
          startPhoneTransition(async () => {
            await checkPhone(form.getValues("phone").trim());
          })
        }
      />
      <div role="status" aria-live="polite" className="text-sm">
        {checkingPhone ? "Checking matching leads…" : duplicateError}
      </div>
      {duplicateError && (
        <Button
          type="button"
          variant="outline"
          disabled={busy || !ready}
          onClick={() =>
            startPhoneTransition(async () => {
              await checkPhone(form.getValues("phone").trim());
            })
          }
        >
          Retry phone check
        </Button>
      )}
      {duplicate && (
        <LeadDuplicateWarning
          review={duplicate.review}
          acknowledged={duplicate.acknowledged}
          disabled={busy || !ready}
          onAcknowledge={(acknowledged) =>
            setDuplicate({ ...duplicate, acknowledged })
          }
        />
      )}
      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-6">
        <SubmitButton
          pending={busy}
          disabled={!ready || needsReview || navigating}
          label={
            uncertain ? "Retry same lead" : lead ? "Save changes" : "Save lead"
          }
          pendingLabel="Saving lead…"
        />
        <Link
          href={lead ? `/crm/leads/${lead.id}` : "/crm/leads"}
          className={buttonVariants({ variant: "outline" })}
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
