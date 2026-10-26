"use server";
import { z } from "zod";
import { headers } from "next/headers";
import { runLeadMutation } from "./action-boundary";
import { inquiryRelayHeaders } from "./inquiry-relay";
import {
  assignmentSchema,
  createLeadSchema,
  inquirySchema,
  noteSchema,
  patchLeadSchema,
  stageSchema,
} from "./input";
import type {
  ActionResult,
  LeadDetail,
  CreateLead,
  PatchLead,
  AssignmentInput,
  StageInput,
  NoteInput,
  NoteResult,
  InquiryInput,
  InquiryReceipt,
} from "./types";
const path = (id: string) =>
  `staff/leads/${encodeURIComponent(z.uuid().parse(id))}`;
export async function createLead(input: CreateLead) {
  return runLeadMutation<LeadDetail>(
    "staff/leads",
    "POST",
    () => createLeadSchema.parse(input),
    { receipt: true },
  );
}
export async function updateLead(id: string, input: PatchLead) {
  return runLeadMutation<LeadDetail>(
    "staff/leads/" + encodeURIComponent(id),
    "PATCH",
    () => {
      z.uuid().parse(id);
      return patchLeadSchema.parse(input);
    },
  );
}
export async function assignLead(id: string, input: AssignmentInput) {
  return runLeadMutation<LeadDetail>(
    `staff/leads/${encodeURIComponent(id)}/assignment`,
    "PATCH",
    () => {
      path(id);
      return assignmentSchema.parse(input);
    },
    { manager: true },
  );
}
export async function changeStage(id: string, input: StageInput) {
  return runLeadMutation<LeadDetail>(
    `staff/leads/${encodeURIComponent(id)}/stage`,
    "PATCH",
    () => {
      path(id);
      return stageSchema.parse(input);
    },
  );
}
export async function addLeadNote(id: string, input: NoteInput) {
  return runLeadMutation<NoteResult>(
    `staff/leads/${encodeURIComponent(id)}/notes`,
    "POST",
    () => {
      path(id);
      return noteSchema.parse(input);
    },
    { receipt: true },
  );
}
export async function sendInquiry(
  propertyId: string,
  input: InquiryInput,
): Promise<ActionResult<InquiryReceipt>> {
  try {
    const relay = inquiryRelayHeaders(await headers());
    return runLeadMutation(
      `public/properties/${encodeURIComponent(propertyId)}/inquiries`,
      "POST",
      () => {
        z.uuid().parse(propertyId);
        return inquirySchema.parse(input);
      },
      { publicHeaders: relay, receipt: true },
    );
  } catch {
    return {
      ok: false,
      error: {
        code: "SERVICE_UNAVAILABLE",
        status: 503,
        message:
          "Inquiries are temporarily unavailable. Your details have been preserved; please try again later.",
      },
    };
  }
}
