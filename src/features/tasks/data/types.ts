import type { components } from "@/lib/api/generated/tasks";

export type Task = components["schemas"]["Task"];
export type TaskEnvelope = components["schemas"]["TaskResult"];
export type TaskPage = components["schemas"]["TaskPage"];
export type CreateTask = components["schemas"]["CreateTask"];
export type UpdateTask = components["schemas"]["UpdateTask"];
export type UpdateTaskStatus = components["schemas"]["UpdateTaskStatus"];
export type TaskActionResult =
  | { ok: true; data: TaskEnvelope }
  | {
      ok: false;
      error: {
        code: string;
        message: string;
        status?: number;
        requestId?: string;
        uncertain?: boolean;
        existingTaskId?: string;
      };
    };
