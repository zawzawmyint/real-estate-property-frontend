import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }),
}));

import { ActorPicker } from "@/features/activity-log/actor-picker";
import { LogControls } from "@/features/activity-log/log-controls";

it("associates historical actor validation with its picker and preserves unknown selected IDs", () => {
  const html = renderToStaticMarkup(
    createElement(ActorPicker, {
      actorId: "historical-staff",
      error: "Choose a historical actor or source.",
      onChange: () => {},
    }),
  );
  const select = html.match(/<select[^>]*id="audit-actor"[^>]*>/)?.[0];

  expect(select).toContain('aria-invalid="true"');
  expect(select).toContain('aria-describedby="audit-actor-error"');
  expect(html).toContain('id="audit-actor-error"');
  expect(html).toContain('value="historical-staff" selected=""');
});

it("keeps streamed filter controls inert before hydration", () => {
  const html = renderToStaticMarkup(
    createElement(LogControls, {
      filters: {
        from: "2026-11-01T12:30:01Z",
        to: "2026-11-02T15:20:02Z",
        page: 3,
        pageSize: 20,
      },
    }),
  );

  expect(html).toMatch(/<fieldset[^>]*disabled=""/);
  expect(html).toContain("Apply filters");
});
