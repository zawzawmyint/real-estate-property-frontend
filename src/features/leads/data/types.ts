import type { components } from "@/lib/api/generated/leads";

export type StaffSummary = components["schemas"]["LeadStaffSummary"];
export type PropertyContext = components["schemas"]["LeadPropertyContext"];
export type LeadSummary = components["schemas"]["LeadSummary"];
export type LeadDetail = components["schemas"]["LeadDetail"];
export type Activity = components["schemas"]["LeadActivity"];
export type LeadList = components["schemas"]["LeadPage"];
export type Page<T> = Omit<
  components["schemas"]["LeadActivityPage"],
  "items"
> & { items: T[] };
export type CreateLead = components["schemas"]["LeadCreateInput"];
export type PatchLead = components["schemas"]["LeadPatchInput"];
export type AssignmentInput = components["schemas"]["LeadAssignmentInput"];
export type StageInput = components["schemas"]["LeadStageInput"];
export type NoteInput = components["schemas"]["LeadNoteInput"];
export type NoteResult = components["schemas"]["LeadNoteResult"];
export type InquiryInput = components["schemas"]["InquiryInput"];
export type AgencyInquiryInput = components["schemas"]["AgencyInquiryInput"];
export type InquiryReceipt = components["schemas"]["InquiryReceipt"];

export type ActionError = {
  code: string;
  message: string;
  status?: number;
  requestId?: string;
  fieldErrors?: Record<string, string[]>;
  uncertain?: boolean;
  retryAfter?: number;
};
export type ActionResult<T> =
  { ok: true; data: T } | { ok: false; error: ActionError };
