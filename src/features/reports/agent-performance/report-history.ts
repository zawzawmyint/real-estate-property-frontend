import { reportPath } from "./report-path";

export const beforeReportTraversal = "crm:before-report-traversal";

function trackTraversal() {
  // popstate arrives after the entry changes. Remember its source so Stay
  // can undo even a multi-entry Back or Forward without routing the form.
  const navigation = (
    window as Window & {
      navigation?: EventTarget & { currentEntry: { index: number } | null };
    }
  ).navigation;
  if (navigation?.currentEntry) {
    let source = navigation.currentEntry.index;
    navigation.addEventListener("navigate", () => {
      if (navigation.currentEntry) source = navigation.currentEntry.index;
    });
    return () => ({ source, position: navigation.currentEntry!.index });
  }
  // Older browsers need the position alongside the router's history state.
  const key = "__crmReportPosition";
  const history = window.history;
  const push = history.pushState.bind(history);
  const replace = history.replaceState.bind(history);
  let position: number = history.state?.[key] ?? 0;
  // Keep native fragment entries and non-router state in their original form.
  const unmarked = new Map<string, number>();
  function indexed(data: unknown, at: number, url?: string | URL | null) {
    if (
      data &&
      typeof data === "object" &&
      Object.getPrototypeOf(data) === Object.prototype
    )
      return { ...data, [key]: at };
    unmarked.set(new URL(url ?? location.href, location.href).href, at);
    return data;
  }
  replace(indexed(history.state, position), "");
  history.pushState = (data, unused, url) => {
    push(indexed(data, position + 1, url), unused, url);
    position++;
  };
  history.replaceState = (data, unused, url) => {
    replace(indexed(data, position, url), unused, url);
  };
  return (event: PopStateEvent) => {
    const source = position;
    // Native fragment entries do not pass through pushState.
    position = event.state?.[key] ?? unmarked.get(location.href) ?? source + 1;
    if (event.state?.[key] === undefined) unmarked.set(location.href, position);
    return { source, position };
  };
}

export function protectReportHistory() {
  const traversal = trackTraversal();
  let reloading = false;
  let restoringForm: number | undefined;
  const isReport = () => window.location.pathname === reportPath;
  const concealReport = () => {
    document.documentElement.setAttribute("data-report-restoring", "");
  };
  const readFreshReport = () => {
    if (reloading) return;
    reloading = true;
    concealReport();
    window.location.reload();
  };

  window.addEventListener(
    "popstate",
    (event) => {
      const { source, position } = traversal(event);
      if (restoringForm === position) {
        restoringForm = undefined;
        event.stopImmediatePropagation();
        return;
      }
      if (!isReport()) return;
      // Prevent Next from restoring an already-authorized report from its client cache.
      event.stopImmediatePropagation();
      if (
        !window.dispatchEvent(
          new Event(beforeReportTraversal, { cancelable: true }),
        )
      ) {
        restoringForm = source;
        history.go(source - position);
        return;
      }
      readFreshReport();
    },
    { capture: true },
  );
  window.addEventListener("pagehide", (event) => {
    reloading = false;
    if (event.persisted && isReport()) concealReport();
  });
  window.addEventListener(
    "pageshow",
    (event) => {
      if (!event.persisted || !isReport()) return;
      // Next also attempts a client restore on a persisted document's pageshow.
      event.stopImmediatePropagation();
      readFreshReport();
    },
    { capture: true },
  );
}
