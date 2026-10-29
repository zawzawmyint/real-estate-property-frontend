"use server";
import { z } from "zod";
import { runTaskMutation } from "./action-boundary";
import { createSchema, updateSchema, statusSchema } from "./input";
import type { CreateTask, UpdateTask, UpdateTaskStatus } from "./types";
export async function createTask(input: CreateTask) {
  return runTaskMutation("staff/tasks", "POST", () =>
    createSchema.parse(input),
  );
}
export async function updateTask(id: string, input: UpdateTask) {
  return runTaskMutation(
    `staff/tasks/${encodeURIComponent(id)}`,
    "PATCH",
    () => {
      z.uuid().parse(id);
      return updateSchema.parse(input);
    },
  );
}
export async function updateTaskStatus(id: string, input: UpdateTaskStatus) {
  return runTaskMutation(
    `staff/tasks/${encodeURIComponent(id)}/status`,
    "PATCH",
    () => {
      z.uuid().parse(id);
      return statusSchema.parse(input);
    },
  );
}
