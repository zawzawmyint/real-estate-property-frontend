"use client";
import { useEffect } from "react";
import { beforeReportTraversal } from "@/features/reports/agent-performance/report-history";

export function useDirtyForm(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const discard = () => window.confirm("Discard your unsaved changes?");
    const reportTraversal = (event: Event) => {
      if (!discard()) event.preventDefault();
    };
    const unload = (event: BeforeUnloadEvent) => {
      // This report reload has already obtained consent before leaving the form.
      if (document.documentElement.hasAttribute("data-report-restoring"))
        return;
      event.preventDefault();
      event.returnValue = "";
    };
    const click = (event: MouseEvent) => {
      const link = (event.target as Element)?.closest("a[href]");
      if (
        !link ||
        link.getAttribute("target") === "_blank" ||
        event.defaultPrevented ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const href = link.getAttribute("href");
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("tel:") ||
        href.startsWith("mailto:")
      )
        return;
      if (!discard()) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", unload);
    window.addEventListener(beforeReportTraversal, reportTraversal);
    document.addEventListener("click", click, true);
    return () => {
      window.removeEventListener("beforeunload", unload);
      window.removeEventListener(beforeReportTraversal, reportTraversal);
      document.removeEventListener("click", click, true);
    };
  }, [dirty]);
}
