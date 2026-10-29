import type { components, operations } from "@/lib/api/generated/viewings";
export type Viewing = components["schemas"]["Viewing"];
export type CreateViewing = components["schemas"]["CreateViewing"];
export type RescheduleViewing = components["schemas"]["RescheduleViewing"];
export type UpdateViewingStatus = components["schemas"]["UpdateViewingStatus"];
export type ViewingPage =
  operations["listViewings"]["responses"][200]["content"]["application/json"];
export type ViewingResult =
  | { ok: true; data: Viewing }
  | {
      ok: false;
      error: {
        code: string;
        message: string;
        status?: number;
        requestId?: string;
        uncertain?: boolean;
        existingViewingId?: string;
      };
    };
