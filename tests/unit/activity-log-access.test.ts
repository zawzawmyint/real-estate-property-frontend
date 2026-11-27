import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  account: {
    identity: { id: "staff-one", name: "Manager", role: "manager" },
    ready: true,
    checkingSession: false,
    sessionError: false,
    retrySession: vi.fn(),
  },
  retry: undefined as (() => void) | undefined,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }),
}));
vi.mock("@/features/auth/staff-account", () => ({
  useStaffAccount: () => state.account,
}));
vi.mock("@/components/ui/button", async () => {
  const { createElement } = await import("react");
  return {
    Button: ({
      onClick,
      children,
    }: {
      onClick?: () => void;
      children: ReactNode;
    }) => {
      state.retry = onClick;
      return createElement("button", { onClick }, children);
    },
  };
});

import { AuditAccess } from "@/features/activity-log/access";

function renderAccess() {
  const props = { staffId: "staff-one", children: null };

  return renderToStaticMarkup(
    createElement(
      AuditAccess,
      props,
      createElement("p", null, "Protected audit history and actor options"),
    ),
  );
}

beforeEach(() => {
  state.account.ready = true;
  state.account.checkingSession = false;
  state.account.sessionError = false;
  state.account.retrySession.mockReset();
  state.retry = undefined;
});

it("hides loaded history on verification failure and restores it after a successful retry", () => {
  expect(renderAccess()).toContain("Protected audit history and actor options");

  state.account.sessionError = true;
  const failed = renderAccess();

  expect(failed).not.toContain("Protected audit history and actor options");
  expect(failed).toContain("Session verification is unavailable");
  expect(failed).toContain("Retry session check");

  state.account.retrySession.mockImplementation(() => {
    state.account.sessionError = false;
  });
  state.retry?.();

  expect(state.account.retrySession).toHaveBeenCalledOnce();
  expect(renderAccess()).toContain("Protected audit history and actor options");
});

it("keeps verified content mounted while a transient session check runs", () => {
  state.account.checkingSession = true;

  expect(renderAccess()).toContain("Protected audit history and actor options");
});

it("preserves the server-authorized initial render before provider hydration", () => {
  state.account.ready = false;
  state.account.sessionError = true;

  expect(renderAccess()).toContain("Protected audit history and actor options");
});
