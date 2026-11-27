"use client";

import { useState, useId } from "react";
import { Button } from "@/components/ui/button";
import { auditValue, readable } from "./filters";
import type { AuditEvent } from "./response";

export function ChangeDetails({ changes }: { changes: AuditEvent["changes"] }) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
      >
        {open ? "Hide changes" : "Show changes"}
      </Button>
      <div
        hidden={!open}
        id={id}
        className="mt-2 max-w-sm whitespace-normal wrap-anywhere"
      >
        {changes.length ? (
          <dl className="grid gap-2">
            {changes.map((change) => (
              <div key={change.field}>
                <dt className="font-semibold">{readable(change.field)}</dt>
                <dd>
                  {change.redacted ? (
                    "Value hidden"
                  ) : (
                    <>
                      Before: {auditValue(change.field, change.before)}
                      <br />
                      After: {auditValue(change.field, change.after)}
                    </>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p>No field changes recorded.</p>
        )}
      </div>
    </div>
  );
}
