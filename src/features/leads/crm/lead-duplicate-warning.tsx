"use client";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { stageLabels } from "../data/input";
import type { DuplicateReview } from "../data/duplicate-types";

export function LeadDuplicateWarning({
  review,
  acknowledged,
  onAcknowledge,
  disabled,
}: {
  review: DuplicateReview;
  acknowledged?: boolean;
  onAcknowledge?: (value: boolean) => void;
  disabled?: boolean;
}) {
  if (!review.totalMatches)
    return (
      <p role="status" className="text-sm text-muted-foreground">
        No matching leads are available to your account.
      </p>
    );
  return (
    <Alert role="status" aria-live="polite">
      <AlertDescription>
        <p className="font-semibold">Possible duplicate phone number</p>
        <p className="mt-2">
          {review.totalMatches} other{" "}
          {review.totalMatches === 1 ? "lead uses" : "leads use"} this phone
          number. A shared number can represent a separate opportunity.
        </p>
        <ul className="my-3 space-y-2">
          {review.matches.map((match) => (
            <li key={match.id} className="break-words">
              <Link
                className="font-medium underline"
                href={`/crm/leads/${match.id}`}
                aria-label={match.name}
                aria-describedby={`duplicate-${match.id}-new-tab`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {match.name}
                <span id={`duplicate-${match.id}-new-tab`} className="sr-only">
                  {" "}
                  (opens in a new tab)
                </span>
              </Link>
              {" · "}
              {match.phone}
              {" · "}
              {stageLabels[match.stage]}
              {" · "}
              {match.assignedAgent?.name || "Unassigned"}
            </li>
          ))}
        </ul>
        {review.truncated && (
          <p>
            Showing the first {review.matches.length} matches of{" "}
            {review.totalMatches}. The check includes every accessible match.
          </p>
        )}
        {onAcknowledge && (
          <label className="mt-4 flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 size-4 shrink-0 accent-primary"
              checked={acknowledged ?? false}
              disabled={disabled}
              onChange={(event) => onAcknowledge(event.target.checked)}
            />
            <span>
              I reviewed the matches and want to save a separate lead.
            </span>
          </label>
        )}
      </AlertDescription>
    </Alert>
  );
}
