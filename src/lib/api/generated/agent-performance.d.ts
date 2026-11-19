/** Generated from docs/contracts/agent-performance.openapi.yaml. Do not edit. */
export interface paths {
  "/api/v1/staff/reports/agent-performance": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Read recorded agent work and first-Won outcomes
     * @description Admin and Manager may select all eligible identities or one identity. Agents see their own history. Inclusive Dubai dates use calendar years 0001–9999, must be supplied together, span at most 366 days and end by today. Defaults to the current Dubai month through today. Only the first transition to Won counts. Response episodes start in the period. Counts reflect recorded work. Incomplete histories can cause additional unquantifiable omissions. Options and rows sort by display name then ID using ordinal UTF-16 order. Explicit selection returns one option.
     */
    get: operations["getAgentPerformanceReport"];
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
    AgentPerformanceIdentity: {
      id: string;
      name: string;
      /** @enum {string} */
      availability: "active" | "inactive" | "former";
    };
    AgentPerformanceRow: {
      agent: components["schemas"]["AgentPerformanceIdentity"];
      leadsHandled: number;
      dealsClosed: number;
      assignmentEpisodes: number;
      completedFollowUps: number;
      averageFirstFollowUpSeconds: number | null;
      awaitingFollowUp: number;
      endedWithoutFollowUp: number;
    };
    AgentPerformanceCoverage: {
      excludedActionCount: number;
      excludedAssignmentEpisodeCount: number;
      unattributedFirstWinCount: number;
      hasLimitations: boolean;
    };
    AgentPerformanceReport: {
      /** Format: date-time */
      generatedAt: string;
      /** @constant */
      timezone: "Asia/Dubai";
      /** Format: date */
      from: string;
      /** Format: date */
      to: string;
      /** Format: date-time */
      rangeStart: string;
      /** Format: date-time */
      rangeEndExclusive: string;
      /** Format: date-time */
      asOf: string;
      /** @enum {string} */
      scope: "agency" | "mine";
      /** @default 1 */
      page: number;
      /**
       * @default 25
       * @enum {integer}
       */
      pageSize: 25 | 50;
      total: number;
      items: components["schemas"]["AgentPerformanceRow"][];
      agentOptions: components["schemas"]["AgentPerformanceIdentity"][];
      coverage: components["schemas"]["AgentPerformanceCoverage"];
    };
    ReportError: {
      error: {
        code: string;
        message: string;
        requestId: string;
      };
    };
  };
  responses: never;
  parameters: never;
  requestBodies: never;
  headers: never;
  pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
  getAgentPerformanceReport: {
    parameters: {
      query?: {
        from?: string;
        to?: string;
        agentId?: string;
        page?: number;
        pageSize?: 25 | 50;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Authorized report */
      200: {
        headers: {
          "Cache-Control"?: "no-store";
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["AgentPerformanceReport"];
        };
      };
      /** @description VALIDATION_ERROR — Invalid, repeated or unknown filters */
      400: {
        headers: {
          "Cache-Control"?: "no-store";
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["ReportError"];
        };
      };
      /** @description UNAUTHENTICATED — Sign-in required */
      401: {
        headers: {
          "Cache-Control"?: "no-store";
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["ReportError"];
        };
      };
      /** @description FORBIDDEN — Selection outside authorized scope */
      403: {
        headers: {
          "Cache-Control"?: "no-store";
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["ReportError"];
        };
      };
      /** @description NOT_FOUND — Unknown agent */
      404: {
        headers: {
          "Cache-Control"?: "no-store";
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["ReportError"];
        };
      };
      /** @description REPORT_TOO_LARGE — Narrow the dates or select an agent */
      422: {
        headers: {
          "Cache-Control"?: "no-store";
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["ReportError"];
        };
      };
      /** @description INTERNAL_ERROR — Unexpected server error */
      500: {
        headers: {
          "Cache-Control"?: "no-store";
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["ReportError"];
        };
      };
    };
  };
}
