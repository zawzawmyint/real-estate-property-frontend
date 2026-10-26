"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useClientReady } from "@/lib/use-client-ready";
import { assignLead } from "../data/actions";
import { getLead } from "../data/queries";
import type { LeadDetail, LeadSummary } from "../data/types";
import { SearchPicker } from "./search-picker";
import { assigneeLabel } from "./lead-presentation";

export function AssignmentDialog({
  lead,
  onSaved,
}: {
  lead: LeadSummary;
  onSaved?: (lead: LeadDetail, message: string) => void;
}) {
  const ready = useClientReady();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(lead);
  const [selected, setSelected] = useState(lead.assignedAgent?.id || "");
  const [selectionName, setSelectionName] = useState(
    lead.assignedAgent?.name || "",
  );
  const [error, setError] = useState("");
  const [mustReload, setMustReload] = useState(false);
  const [pending, startTransition] = useTransition();
  const guard = useRef(false);
  function changeOpen(next: boolean) {
    if (pending) return;
    setOpen(next);
    if (next) {
      setCurrent(lead);
      setSelected(lead.assignedAgent?.id || "");
      setSelectionName(lead.assignedAgent?.name || "");
      setError("");
    }
  }
  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger
        render={<Button type="button" variant="outline" disabled={!ready} />}
      >
        {lead.assignedAgent ? "Reassign agent" : "Assign agent"}
      </DialogTrigger>
      <DialogContent
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto p-6 sm:max-w-[480px]"
        showCloseButton={!pending}
      >
        <DialogHeader>
          <DialogTitle>
            {current.assignedAgent ? "Reassign agent" : "Assign agent"}
          </DialogTitle>
          <DialogDescription>
            Choose an active agent to follow up, or move this lead to
            Unassigned.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg bg-muted p-4">
          <p className="font-semibold break-words">{current.name}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Current: {assigneeLabel(current)}
          </p>
        </div>
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (
              guard.current ||
              pending ||
              mustReload ||
              selected === (current.assignedAgent?.id || "")
            )
              return;
            guard.current = true;
            setError("");
            startTransition(async () => {
              try {
                const result = await assignLead(current.id, {
                  expectedVersion: current.version,
                  assignedAgentId: selected || null,
                });
                if (!result.ok) {
                  if (result.error.status === 409 || result.error.uncertain) {
                    const fresh = await getLead(current.id);
                    setCurrent(fresh);
                    setError(
                      "This lead changed. Review the current assignment and explicitly save again.",
                    );
                  } else setError(result.error.message);
                  return;
                }
                const message = selected
                  ? `Lead assigned to ${selectionName}`
                  : "Lead moved to Unassigned";
                onSaved?.(result.data, message);
                setOpen(false);
                startTransition(() => router.refresh());
              } catch {
                setMustReload(true);
                setError(
                  "The assignment could not be confirmed. Reload the latest assignment before trying again.",
                );
              } finally {
                guard.current = false;
              }
            });
          }}
        >
          <SearchPicker
            kind="agent"
            value={selected}
            currentLabel={selectionName}
            disabled={pending}
            onChange={(value, option) => {
              setSelected(value);
              setSelectionName(option?.name || "");
            }}
          />
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <DialogFooter className="-mx-6 -mb-6 p-6">
            {mustReload && (
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    try {
                      setCurrent(await getLead(current.id));
                      setMustReload(false);
                      setError(
                        "Latest assignment loaded. Review and explicitly save your selection again.",
                      );
                    } catch {
                      setError(
                        "The latest assignment is unavailable. Try reloading again before saving.",
                      );
                    }
                  })
                }
              >
                Reload latest assignment
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <SubmitButton
              pending={pending}
              label={current.assignedAgent ? "Save assignment" : "Assign agent"}
              pendingLabel="Saving assignment…"
              disabled={
                mustReload || selected === (current.assignedAgent?.id || "")
              }
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
