"use server";
import { z } from "zod";
import { runViewingMutation } from "./action-boundary";
import { createSchema, rescheduleSchema, statusSchema } from "./input";
import type {
  CreateViewing,
  RescheduleViewing,
  UpdateViewingStatus,
} from "./types";
export async function createViewing(input: CreateViewing) {
  return runViewingMutation("staff/viewings", "POST", () =>
    createSchema.parse(input),
  );
}
export async function rescheduleViewing(id: string, input: RescheduleViewing) {
  return runViewingMutation(
    `staff/viewings/${encodeURIComponent(id)}`,
    "PATCH",
    () => {
      z.uuid().parse(id);
      return rescheduleSchema.parse(input);
    },
  );
}
export async function updateViewingStatus(
  id: string,
  input: UpdateViewingStatus,
) {
  return runViewingMutation(
    `staff/viewings/${encodeURIComponent(id)}/status`,
    "PATCH",
    () => {
      z.uuid().parse(id);
      return statusSchema.parse(input);
    },
  );
}
