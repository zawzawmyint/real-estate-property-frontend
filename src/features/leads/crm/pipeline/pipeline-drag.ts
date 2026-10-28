import {
  Accessibility,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
} from "@dnd-kit/dom";
import { isSortable } from "@dnd-kit/react/sortable";
import { stages, stageLabels } from "../../data/input";
import type { PipelineStage } from "../../data/pipeline";

export function pipelineDropStage({
  target,
}: DragEndEvent["operation"]): PipelineStage | undefined {
  // Card targets carry their stage in the sortable group. Empty columns are
  // ordinary droppables and keep their destination in data instead.
  const stage =
    target && (isSortable(target) ? target.group : target.data.stage);
  return typeof stage === "string" && stages.includes(stage as PipelineStage)
    ? (stage as PipelineStage)
    : undefined;
}

export const pipelineAccessibility = Accessibility.configure({
  announcements: {
    dragstart({ operation: { source } }: DragStartEvent) {
      if (source)
        return `${source.data.name} picked up. Use arrow keys to choose a stage, Space to drop, or Escape to cancel.`;
    },
    dragover({ operation }: DragOverEvent) {
      const stage = pipelineDropStage(operation);
      if (operation.source && stage)
        return `${operation.source.data.name} over ${stageLabels[stage]}.`;
    },
    dragend({ operation, canceled }: DragEndEvent) {
      if (!operation.source) return;
      if (canceled)
        return `Move canceled. ${operation.source.data.name} remains in its original stage.`;
      const stage = pipelineDropStage(operation);
      if (!stage || stage === operation.source.data.stage)
        return `${operation.source.data.name} remains in its original stage.`;
      if (stage === "won" || stage === "lost")
        return `${operation.source.data.name} dropped in ${stageLabels[stage]}. Waiting for confirmation.`;
      return `Moving ${operation.source.data.name} to ${stageLabels[stage]}. Saving stage change.`;
    },
  },
});
