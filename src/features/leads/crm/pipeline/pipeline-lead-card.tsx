"use client";

import Link from "next/link";
import { useSortable } from "@dnd-kit/react/sortable";
import { OptimisticSortingPlugin } from "@dnd-kit/dom/sortable";
import { NativeSelect } from "@/components/ui/native-select";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { stages, stageLabels } from "../../data/input";
import type { PipelineStage } from "../../data/pipeline";
import type { LeadSummary } from "../../data/types";
import {
  LeadDate,
  SourceBadge,
  budgetLabel,
  assigneeLabel,
} from "../lead-presentation";

export function PipelineLeadCard({
  lead,
  index,
  disabled,
  pending,
  onMove,
}: {
  lead: LeadSummary;
  index: number;
  disabled: boolean;
  pending: boolean;
  onMove: (lead: LeadSummary, stage: PipelineStage) => void;
}) {
  const { ref, handleRef, isDragSource } = useSortable({
    id: lead.id,
    index,
    group: lead.stage,
    type: "lead",
    accept: "lead",
    data: { stage: lead.stage, name: lead.name },
    disabled,
    transition: null,
    // Keep persisted columns intact while saving or canceling confirmation.
    plugins: (defaults) =>
      defaults.filter((plugin) => plugin !== OptimisticSortingPlugin),
  });
  return (
    <article
      ref={ref}
      aria-label={lead.name}
      aria-busy={pending}
      className={cn(
        "group min-w-0 rounded-xl border border-border bg-card p-4 shadow-xs motion-safe:transition-[box-shadow,border-color] hover:border-primary/35 hover:shadow-md",
        isDragSource &&
          "z-20 border-dashed border-primary ring-2 ring-primary/20",
        pending && "opacity-60",
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <SourceBadge source={lead.source} />
        <Button
          ref={handleRef}
          variant="ghost"
          size="icon-sm"
          disabled={disabled}
          aria-label={`Drag ${lead.name}`}
          aria-describedby="pipeline-drag-help"
          className="-me-2 -mt-2 hidden cursor-grab touch-none text-muted-foreground active:cursor-grabbing md:inline-flex"
        >
          <svg
            aria-hidden="true"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="currentColor"
          >
            <circle cx="6" cy="4" r="1" />
            <circle cx="12" cy="4" r="1" />
            <circle cx="6" cy="9" r="1" />
            <circle cx="12" cy="9" r="1" />
            <circle cx="6" cy="14" r="1" />
            <circle cx="12" cy="14" r="1" />
          </svg>
        </Button>
      </div>
      <Link
        href={`/crm/leads/${lead.id}`}
        className="block min-h-11 break-words text-base leading-snug font-semibold text-foreground underline-offset-4 hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        {lead.name}
      </Link>
      <p className="mt-1 text-xs text-muted-foreground">
        {lead.purpose === "sale" ? "Looking to buy" : "Looking to rent"}
      </p>
      <p className="mt-3 text-sm font-medium text-primary">
        {budgetLabel(lead.budgetFils, lead.purpose)}
      </p>
      <div className="mt-3 flex min-h-12 items-start gap-2 rounded-lg bg-background px-3 py-2 text-xs leading-relaxed text-muted-foreground">
        <Icon name="properties" className="mt-0.5 size-4" />
        <span className="min-w-0 break-words">
          {lead.property?.title || "Open to suitable properties"}
          {lead.property && !lead.property.available && (
            <span className="block">Property unavailable</span>
          )}
        </span>
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <span
          aria-hidden="true"
          className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-[10px] font-semibold text-primary"
        >
          {lead.assignedAgent?.name
            .split(/\s+/)
            .slice(0, 2)
            .map((word) => word[0])
            .join("") || "—"}
        </span>
        <span className="min-w-0 break-words">{assigneeLabel(lead)}</span>
      </div>
      <div className="mt-3 border-t border-border pt-3">
        <p className="mb-2 text-[11px] text-muted-foreground">
          {pending ? (
            "Saving stage…"
          ) : (
            <>
              Received <LeadDate value={lead.createdAt} />
            </>
          )}
        </p>
        <NativeSelect
          id={`pipeline-move-${lead.id}`}
          aria-label={`Move ${lead.name} to stage`}
          value={lead.stage}
          disabled={disabled}
          onChange={(event) =>
            onMove(lead, event.target.value as PipelineStage)
          }
          className="w-full bg-card [&_select]:text-xs"
        >
          {stages.map((stage) => (
            <option key={stage} value={stage}>
              {stageLabels[stage]}
            </option>
          ))}
        </NativeSelect>
      </div>
    </article>
  );
}
