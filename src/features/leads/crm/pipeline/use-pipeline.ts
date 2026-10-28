"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { changeStage } from "../../data/actions";
import { getLead } from "../../data/queries";
import { LeadApiError } from "../../data/request";
import { stages, stageLabels } from "../../data/input";
import {
  appendPipelinePage,
  loadPipelineColumn,
  type PipelineColumnData,
  type PipelineStage,
} from "../../data/pipeline";
import type { LeadFilters } from "../../data/filters";
import type { LeadSummary } from "../../data/types";

export function usePipeline(
  initial: PipelineColumnData[],
  filters: LeadFilters,
) {
  const router = useRouter();
  const [columns, setColumns] = useState(initial);
  const [message, setMessage] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [pendingLeadId, setPendingLeadId] = useState<string | null>(null);
  const [loadingStage, setLoadingStage] = useState<
    PipelineStage | "all" | null
  >(null);
  const [reviewRequired, setReviewRequired] = useState(
    initial.some((column) => column.result === null),
  );
  const [confirmation, setConfirmation] = useState<{
    lead: LeadSummary;
    stage: PipelineStage;
  } | null>(null);
  const [mobileStage, setMobileStage] = useState<PipelineStage>("new");
  const [pending, startTransition] = useTransition();
  const guard = useRef(false);
  const focusAfterSave = useRef<string | null>(null);
  const busy = pending || pendingLeadId !== null || loadingStage !== null;

  useEffect(() => {
    const leadId = focusAfterSave.current;
    if (busy || confirmation || !leadId) return;
    focusAfterSave.current = null;
    document
      .getElementById(`pipeline-move-${leadId}`)
      ?.focus({ preventScroll: true });
  }, [busy, columns, confirmation]);

  function sessionError(error: unknown) {
    if (error instanceof LeadApiError && error.status === 401) {
      setColumns(stages.map((stage) => ({ stage, result: null })));
      startTransition(() => router.replace("/login"));
      return true;
    }
    return false;
  }

  async function reload() {
    setLoadingStage("all");
    const fresh = await Promise.all(
      stages.map(async (stage): Promise<PipelineColumnData> => {
        try {
          return { stage, result: await loadPipelineColumn(filters, stage) };
        } catch (error) {
          sessionError(error);
          return {
            stage,
            result: null,
            error: "This stage could not be loaded.",
          };
        }
      }),
    );
    setColumns(fresh);
    setLoadingStage(null);
    const complete = fresh.every((column) => column.result !== null);
    setReviewRequired(!complete);
    return complete;
  }

  async function refresh() {
    if (guard.current) return;
    guard.current = true;
    try {
      if (await reload()) setMessage("");
    } finally {
      guard.current = false;
    }
  }

  async function loadMore(stage: PipelineStage) {
    if (guard.current) return;
    const column = columns.find((item) => item.stage === stage);
    if (!column?.result) return refresh();
    guard.current = true;
    setLoadingStage(stage);
    try {
      const result = await loadPipelineColumn(
        filters,
        stage,
        column.result.page + 1,
      );
      setColumns((current) =>
        current.map((item) =>
          item.stage === stage && item.result
            ? { stage, result: appendPipelinePage(item.result, result) }
            : item,
        ),
      );
    } catch (error) {
      if (!sessionError(error))
        setColumns((current) =>
          current.map((item) =>
            item.stage === stage
              ? { ...item, error: "More leads could not be loaded. Try again." }
              : item,
          ),
        );
    } finally {
      setLoadingStage(null);
      guard.current = false;
    }
  }

  async function saveMove(lead: LeadSummary, stage: PipelineStage) {
    if (guard.current || reviewRequired || lead.stage === stage) return;
    guard.current = true;
    setPendingLeadId(lead.id);
    setMessage("");
    setAnnouncement("");
    try {
      const result = await changeStage(lead.id, {
        expectedVersion: lead.version,
        stage,
      });
      setConfirmation(null);
      if (!result.ok) {
        if (result.error.status === 401) {
          sessionError(
            new LeadApiError(401, "UNAUTHORIZED", "Session expired"),
          );
          return;
        }
        if ([403, 404].includes(result.error.status || 0)) {
          setColumns((current) =>
            current.map((column) => ({
              ...column,
              result: column.result
                ? {
                    ...column.result,
                    items: column.result.items.filter(
                      (item) => item.id !== lead.id,
                    ),
                  }
                : null,
            })),
          );
          await reload();
          setMessage(
            "This lead is no longer available to you. The board has been refreshed.",
          );
          return;
        }
        if (result.error.status === 409 || result.error.uncertain) {
          setReviewRequired(true);
          try {
            await getLead(lead.id);
          } catch (error) {
            sessionError(error);
          }
          await reload();
          setMessage(
            "The lead may have changed. Review the current stage before making another move. Your move was not automatically retried.",
          );
          return;
        }
        setMessage(result.error.message);
        return;
      }
      // Keep the board mounted until all refreshed stages replace it together.
      await reload();
      setMobileStage(result.data.stage);
      setAnnouncement(
        `${lead.name} moved to ${stageLabels[result.data.stage]}.`,
      );
      focusAfterSave.current = lead.id;
    } catch {
      setConfirmation(null);
      setReviewRequired(true);
      await reload();
      setMessage(
        "The save response could not be confirmed. Review the current stage before making another move. Your move was not automatically retried.",
      );
    } finally {
      setPendingLeadId(null);
      guard.current = false;
    }
  }

  function move(lead: LeadSummary, stage: PipelineStage) {
    if (guard.current || reviewRequired || confirmation || stage === lead.stage)
      return;
    if (stage === "won" || stage === "lost") setConfirmation({ lead, stage });
    else void saveMove(lead, stage);
  }

  return {
    columns,
    message,
    announcement,
    pendingLeadId,
    loadingStage,
    reviewRequired,
    confirmation,
    setConfirmation,
    mobileStage,
    setMobileStage,
    busy,
    refresh,
    loadMore,
    move,
    saveMove,
  };
}
