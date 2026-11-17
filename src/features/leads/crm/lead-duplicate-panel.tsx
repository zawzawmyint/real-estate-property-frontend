"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { checkLeadDuplicates } from "../data/duplicate-actions";
import type { DuplicateReview } from "../data/duplicate-types";
import { LeadDuplicateWarning } from "./lead-duplicate-warning";

export function LeadDuplicatePanel({
  id,
  phone,
  count,
  disabled,
}: {
  id: string;
  phone: string | null;
  count: number;
  disabled: boolean;
}) {
  const [review, setReview] = useState<DuplicateReview>();
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  if (!phone) return null;
  return (
    <section className="space-y-3 rounded-xl border border-border bg-card p-5 sm:p-6">
      <h2 className="font-semibold">Phone duplicate review</h2>
      <p className="text-sm text-muted-foreground">
        {count > 0
          ? `${count} possible ${count === 1 ? "match" : "matches"} available to your account. `
          : "Check this phone number to review accessible matches. "}
        Older phone numbers may need correction before matching.
      </p>
      <Button
        type="button"
        variant="outline"
        disabled={disabled || pending}
        onClick={() =>
          startTransition(async () => {
            setMessage("");
            const result = await checkLeadDuplicates({
              phone,
              excludeLeadId: id,
            });
            if (result.ok) setReview(result.data);
            else {
              setReview(undefined);
              setMessage(
                result.error.code === "VALIDATION_ERROR"
                  ? "Correct this legacy phone number to a UAE local number or an international number with a country code before checking matches."
                  : result.error.message,
              );
            }
          })
        }
      >
        {pending ? "Checking matches…" : "Review matching leads"}
      </Button>
      <p role="status" className="text-sm">
        {message}
      </p>
      {review && <LeadDuplicateWarning review={review} />}
    </section>
  );
}
