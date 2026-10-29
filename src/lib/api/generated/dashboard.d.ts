/** Generated from docs/contracts/dashboard.openapi.yaml. Do not edit. */
export interface paths {
  "/api/v1/staff/dashboard": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Current authorized lead aggregates from one snapshot
     * @description No query parameters accepted. Admin and Manager include unassigned leads; Agent includes current own assignments. All counts exclude createdAt after generatedAt. Week is Monday midnight Asia/Dubai. Conversion is current Won divided by all visible leads, rounded to one decimal; not historical performance.
     */
    get: operations["getDashboardSummary"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
}
export type webhooks = Record<string, never>;
export interface components {
  schemas: {
    DashboardSummary: {
      /** Format: date-time */
      generatedAt: string;
      /** @enum {string} */
      scope: "agency" | "mine";
      /** @constant */
      timezone: "Asia/Dubai";
      /** Format: date-time */
      weekStart: string;
      /** Format: date-time */
      weekEndExclusive: string;
      totalLeads: number;
      newLeadsThisWeek: number;
      wonLeads: number;
      conversionRatePercent: number | null;
      /** @description Fixed order website, call, walk_in; zero-filled; counts sum to totalLeads */
      leadsBySource: {
        /** @enum {string} */
        source: "website" | "call" | "walk_in";
        count: number;
      }[];
      /** @description Fixed order new, contacted, viewing_scheduled, offer, won, lost; zero-filled; counts sum to totalLeads */
      pipelineByStage: {
        /** @enum {string} */
        stage:
          "new" | "contacted" | "viewing_scheduled" | "offer" | "won" | "lost";
        count: number;
      }[];
    };
  };
  responses: {
    /** @description Existing safe error envelope; authentication precedes query validation */
    Error: {
      headers: {
        "Cache-Control"?: "no-store";
        [name: string]: unknown;
      };
      content: {
        "application/json": {
          error: {
            code: string;
            message: string;
            requestId: string;
          };
        };
      };
    };
  };
  parameters: never;
  requestBodies: never;
  headers: never;
  pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
  getDashboardSummary: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Authorized dashboard snapshot */
      200: {
        headers: {
          "Cache-Control"?: "no-store";
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["DashboardSummary"];
        };
      };
      400: components["responses"]["Error"];
      401: components["responses"]["Error"];
      403: components["responses"]["Error"];
      500: components["responses"]["Error"];
    };
  };
}
