/** Generated from docs/contracts/leads.openapi.yaml. Do not edit. */
export interface paths {
  "/api/v1/public/properties/{propertyId}/inquiries": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Capture an unassigned website lead
     * @description Exact APP_ORIGIN and JSON <=16KiB. Forces New/unassigned website lead with property purpose/snapshots. No lead identifiers returned. Same canonical submission replays even after property unavailability. Five attempts per signed client/socket in rolling 15 minutes; invalid attempts and replays count. Single-process bounded limiter; saturated map fails closed. Server relay sends HMAC-SHA256(INQUIRY_RELAY_SECRET, real ingress identity) as x-inquiry-client-key and HMAC-SHA256(secret, clientKey) as x-inquiry-relay-signature. Untrusted relay headers rejected; raw forwarded headers ignored; direct calls use socket identity.
     */
    post: operations["submitPropertyInquiry"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/staff/leads": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** @description Live native staff session required. Admin/Manager access all; Agent only current assigned leads. Inaccessible resource IDs return 404. All mutation access/session/eligibility/version checks occur inside SQLite transactions. Writes require exact APP_ORIGIN, application/json and <=16KiB body. */
    get: operations["listLeads"];
    put?: never;
    /** @description Live native staff session required. Admin/Manager access all; Agent only current assigned leads. Inaccessible resource IDs return 404. All mutation access/session/eligibility/version checks occur inside SQLite transactions. Writes require exact APP_ORIGIN, application/json and <=16KiB body. */
    post: operations["createLead"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/staff/leads/assignment-candidates": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** @description Live native staff session required. Admin/Manager access all; Agent only current assigned leads. Inaccessible resource IDs return 404. All mutation access/session/eligibility/version checks occur inside SQLite transactions. Writes require exact APP_ORIGIN, application/json and <=16KiB body. Admin/Manager only. Active nonbanned agent name/id summaries. NFC lowercase name search, alphabetical then id order. */
    get: operations["listLeadAssignmentCandidates"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/staff/leads/{id}": {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    /** @description Live native staff session required. Admin/Manager access all; Agent only current assigned leads. Inaccessible resource IDs return 404. All mutation access/session/eligibility/version checks occur inside SQLite transactions. Writes require exact APP_ORIGIN, application/json and <=16KiB body. */
    get: operations["getLead"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    /** @description Live native staff session required. Admin/Manager access all; Agent only current assigned leads. Inaccessible resource IDs return 404. All mutation access/session/eligibility/version checks occur inside SQLite transactions. Writes require exact APP_ORIGIN, application/json and <=16KiB body. */
    patch: operations["patchLead"];
    trace?: never;
  };
  "/api/v1/staff/leads/{id}/assignment": {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    /** @description Live native staff session required. Admin/Manager access all; Agent only current assigned leads. Inaccessible resource IDs return 404. All mutation access/session/eligibility/version checks occur inside SQLite transactions. Writes require exact APP_ORIGIN, application/json and <=16KiB body. Admin/Manager only. Only active Agent targets allowed; unavailable target returns 409. Null unassigns. */
    patch: operations["assignLead"];
    trace?: never;
  };
  "/api/v1/staff/leads/{id}/stage": {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    /** @description Live native staff session required. Admin/Manager access all; Agent only current assigned leads. Inaccessible resource IDs return 404. All mutation access/session/eligibility/version checks occur inside SQLite transactions. Writes require exact APP_ORIGIN, application/json and <=16KiB body. */
    patch: operations["changeLeadStage"];
    trace?: never;
  };
  "/api/v1/staff/leads/{id}/notes": {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** @description Live native staff session required. Admin/Manager access all; Agent only current assigned leads. Inaccessible resource IDs return 404. All mutation access/session/eligibility/version checks occur inside SQLite transactions. Writes require exact APP_ORIGIN, application/json and <=16KiB body. Append-only note/call and activity. Receipt compares leadId/kind/body, excluding expectedVersion; replay precedes version check and returns current version after ownership recheck. */
    post: operations["appendLeadNote"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/staff/leads/{id}/activity": {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    /** @description Live native staff session required. Admin/Manager access all; Agent only current assigned leads. Inaccessible resource IDs return 404. All mutation access/session/eligibility/version checks occur inside SQLite transactions. Writes require exact APP_ORIGIN, application/json and <=16KiB body. */
    get: operations["listLeadActivity"];
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
    /** @enum {string} */
    LeadStage:
      "new" | "contacted" | "viewing_scheduled" | "offer" | "won" | "lost";
    LeadStaffSummary: {
      id: string;
      name: string;
      available: boolean;
    };
    LeadPropertyContext: {
      id: string | null;
      title: string;
      location: string | null;
      available: boolean;
    };
    LeadSummary: {
      /** Format: uuid */
      id: string;
      name: string;
      /** @description Must contain a digit; at least one phone or email required. */
      phone: string | null;
      /** Format: email */
      email: string | null;
      /** @enum {string} */
      purpose: "sale" | "rent";
      budgetFils: number | null;
      /** @enum {string} */
      source: "website" | "call" | "walk_in";
      /** @enum {string} */
      stage:
        "new" | "contacted" | "viewing_scheduled" | "offer" | "won" | "lost";
      assignedAgent: components["schemas"]["LeadStaffSummary"] | null;
      previousAgentName: string | null;
      property: components["schemas"]["LeadPropertyContext"] | null;
      /** Format: date-time */
      createdAt: string;
      /** Format: date-time */
      updatedAt: string;
      version: number;
    };
    LeadActor: {
      id: string | null;
      name: string;
    };
    InquiryInput: {
      /** Format: uuid */
      submissionId: string;
      name: string;
      /** @description Must contain a digit; at least one phone or email required. */
      phone?: string | null;
      /** Format: email */
      email?: string | null;
      message?: string | null;
    };
    LeadCreateInput: {
      /** Format: uuid */
      submissionId: string;
      name: string;
      /** @description Must contain a digit; at least one phone or email required. */
      phone?: string | null;
      /** Format: email */
      email?: string | null;
      /** @enum {string} */
      purpose: "sale" | "rent";
      budgetFils?: number | null;
      propertyId?: string | null;
      /** @enum {string} */
      source: "call" | "walk_in";
      assignedAgentId?: string | null;
    };
    LeadPatchInput: {
      name?: string;
      /** @description Must contain a digit; at least one phone or email required. */
      phone?: string | null;
      /** Format: email */
      email?: string | null;
      /** @enum {string} */
      purpose?: "sale" | "rent";
      budgetFils?: number | null;
      propertyId?: string | null;
      expectedVersion: number;
    };
    LeadAssignmentInput: {
      expectedVersion: number;
      assignedAgentId: string | null;
    };
    LeadStageInput: {
      expectedVersion: number;
      /** @enum {string} */
      stage:
        "new" | "contacted" | "viewing_scheduled" | "offer" | "won" | "lost";
    };
    LeadNoteInput: {
      /** Format: uuid */
      submissionId: string;
      expectedVersion: number;
      /** @enum {string} */
      kind: "note" | "call";
      body: string;
    };
    InquiryReceipt: {
      /** @constant */
      received: true;
    };
    LeadApiError: {
      error: {
        code: string;
        message: string;
        /** Format: uuid */
        requestId: string;
      };
    };
    LeadDetail: {
      /** Format: uuid */
      id: string;
      name: string;
      /** @description Must contain a digit; at least one phone or email required. */
      phone: string | null;
      /** Format: email */
      email: string | null;
      /** @enum {string} */
      purpose: "sale" | "rent";
      budgetFils: number | null;
      /** @enum {string} */
      source: "website" | "call" | "walk_in";
      /** @enum {string} */
      stage:
        "new" | "contacted" | "viewing_scheduled" | "offer" | "won" | "lost";
      assignedAgent: components["schemas"]["LeadStaffSummary"] | null;
      previousAgentName: string | null;
      property: components["schemas"]["LeadPropertyContext"] | null;
      /** Format: date-time */
      createdAt: string;
      /** Format: date-time */
      updatedAt: string;
      version: number;
      originalMessage: string | null;
    };
    LeadActivity: {
      /** Format: uuid */
      id: string;
      /** @enum {string} */
      type:
        | "created"
        | "assigned"
        | "unassigned"
        | "stage_changed"
        | "details_updated"
        | "note_added"
        | "call_logged";
      actor: components["schemas"]["LeadActor"] | null;
      /** Format: date-time */
      createdAt: string;
      note: {
        /** Format: uuid */
        id: string;
        /** @enum {string} */
        kind: "note" | "call";
        body: string;
      } | null;
      assignment: {
        from: components["schemas"]["LeadActor"] | null;
        to: components["schemas"]["LeadActor"] | null;
      } | null;
      stageChange: {
        /** @enum {string} */
        from:
          "new" | "contacted" | "viewing_scheduled" | "offer" | "won" | "lost";
        /** @enum {string} */
        to:
          "new" | "contacted" | "viewing_scheduled" | "offer" | "won" | "lost";
      } | null;
      changedFields: (
        "name" | "phone" | "email" | "purpose" | "budgetFils" | "propertyId"
      )[];
    };
    LeadPage: {
      items: components["schemas"]["LeadSummary"][];
      page: number;
      /** @constant */
      pageSize: 20;
      total: number;
      unassignedCount: number | null;
    };
    LeadActivityPage: {
      items: components["schemas"]["LeadActivity"][];
      page: number;
      /** @constant */
      pageSize: 20;
      total: number;
    };
    LeadCandidatesPage: {
      items: components["schemas"]["LeadStaffSummary"][];
      page: number;
      /** @constant */
      pageSize: 20;
      total: number;
    };
    LeadNoteResult: {
      note: components["schemas"]["LeadActivity"];
      leadVersion: number;
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
  submitPropertyInquiry: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        propertyId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["InquiryInput"];
      };
    };
    responses: {
      /** @description Matching submission replay */
      200: {
        headers: {
          "Cache-Control"?: "no-store";
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["InquiryReceipt"];
        };
      };
      /** @description Committed inquiry */
      201: {
        headers: {
          "Cache-Control"?: "no-store";
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["InquiryReceipt"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      413: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      415: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      429: {
        headers: {
          "Retry-After"?: number;
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
    };
  };
  listLeads: {
    parameters: {
      query?: {
        view?: "unassigned" | "all" | "mine";
        q?: string;
        stage?:
          "new" | "contacted" | "viewing_scheduled" | "offer" | "won" | "lost";
        source?: "website" | "call" | "walk_in";
        agentId?: string;
        sort?: "newest" | "oldest" | "updated";
        page?: number;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Success; matching submissionId replay also returns 200. */
      200: {
        headers: {
          "Cache-Control"?: "no-store";
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadPage"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      413: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      415: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
    };
  };
  createLead: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["LeadCreateInput"];
      };
    };
    responses: {
      /** @description Current authorized replay */
      200: {
        headers: {
          "Cache-Control"?: "no-store";
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadDetail"];
        };
      };
      /** @description Created lead */
      201: {
        headers: {
          "Cache-Control"?: "no-store";
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadDetail"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      413: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      415: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
    };
  };
  listLeadAssignmentCandidates: {
    parameters: {
      query?: {
        q?: string;
        page?: number;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Success; matching submissionId replay also returns 200. */
      200: {
        headers: {
          "Cache-Control"?: "no-store";
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadCandidatesPage"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      413: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      415: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
    };
  };
  getLead: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Success; matching submissionId replay also returns 200. */
      200: {
        headers: {
          "Cache-Control"?: "no-store";
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadDetail"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      413: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      415: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
    };
  };
  patchLead: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["LeadPatchInput"];
      };
    };
    responses: {
      /** @description Success; matching submissionId replay also returns 200. */
      200: {
        headers: {
          "Cache-Control"?: "no-store";
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadDetail"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      413: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      415: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
    };
  };
  assignLead: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["LeadAssignmentInput"];
      };
    };
    responses: {
      /** @description Success; matching submissionId replay also returns 200. */
      200: {
        headers: {
          "Cache-Control"?: "no-store";
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadDetail"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      413: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      415: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
    };
  };
  changeLeadStage: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["LeadStageInput"];
      };
    };
    responses: {
      /** @description Success; matching submissionId replay also returns 200. */
      200: {
        headers: {
          "Cache-Control"?: "no-store";
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadDetail"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      413: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      415: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
    };
  };
  appendLeadNote: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["LeadNoteInput"];
      };
    };
    responses: {
      /** @description Matching authorized replay */
      200: {
        headers: {
          "Cache-Control"?: "no-store";
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadNoteResult"];
        };
      };
      /** @description Appended note/call */
      201: {
        headers: {
          "Cache-Control"?: "no-store";
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadNoteResult"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      413: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      415: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
    };
  };
  listLeadActivity: {
    parameters: {
      query?: {
        page?: number;
      };
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Success; matching submissionId replay also returns 200. */
      200: {
        headers: {
          "Cache-Control"?: "no-store";
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadActivityPage"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      413: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      415: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe error envelope; no submitted contact or internal exception details. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
    };
  };
}
