"use client";

import Link from "next/link";
import { DragDropProvider } from "@dnd-kit/react";
import { Accessibility, Feedback } from "@dnd-kit/dom";
import { isSortable } from "@dnd-kit/react/sortable";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/forms/fields";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Icon } from "@/components/ui/icon";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useClientReady } from "@/lib/use-client-ready";
import { stages, stageLabels } from "../../data/input";
import {
  pipelineHref,
  type PipelineColumnData,
  type PipelineStage,
} from "../../data/pipeline";
import type { LeadFilters } from "../../data/filters";
import { PipelineColumn } from "./pipeline-column";
import { usePipeline } from "./use-pipeline";
import { pipelineAccessibility, pipelineDropStage } from "./pipeline-drag";

// Persisted column updates must not race a return-to-source placeholder animation.
const pipelineFeedback = Feedback.configure({ dropAnimation: null });

export function PipelineBoard({
  initialColumns,
  filters,
}: {
  initialColumns: PipelineColumnData[];
  filters: LeadFilters;
}) {
  const ready = useClientReady();
  const board = usePipeline(initialColumns, filters);
  const total = board.columns.every((column) => column.result)
    ? board.columns.reduce(
        (sum, column) => sum + (column.result?.total || 0),
        0,
      )
    : null;
  const disabled =
    !ready || board.busy || board.reviewRequired || !!board.confirmation;
  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">
            Your opportunities
            <span className="ms-2 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-primary">
              {total === null
                ? "Partial results"
                : `${total} ${total === 1 ? "lead" : "leads"}`}
            </span>
          </h2>
          <p className="mt-1.5 text-xs text-muted-foreground">
            One clear view, from first inquiry to final decision.
          </p>
        </div>
        <Button
          variant="outline"
          disabled={!ready || board.busy || !!board.confirmation}
          onClick={() => void board.refresh()}
          className="gap-2 bg-card"
        >
          <Icon
            name="retry"
            className={
              board.loadingStage === "all" ? "motion-safe:animate-spin" : ""
            }
          />
          {board.loadingStage === "all" ? "Refreshing…" : "Refresh board"}
        </Button>
      </div>
      <p
        id="pipeline-drag-help"
        className="text-xs leading-relaxed text-muted-foreground"
      >
        <span className="hidden md:inline">
          Drag a card using its handle, or choose its stage below. Keyboard:
          Space to pick up, arrow keys to move, Space to drop, Escape to
          cancel.{" "}
        </span>
        Moving to Won or Lost asks for confirmation.
      </p>
      <div className="min-h-12">
        <p
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className={
            board.announcement
              ? "rounded-lg border border-border bg-card px-4 py-3 text-sm text-primary"
              : "sr-only"
          }
        >
          {board.announcement}
        </p>
      </div>
      {board.message && (
        <Alert variant="destructive">
          <AlertDescription>{board.message}</AlertDescription>
        </Alert>
      )}
      {board.reviewRequired && (
        <Alert>
          <AlertDescription>
            Some stages are unavailable. Refresh the board before making another
            move.
          </AlertDescription>
        </Alert>
      )}
      {total === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-card p-5">
          <p className="text-sm font-medium">No matching leads</p>
          <Link
            href={pipelineHref({ view: filters.view, page: 1, sort: "newest" })}
            className="inline-flex min-h-11 items-center text-sm text-primary underline underline-offset-4"
          >
            Clear filters
          </Link>
        </div>
      )}
      <div className="md:hidden">
        <SelectField
          id="pipeline-mobile-stage"
          label="View stage"
          value={board.mobileStage}
          onChange={(event) =>
            board.setMobileStage(event.target.value as PipelineStage)
          }
        >
          {board.columns.map((column) => (
            <option key={column.stage} value={column.stage}>
              {stageLabels[column.stage]} · {column.result?.total ?? "—"}
            </option>
          ))}
        </SelectField>
      </div>
      <DragDropProvider
        plugins={(defaults) => [
          ...defaults.filter(
            (plugin) => plugin !== Accessibility && plugin !== Feedback,
          ),
          pipelineAccessibility,
          pipelineFeedback,
        ]}
        onDragEnd={(event) => {
          if (event.canceled || disabled) return;
          const { source, target } = event.operation;
          if (!source || !target || !isSortable(source)) return;
          const destination = pipelineDropStage(event.operation);
          if (
            typeof destination !== "string" ||
            !stages.includes(destination as PipelineStage)
          )
            return;
          const lead = board.columns
            .flatMap((column) => column.result?.items || [])
            .find((item) => item.id === source.id);
          if (lead) board.move(lead, destination as PipelineStage);
        }}
      >
        <div
          role="region"
          aria-label="Sales pipeline stages"
          tabIndex={0}
          className="min-w-0 rounded-2xl outline-offset-4 focus-visible:outline-2 focus-visible:outline-ring md:overflow-x-auto md:pb-5"
        >
          <div className="flex min-w-0 gap-4 md:w-max">
            {board.columns.map((column) => (
              <PipelineColumn
                key={column.stage}
                column={column}
                active={board.mobileStage === column.stage}
                disabled={disabled}
                readDisabled={!ready || board.busy || !!board.confirmation}
                pendingLeadId={board.pendingLeadId}
                loading={
                  board.loadingStage === "all" ||
                  board.loadingStage === column.stage
                }
                onMove={board.move}
                onLoadMore={() =>
                  column.result
                    ? void board.loadMore(column.stage)
                    : void board.refresh()
                }
              />
            ))}
          </div>
        </div>
      </DragDropProvider>
      <Dialog
        open={!!board.confirmation}
        onOpenChange={(open) => {
          if (!open && !board.busy) board.setConfirmation(null);
        }}
      >
        <DialogContent showCloseButton={!board.busy}>
          <DialogHeader>
            <DialogTitle>
              Move to{" "}
              {board.confirmation
                ? stageLabels[board.confirmation.stage]
                : "stage"}
              ?
            </DialogTitle>
            <DialogDescription>
              This will mark {board.confirmation?.lead.name} as{" "}
              {board.confirmation ? stageLabels[board.confirmation.stage] : ""}{" "}
              and record the change in their activity timeline.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={board.busy}
              onClick={() => board.setConfirmation(null)}
            >
              Cancel
            </Button>
            <Button
              disabled={board.busy}
              onClick={() => {
                if (board.confirmation)
                  void board.saveMove(
                    board.confirmation.lead,
                    board.confirmation.stage,
                  );
              }}
            >
              {board.busy ? "Saving…" : "Confirm move"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
