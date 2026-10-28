"use client";

import { useDroppable } from "@dnd-kit/react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { stageLabels } from "../../data/input";
import type { PipelineColumnData, PipelineStage } from "../../data/pipeline";
import type { LeadSummary } from "../../data/types";
import { PipelineLeadCard } from "./pipeline-lead-card";

const stageDescription: Record<PipelineStage, string> = {
  new: "A new opportunity",
  contacted: "Conversation started",
  viewing_scheduled: "Ready for a closer look",
  offer: "Finding the right terms",
  won: "A successful connection",
  lost: "Closed for now",
};

export function PipelineColumn({
  column,
  active,
  disabled,
  readDisabled,
  pendingLeadId,
  loading,
  onMove,
  onLoadMore,
}: {
  column: PipelineColumnData;
  active: boolean;
  disabled: boolean;
  readDisabled: boolean;
  pendingLeadId: string | null;
  loading: boolean;
  onMove: (lead: LeadSummary, stage: PipelineStage) => void;
  onLoadMore: () => void;
}) {
  const { stage, result, error } = column;
  const { ref, isDropTarget } = useDroppable({
    id: stage,
    type: "column",
    accept: "lead",
    data: { stage },
    disabled: disabled || !result,
  });
  return (
    <section
      ref={ref}
      aria-labelledby={`pipeline-${stage}`}
      aria-busy={loading}
      data-stage={stage}
      className={cn(
        "w-full min-w-0 flex-col rounded-2xl border border-border bg-muted/40 p-3 md:flex md:w-72 md:shrink-0",
        active ? "flex" : "hidden",
        isDropTarget &&
          "border-dashed border-primary bg-primary/5 ring-2 ring-primary/20",
      )}
    >
      <header className="mb-4 px-1 pt-2">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className={cn(
              "size-2.5 rounded-full",
              stage === "won"
                ? "bg-primary"
                : stage === "lost"
                  ? "border-2 border-muted-foreground"
                  : "bg-primary/50",
            )}
          />
          <h2
            id={`pipeline-${stage}`}
            className="min-w-0 flex-1 text-sm font-semibold"
          >
            {stageLabels[stage]}
          </h2>
          <span
            aria-label={`${result?.total ?? "Unknown"} leads in ${stageLabels[stage]}`}
            className="flex min-h-7 min-w-7 items-center justify-center rounded-lg border border-border bg-card px-2 text-xs font-semibold tabular-nums"
          >
            {result?.total ?? "—"}
          </span>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          {isDropTarget ? "Release to move here" : stageDescription[stage]}
        </p>
      </header>
      <div className="flex flex-1 flex-col gap-3">
        {result?.items.map((lead, index) => (
          <PipelineLeadCard
            key={lead.id}
            lead={lead}
            index={index}
            disabled={disabled || !result}
            pending={pendingLeadId === lead.id}
            onMove={onMove}
          />
        ))}
        {result && result.items.length === 0 && (
          <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-border px-4 text-center">
            <span
              aria-hidden="true"
              className="mb-3 flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground"
            >
              —
            </span>
            <p className="text-xs font-medium">
              No leads in {stageLabels[stage]}
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
              Leads moved here will appear in this stage.
            </p>
          </div>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              {error}
              <Button
                variant="ghost"
                disabled={readDisabled}
                onClick={onLoadMore}
              >
                Retry {stageLabels[stage]}
              </Button>
            </AlertDescription>
          </Alert>
        )}
        {result && result.page * result.pageSize < result.total && !error && (
          <Button
            variant="outline"
            disabled={readDisabled}
            onClick={onLoadMore}
            className="mt-1 w-full bg-card text-xs"
          >
            {loading
              ? "Loading…"
              : `Load more · ${result.items.length} of ${result.total}`}
          </Button>
        )}
      </div>
    </section>
  );
}
