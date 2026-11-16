import { beforeEach, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const boundary = vi.hoisted(() => ({
  session: vi.fn(),
  property: vi.fn(),
  task: vi.fn(),
  lead: vi.fn(),
}));
vi.mock("@/lib/auth/server", () => ({
  requireStaffSession: boundary.session,
}));
vi.mock("@/lib/api/server", () => ({ getStaffProperty: boundary.property }));
vi.mock("@/features/tasks/data/server", () => ({
  getStaffTask: boundary.task,
}));
vi.mock("@/features/leads/data/server", () => ({
  getStaffLead: boundary.lead,
}));
vi.mock("@/features/properties/crm/property-form", () => ({
  PropertyForm: () => null,
}));
vi.mock("@/features/properties/crm/property-read-only", () => ({
  PropertyReadOnly: () => null,
}));
vi.mock("@/features/tasks/crm/task-detail", () => ({ TaskDetail: () => null }));
vi.mock("@/features/tasks/crm/retry-results", () => ({
  RetryTasks: () => "Retry tasks",
}));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_HTTP_ERROR_FALLBACK;404");
  },
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
}));

import PropertyPage from "@/app/(staff)/crm/properties/[id]/page";
import EditPropertyPage from "@/app/(staff)/crm/properties/[id]/edit/page";
import TaskPage from "@/app/(staff)/crm/tasks/[id]/page";
import { PropertyApiError } from "@/features/properties/data/request";
import { TaskApiError } from "@/features/tasks/data/request";

const validId = "12b7aaf0-bd6b-4d07-a2e3-a657148c13e7";
const pages = [PropertyPage, EditPropertyPage, TaskPage];
const params = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  vi.resetAllMocks();
  boundary.session.mockResolvedValue({ id: "staff", role: "manager" });
  boundary.property.mockRejectedValue(
    new PropertyApiError(400, "VALIDATION_ERROR", "Invalid ID"),
  );
  boundary.task.mockRejectedValue(
    new TaskApiError(400, "VALIDATION_ERROR", "Invalid ID"),
  );
});

it.each(pages)(
  "rejects malformed record IDs with not-found before resource reads (%#)",
  async (page) => {
    for (const id of ["not-a-uuid", "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"]) {
      await expect(page(params(id))).rejects.toThrow(
        "NEXT_HTTP_ERROR_FALLBACK;404",
      );
    }
    expect(boundary.session).toHaveBeenCalledTimes(2);
    expect(boundary.property).not.toHaveBeenCalled();
    expect(boundary.task).not.toHaveBeenCalled();
    expect(boundary.lead).not.toHaveBeenCalled();
  },
);

it.each(pages)(
  "requires a live session before classifying malformed routes (%#)",
  async (page) => {
    boundary.session.mockRejectedValue(new Error("redirect:/login"));
    await expect(page(params("not-a-uuid"))).rejects.toThrow("redirect:/login");
    expect(boundary.property).not.toHaveBeenCalled();
    expect(boundary.task).not.toHaveBeenCalled();
  },
);

it("classifies malformed Agent edit URLs before redirecting, but preserves valid redirects", async () => {
  boundary.session.mockResolvedValue({ id: "staff", role: "agent" });
  await expect(EditPropertyPage(params("not-a-uuid"))).rejects.toThrow(
    "NEXT_HTTP_ERROR_FALLBACK;404",
  );
  await expect(EditPropertyPage(params(validId))).rejects.toThrow(
    `redirect:/crm/properties/${validId}`,
  );
  expect(boundary.property).not.toHaveBeenCalled();
});

it.each([PropertyPage, EditPropertyPage])(
  "preserves valid property ID outage, missing and login recovery (%#)",
  async (page) => {
    const outage = new PropertyApiError(503, "UNAVAILABLE", "Try later");
    boundary.property.mockRejectedValueOnce(outage);
    await expect(page(params(validId))).rejects.toBe(outage);
    boundary.property.mockRejectedValueOnce(
      new PropertyApiError(404, "NOT_FOUND", "Missing"),
    );
    await expect(page(params(validId))).rejects.toThrow(
      "NEXT_HTTP_ERROR_FALLBACK;404",
    );
    boundary.property.mockRejectedValueOnce(
      new PropertyApiError(401, "UNAUTHORIZED", "Sign in"),
    );
    await expect(page(params(validId))).rejects.toThrow("redirect:/login");
    expect(boundary.property).toHaveBeenCalledWith(validId);
  },
);

it("preserves valid task ID retry, access-loss and login recovery", async () => {
  boundary.task.mockRejectedValueOnce(
    new TaskApiError(503, "UNAVAILABLE", "Try later"),
  );
  const outage = renderToStaticMarkup(await TaskPage(params(validId)));
  expect(outage).toContain("This task could not be loaded.");
  expect(outage).toContain("Retry tasks");
  boundary.task.mockRejectedValueOnce(
    new TaskApiError(404, "NOT_FOUND", "Missing"),
  );
  const denied = renderToStaticMarkup(await TaskPage(params(validId)));
  expect(denied).toContain("This task is no longer available to your account.");
  expect(denied).not.toContain("Retry tasks");
  boundary.task.mockRejectedValueOnce(
    new TaskApiError(401, "UNAUTHORIZED", "Sign in"),
  );
  await expect(TaskPage(params(validId))).rejects.toThrow("redirect:/login");
  expect(boundary.task).toHaveBeenCalledWith(validId);
  expect(boundary.lead).not.toHaveBeenCalled();
});
