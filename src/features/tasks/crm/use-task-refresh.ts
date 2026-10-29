"use client";
import { useEffect } from "react";

export function useTaskRefresh(refresh: () => void) {
  useEffect(() => {
    const visibleRefresh = () => {
      if (document.visibilityState === "visible") refresh();
    };
    const timer = window.setInterval(visibleRefresh, 60_000);
    window.addEventListener("focus", visibleRefresh);
    document.addEventListener("visibilitychange", visibleRefresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", visibleRefresh);
      document.removeEventListener("visibilitychange", visibleRefresh);
    };
  }, [refresh]);
}
