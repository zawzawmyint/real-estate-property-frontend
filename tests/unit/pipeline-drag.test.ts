import { Accessibility, type DragEndEvent } from "@dnd-kit/dom";
import { describe, expect, it } from "vitest";
import { pipelineAccessibility } from "@/features/leads/crm/pipeline/pipeline-drag";

// Exercise the callbacks supplied to the board's actual Accessibility plugin.
const announcements = (
  pipelineAccessibility.options as NonNullable<
    ConstructorParameters<typeof Accessibility>[1]
  >
).announcements!;

function drop(sourceStage: string, targetStage: unknown, canceled = false) {
  return {
    operation: {
      source: { data: { name: "Marina buyer", stage: sourceStage } },
      target:
        targetStage === undefined ? null : { data: { stage: targetStage } },
    },
    canceled,
  } as unknown as DragEndEvent;
}

function announce(event: DragEndEvent) {
  return announcements.dragend(event, undefined!);
}

describe("pipeline drag completion announcements", () => {
  it.each(["new", "contacted", "won", "lost"])(
    "announces an unchanged stage for a same-%s drop",
    (stage) => {
      expect(announce(drop(stage, stage))).toBe(
        "Marina buyer remains in its original stage.",
      );
    },
  );

  it.each([
    ["contacted", "Contacted"],
    ["viewing_scheduled", "Viewing Scheduled"],
    ["offer", "Offer"],
    ["new", "New"],
  ])(
    "announces saving to %s without claiming a completed save",
    (stage, label) => {
      expect(announce(drop("lost", stage))).toBe(
        `Moving Marina buyer to ${label}. Saving stage change.`,
      );
    },
  );

  it.each([
    ["won", "Won"],
    ["lost", "Lost"],
  ])("requires confirmation for a different %s stage", (stage, label) => {
    expect(announce(drop("new", stage))).toBe(
      `Marina buyer dropped in ${label}. Waiting for confirmation.`,
    );
  });

  it.each(["contacted", "won", undefined])(
    "announces cancellation before considering destination %s",
    (stage) => {
      expect(announce(drop("new", stage, true))).toBe(
        "Move canceled. Marina buyer remains in its original stage.",
      );
    },
  );

  it.each([undefined, "archived", 42])(
    "leaves the stage unchanged for absent or invalid target %s",
    (stage) => {
      expect(announce(drop("new", stage))).toBe(
        "Marina buyer remains in its original stage.",
      );
    },
  );

  it("does not announce an event without a source", () => {
    const event = drop("new", "won");
    expect(
      announce({ ...event, operation: { ...event.operation, source: null } }),
    ).toBeUndefined();
  });
});
