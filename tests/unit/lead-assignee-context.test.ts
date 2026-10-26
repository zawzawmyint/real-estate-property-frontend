import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { AssigneeContext } from "@/features/leads/crm/lead-presentation";

it.each([true, false])(
  "lets managers filter retained active=%s assignee identities",
  (available) => {
    const lead = {
      assignedAgent: {
        id: "retained agent/opaque",
        name: "Retained Agent",
        available,
      },
      previousAgentName: null,
    };
    const html = renderToStaticMarkup(
      createElement(AssigneeContext, { lead, manager: true }),
    );
    expect(html).toContain("View leads assigned to Retained Agent");
    expect(html).toContain(
      "view=all&amp;agentId=retained+agent%2Fopaque&amp;sort=newest&amp;page=1",
    );
    expect(html).toContain(
      available ? ">Retained Agent</a>" : "Retained Agent (unavailable)</a>",
    );
  },
);
it("does not expose manager assignee filter navigation to agents", () => {
  const lead = {
    assignedAgent: { id: "inactive", name: "Inactive Agent", available: false },
    previousAgentName: null,
  };
  const html = renderToStaticMarkup(
    createElement(AssigneeContext, { lead, manager: false }),
  );
  expect(html).toContain("Inactive Agent (unavailable)");
  expect(html).not.toContain("<a");
  expect(html).not.toContain("agentId");
});
it.each([null, "Removed Agent"])(
  "retains unassigned/removed labels without inventing a filter identity: %s",
  (previousAgentName) => {
    const html = renderToStaticMarkup(
      createElement(AssigneeContext, {
        lead: { assignedAgent: null, previousAgentName },
        manager: true,
      }),
    );
    expect(html).toContain(
      previousAgentName ? "Unassigned · Removed Agent (removed)" : "Unassigned",
    );
    expect(html).not.toContain("<a");
  },
);
