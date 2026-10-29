import { afterEach, beforeEach, expect, it, vi } from "vitest";
const boundary = vi.hoisted(() => ({
  session: vi.fn(),
  cookies: vi.fn(),
  headers: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/server", () => ({ getStaffSession: boundary.session }));
vi.mock("next/headers", () => ({
  cookies: boundary.cookies,
  headers: boundary.headers,
}));
import {
  createTask,
  updateTask,
  updateTaskStatus,
} from "@/features/tasks/data/actions";

const id = "12b7aaf0-bd6b-4d07-a2e3-a657148c13e7";
const input = {
  submissionId: id,
  leadId: id,
  expectedLeadVersion: 1,
  title: "Call buyer",
  notes: null,
  dueAt: "2090-01-01T10:00:00Z",
};
const saved = {
  task: {
    id,
    version: 1,
    lead: { id },
    title: "Call buyer",
    status: "open",
    dueAt: input.dueAt,
  },
  asOf: "2026-10-29T10:00:00Z",
};
beforeEach(() => {
  vi.clearAllMocks();
  boundary.session.mockResolvedValue({ id: "agent", role: "agent" });
  boundary.cookies.mockResolvedValue({
    get: (name: string) =>
      name === "agency.session" ? { value: "signed" } : undefined,
  });
  boundary.headers.mockResolvedValue(
    new Headers({
      Origin: "http://localhost:3100",
      "x-secret": "never-forward",
    }),
  );
  vi.stubEnv("API_URL", "http://localhost:4311");
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(saved)));
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

it("checks live auth and forwards only approved cookie/Origin for task mutations", async () => {
  expect(await createTask(input)).toEqual({ ok: true, data: saved });
  expect(fetch).toHaveBeenCalledWith(
    "http://localhost:4311/api/v1/staff/tasks",
    expect.objectContaining({
      method: "POST",
      body: JSON.stringify(input),
      headers: {
        Accept: "application/json",
        Cookie: "agency.session=signed",
        Origin: "http://localhost:3100",
        "Content-Type": "application/json",
      },
    }),
  );
  boundary.session.mockResolvedValue(null);
  vi.mocked(fetch).mockClear();
  expect(
    await updateTaskStatus(id, { expectedVersion: 1, status: "completed" }),
  ).toMatchObject({ ok: false, error: { status: 401 } });
  expect(fetch).not.toHaveBeenCalled();
});

it("rejects bad identifiers, unknown fields and malformed origins before dispatch", async () => {
  expect(
    await updateTask("invalid", {
      expectedVersion: 1,
      expectedLeadVersion: 1,
      title: "Call",
      notes: null,
      dueAt: input.dueAt,
    }),
  ).toMatchObject({ ok: false, error: { status: 400 } });
  expect(
    await createTask({ ...input, actor: "admin" } as typeof input),
  ).toMatchObject({ ok: false, error: { status: 400 } });
  boundary.headers.mockResolvedValue(
    new Headers({ Origin: "http://localhost:3100/path" }),
  );
  expect(await createTask(input)).toMatchObject({
    ok: false,
    error: { status: 403 },
  });
  expect(fetch).not.toHaveBeenCalled();
});

it("marks missing and malformed dispatched responses uncertain without retrying", async () => {
  vi.mocked(fetch).mockRejectedValueOnce(new Error("lost"));
  expect(await createTask(input)).toMatchObject({
    ok: false,
    error: { uncertain: true },
  });
  expect(fetch).toHaveBeenCalledTimes(1);
  vi.mocked(fetch).mockResolvedValueOnce(Response.json({ task: {} }));
  expect(await createTask(input)).toMatchObject({
    ok: false,
    error: { uncertain: true, code: "INVALID_RESPONSE" },
  });
});

it("keeps known version conflicts distinct from unknown outcomes", async () => {
  vi.mocked(fetch).mockResolvedValueOnce(
    Response.json(
      {
        error: { code: "CONFLICT", message: "Review latest", requestId: "req" },
      },
      { status: 409 },
    ),
  );
  expect(await createTask(input)).toEqual({
    ok: false,
    error: {
      code: "CONFLICT",
      status: 409,
      message: "Review latest",
      requestId: "req",
    },
  });
});

it("only exposes a valid authorized saved-task identifier on receipt conflicts", async () => {
  for (const existingTaskId of [id, "javascript:alert(1)", undefined]) {
    vi.mocked(fetch).mockResolvedValueOnce(
      Response.json(
        {
          error: {
            code: "TASK_RECEIPT_CONFLICT",
            message: "Review saved task",
            existingTaskId,
          },
        },
        { status: 409 },
      ),
    );
    const result = await createTask(input);
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(result.error.existingTaskId).toBe(
        existingTaskId === id ? id : undefined,
      );
  }
});
