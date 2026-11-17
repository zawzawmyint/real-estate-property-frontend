"use client";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { ImportDuplicateReview } from "../data/duplicate-types";

export function LeadImportDuplicateWarning({
  review,
  acknowledged,
  onChange,
  disabled,
}: {
  review: ImportDuplicateReview;
  acknowledged: boolean;
  onChange: (value: boolean) => void;
  disabled: boolean;
}) {
  if (!review.affectedRows) return null;
  return (
    <Alert role="status" aria-live="polite">
      <AlertDescription>
        <p className="font-semibold">Possible duplicate phone numbers</p>
        <p className="mt-2">
          {review.affectedRows} rows have matching phone numbers:{" "}
          {review.existingMatchRows} match existing leads and{" "}
          {review.withinFileRows} match other rows in this file. These counts
          can overlap. Every valid row will create a separate lead.
        </p>
        <ul className="my-3 max-h-80 space-y-3 overflow-auto break-words">
          {review.warnings.map((warning) => (
            <li key={warning.rowNumber}>
              <p>
                Row {warning.rowNumber}: {warning.canonicalPhone}
              </p>
              {warning.existingMatchCount > 0 && (
                <p>
                  {warning.existingMatchCount} existing{" "}
                  {warning.existingMatchCount === 1 ? "match" : "matches"}:{" "}
                  {warning.matches.map((match, index) => (
                    <span key={match.id}>
                      {index > 0 ? ", " : ""}
                      <Link
                        className="underline"
                        href={`/crm/leads/${match.id}`}
                        aria-label={match.name}
                        aria-describedby={`duplicate-${warning.rowNumber}-${match.id}-new-tab`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {match.name}
                        <span
                          id={`duplicate-${warning.rowNumber}-${match.id}-new-tab`}
                          className="sr-only"
                        >
                          {" "}
                          (opens in a new tab)
                        </span>
                      </Link>
                    </span>
                  ))}
                  {warning.existingMatchCount > warning.matches.length
                    ? ` (showing ${warning.matches.length})`
                    : ""}
                </p>
              )}
              {warning.sameFileRowCount > 0 && (
                <p>
                  Also in rows {warning.sameFileRowNumbers.join(", ")}
                  {warning.sameFileRowCount > warning.sameFileRowNumbers.length
                    ? ` (showing ${warning.sameFileRowNumbers.length} of ${warning.sameFileRowCount})`
                    : ""}
                  .
                </p>
              )}
            </li>
          ))}
        </ul>
        {review.truncated && (
          <p>
            Showing {review.warnings.length} of {review.warningCount} warning
            rows. All rows were checked.
          </p>
        )}
        <label className="mt-4 flex items-start gap-3">
          <input
            type="checkbox"
            className="mt-1 size-4 shrink-0 accent-primary"
            disabled={disabled}
            checked={acknowledged}
            onChange={(event) => onChange(event.target.checked)}
          />
          <span>
            I reviewed the duplicate phone warnings and want to import every
            valid row as a separate lead.
          </span>
        </label>
      </AlertDescription>
    </Alert>
  );
}
