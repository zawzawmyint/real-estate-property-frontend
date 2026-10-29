import { afterEach, expect, it, vi } from "vitest";
import { getTask, getTasks, getTaskLeads } from "@/features/tasks/data/queries";
import {
  requestTask,
  TaskApiError,
  taskReadRecovery,
} from "@/features/tasks/data/request";

afterEach(() => vi.unstubAllGlobals());

it("requests the existing lead contract with an explicit role-appropriate view", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockImplementation(async () => Response.json({ items: [], total: 0 })),
  );
  await getTaskLeads(" Buyer ", 2, undefined, "all");
  expect(fetch).toHaveBeenLastCalledWith(
    "/api/v1/staff/leads?q=Buyer&page=2&view=all",
    expect.anything(),
  );
  await getTaskLeads("Mine");
  expect(fetch).toHaveBeenLastCalledWith(
    "/api/v1/staff/leads?q=Mine&page=1&view=mine",
    expect.anything(),
  );
});

it("classifies expired, revoked and retryable reads without reclassifying business conflicts", () => {
  expect(
    taskReadRecovery(new TaskApiError(401, "UNAUTHENTICATED", "expired")),
  ).toBe("login");
  expect(taskReadRecovery(new TaskApiError(404, "NOT_FOUND", "missing"))).toBe(
    "inaccessible",
  );
  expect(taskReadRecovery(new TaskApiError(503, "UNAVAILABLE", "later"))).toBe(
    "retry",
  );
  expect(taskReadRecovery(new Error("offline"))).toBe("retry");
});

it("browser reconciliation uses same-origin no-store reads with abort support", async () => {
  const controller = new AbortController();
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockImplementation(async () => Response.json({ items: [], total: 0 })),
  );
  await getTasks("status=open&page=2", controller.signal);
  expect(fetch).toHaveBeenCalledWith(
    "/api/v1/staff/tasks?status=open&page=2",
    expect.objectContaining({
      cache: "no-store",
      credentials: "same-origin",
      signal: controller.signal,
    }),
  );
  await getTask("uuid/unsafe");
  expect(fetch).toHaveBeenLastCalledWith(
    "/api/v1/staff/tasks/uuid%2Funsafe",
    expect.anything(),
  );
});

it("network and malformed success responses fail honestly without read retries", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValueOnce(new Error("offline")));
  await expect(requestTask("/api/v1/staff/tasks")).rejects.toMatchObject({
    status: 0,
    code: "NETWORK_ERROR",
  });
  expect(fetch).toHaveBeenCalledTimes(1);
  vi.mocked(fetch).mockResolvedValueOnce(
    new Response("broken json", { status: 200 }),
  );
  await expect(requestTask("/api/v1/staff/tasks")).rejects.toMatchObject({
    status: 502,
    code: "INVALID_RESPONSE",
  });
});
