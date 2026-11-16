/** Generated from docs/contracts/leads.openapi.yaml. Do not edit. */
export interface paths {
  "/api/v1/staff/leads/imports/template": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Download the lead CSV import template
     * @description Current Admin/Manager only. Header-only UTF-8 BOM and CRLF; filename lead-import-template.csv. No writes.
     */
    get: operations["getLeadImportTemplate"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/staff/leads/imports/preview": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Validate new leads without writing
     * @description No-store. Current Admin/Manager authorization runs before POST body consumption, then trusted Origin, JSON type, UTF-8 charset and 6 MiB parser. CSV maximum 1048576 UTF-8 bytes, 500 data records, 65536 raw record bytes including quoting/newline. Reject malformed UTF-8, NUL and unpaired surrogates. Ignore empty lines; quoted multiline values stay one logical record. Trim headers, allow reorder, reject unknown/duplicate/empty or inconsistent columns and empty batches. Require name,purpose,source and at least one phone/email header. Columns name,phone,email,purpose,budget_aed,source. Existing trimmed name (1-120), valid phone (3-40, digits/plus/parentheses/spaces/hyphens, at least one digit), valid lowercase email (max 254); every row needs a contact and any supplied invalid contact rejects. Preserve phone leading zeroes. Lowercase purpose sale/rent and manual source call/walk_in only. Optional positive plain decimal AED budget with <=2 fractional digits maps exactly to 1..1000000000000 fils. Null fields are blank. Validates every row; accurate total counts with at most 20 preview rows and 100 issues. Domain-invalid rows return valid=false. No leads, activities, receipts or notifications are written. Digest is lowercase SHA256 of UTF-8 lead-import:v1 followed by a NUL byte and the exact CSV UTF-8 bytes including BOM.
     */
    post: operations["previewLeadImport"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/staff/leads/imports/commit": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Atomically create reviewed new unassigned leads
     * @description No-store. Current Admin/Manager authorization runs before POST body consumption, then trusted Origin, JSON type, UTF-8 charset and 6 MiB parser. CSV maximum 1048576 UTF-8 bytes, 500 data records, 65536 raw record bytes including quoting/newline. Reject malformed UTF-8, NUL and unpaired surrogates. Ignore empty lines; quoted multiline values stay one logical record. Trim headers, allow reorder, reject unknown/duplicate/empty or inconsistent columns and empty batches. Require name,purpose,source and at least one phone/email header. Columns name,phone,email,purpose,budget_aed,source. Existing trimmed name (1-120), valid phone (3-40, digits/plus/parentheses/spaces/hyphens, at least one digit), valid lowercase email (max 254); every row needs a contact and any supplied invalid contact rejects. Preserve phone leading zeroes. Lowercase purpose sale/rent and manual source call/walk_in only. Optional positive plain decimal AED budget with <=2 fractional digits maps exactly to 1..1000000000000 fils. Null fields are blank. Revalidates live staff, CSV, digest and version. Acquire SQLite write reservation before live actor/receipt reads; all leads, normalized search fields, one actor-attributed created activity per row and aggregate LeadImportReceipt commit atomically. New stage, version 1, unassigned/unlinked, actor creator; no original messages, notifications or single-lead submission receipts. Never deduplicate/upsert. Same actor/UUID/content/version returns original IDs/count and preserves later edits/assignments. Another actor/content/version gives generic IMPORT_CONFLICT before stale-preview details. Unsupported positive schemaVersion or mismatched digest gives IMPORT_PREVIEW_STALE. Digest namespace lead-import:v1 then NUL and exact CSV bytes including BOM. Receipt retains no raw CSV/contact snapshots.
     */
    post: operations["commitLeadImport"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/staff/leads/export": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Download filtered leads as CSV
     * @description All staff; authorization and data are read in one bounded live-session transaction. Agents default to mine and cannot export other agents or unassigned leads. Admin/Manager default to unassigned; agentId requires view=all. Exports all matches across pages. Reject unknown, duplicate and pagination query keys. Maximum 5000 records and 10485760 UTF-8 bytes; overflow returns JSON before CSV headers. UTF-8 BOM, comma-separated, CRLF records, formula escaping; nulls blank, booleans true/false, monetary and area values fixed two decimal places, timestamps UTC ISO 8601.
     */
    get: operations["exportLeadsCsv"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/staff/leads/{id}/property-matches": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Find available public properties for a lead
     * @description Live staff session required. Admin and Manager can access all leads; Agent can access currently assigned leads only. Uses confirmed query values and returns published, available listings in newest order with a fixed page size of 10. Price cap is inclusive, using sale total or annual rent.
     */
    get: operations["listLeadPropertyMatches"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/public/inquiries": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Capture a property-independent unassigned website lead
     * @description Exact APP_ORIGIN; trusted inquiry relay; JSON <=16KiB. Required purpose (sale/rent), message and at least one phone/email. Server controls Website/New/unassigned/null property and budget. Atomic lead, created activity and agency_inquiry receipt. Identical canonical replay returns acknowledgement; changed payload or cross-operation ID reuse returns 409. Responses never expose lead IDs or submitted values. Shares one five-attempt / 15-minute budget with property inquiries, including invalid/replayed attempts. Production requires complete valid signed relay headers; missing, partial, malformed or invalid signatures return 403 before limiter consumption or persistence. Outside production, absence of both headers permits hashed socket fallback. Bounded single-process limiter semantics apply.
     */
    post: operations["submitAgencyInquiry"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
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
     * @description Exact APP_ORIGIN and JSON <=16KiB. Forces New/unassigned website lead with property purpose/snapshots. No lead identifiers returned. Same canonical submission replays even after property unavailability. Five attempts shared with POST /api/v1/public/inquiries per signed client/socket in rolling 15 minutes; invalid attempts and replays count. Single-process bounded limiter; saturated map fails closed. Server relay sends HMAC-SHA256(INQUIRY_RELAY_SECRET, real ingress identity) as x-inquiry-client-key and HMAC-SHA256(secret, clientKey) as x-inquiry-relay-signature. Production requires both valid relay headers; missing, partial, malformed or invalid signatures return 403 before limiter consumption or persistence. Outside production, absence of both headers permits hashed socket fallback. Supplied invalid headers never fall back; raw forwarded headers are ignored.
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
    AgencyInquiryInput:
      | {
          /** Format: uuid */
          submissionId: string;
          name: string;
          /** @description Every JavaScript whitespace character is replaced with ASCII space, then trimmed before validation. The canonical phone must be 3-40 characters, contain a digit, and use only plus, digits, ASCII spaces, parentheses or hyphens. Repeated internal spaces are preserved. At least one phone or email is required. */
          phone?: string | null;
          /** Format: email */
          email?: string | null;
          message: string;
          /** @enum {string} */
          purpose: "sale" | "rent";
        }
      | {
          phone: string;
        }
      | {
          email: string;
        };
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
      /** @description Canonical phone: ASCII spaces only, trimmed, 3-40 characters and at least one digit. Repeated internal spaces are preserved. */
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
      /** @description Every JavaScript whitespace character is replaced with ASCII space, then trimmed before validation. The canonical phone must be 3-40 characters, contain a digit, and use only plus, digits, ASCII spaces, parentheses or hyphens. Repeated internal spaces are preserved. At least one phone or email is required. */
      phone?: string | null;
      /** Format: email */
      email?: string | null;
      message?: string | null;
    };
    LeadCreateInput: {
      /** Format: uuid */
      submissionId: string;
      name: string;
      /** @description Every JavaScript whitespace character is replaced with ASCII space, then trimmed before validation. The canonical phone must be 3-40 characters, contain a digit, and use only plus, digits, ASCII spaces, parentheses or hyphens. Repeated internal spaces are preserved. At least one phone or email is required. */
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
      /** @description Every JavaScript whitespace character is replaced with ASCII space, then trimmed before validation. The canonical phone must be 3-40 characters, contain a digit, and use only plus, digits, ASCII spaces, parentheses or hyphens. Repeated internal spaces are preserved. At least one phone or email is required. */
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
    LeadImportIssue: {
      /** @description Logical nonempty CSV record, header is 1. */
      rowNumber: number;
      column: string;
      message: string;
    };
    LeadImportPreview: {
      /** @constant */
      schemaVersion: 1;
      digest: string;
      valid: boolean;
      totalRows: number;
      validRows: number;
      issueCount: number;
      issues: components["schemas"]["LeadImportIssue"][];
      /** @description Template order name,phone,email,purpose,budget_aed,source. */
      columns: string[];
      previewRows: {
        rowNumber: number;
        values: string[];
      }[];
    };
    LeadImportResult: {
      /** Format: uuid */
      submissionId: string;
      createdCount: number;
      leadIds: string[];
      replayed: boolean;
    };
    LeadImportValidationError: {
      error: {
        /** @constant */
        code: "IMPORT_VALIDATION_FAILED";
        /** @constant */
        message: "Fix every invalid row before importing.";
        /** Format: uuid */
        requestId: string;
      };
      issues: components["schemas"]["LeadImportIssue"][];
      issueCount: number;
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
      /** @description Canonical phone: ASCII spaces only, trimmed, 3-40 characters and at least one digit. Repeated internal spaces are preserved. */
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
    Photo: {
      /** Format: uuid */
      id: string;
      /** Format: uri */
      url: string;
      width: number;
      height: number;
    };
    PublicPropertySummary: {
      /** Format: uuid */
      id: string;
      /** @description True for explicitly seeded illustrative demo inventory. */
      isDemo: boolean;
      title: string;
      /** @enum {string} */
      purpose: "sale" | "rent";
      /** @enum {string} */
      type: "apartment" | "villa" | "townhouse" | "penthouse";
      priceFils: number;
      city: string;
      community: string;
      bedrooms: number;
      bathrooms: number;
      /** @description Positive sqft decimal, at most 1000000, at most two decimal places. Responses always use two decimal places. */
      areaSqft: string;
      coverPhoto: components["schemas"]["Photo"];
    };
    PublicPropertyList: {
      items: components["schemas"]["PublicPropertySummary"][];
      total: number;
      page: number;
      pageSize: number;
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
  getLeadImportTemplate: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description CSV template attachment */
      200: {
        headers: {
          "Cache-Control"?: "no-store";
          "X-Request-Id"?: string;
          "X-Content-Type-Options"?: "nosniff";
          "Content-Disposition"?: 'attachment; filename="lead-import-template.csv"';
          [name: string]: unknown;
        };
        content: {
          "text/csv; charset=utf-8": string;
        };
      };
      /** @description UNAUTHENTICATED: current staff session required. */
      401: {
        headers: {
          "Cache-Control"?: "no-store";
          "X-Request-Id"?: string;
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description FORBIDDEN: only current Admin/Manager staff may import. */
      403: {
        headers: {
          "Cache-Control"?: "no-store";
          "X-Request-Id"?: string;
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
    };
  };
  previewLeadImport: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": {
          csv: string;
        };
      };
    };
    responses: {
      /** @description Bounded preview including domain-invalid rows. */
      200: {
        headers: {
          "Cache-Control"?: "no-store";
          "X-Request-Id"?: string;
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadImportPreview"];
        };
      };
      /** @description VALIDATION_ERROR for request shape, or IMPORT_INVALID_CSV for structural/header/encoding errors. */
      400: {
        headers: {
          "Cache-Control"?: "no-store";
          "X-Request-Id"?: string;
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description UNAUTHENTICATED: current staff session required. */
      401: {
        headers: {
          "Cache-Control"?: "no-store";
          "X-Request-Id"?: string;
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description FORBIDDEN: only current Admin/Manager staff may import. */
      403: {
        headers: {
          "Cache-Control"?: "no-store";
          "X-Request-Id"?: string;
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description IMPORT_LIMIT_EXCEEDED or transport body too large. */
      413: {
        headers: {
          "Cache-Control"?: "no-store";
          "X-Request-Id"?: string;
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description UNSUPPORTED_MEDIA_TYPE: require UTF-8 application/json. */
      415: {
        headers: {
          "Cache-Control"?: "no-store";
          "X-Request-Id"?: string;
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe persistence failure; whole batch rolls back. */
      500: {
        headers: {
          "Cache-Control"?: "no-store";
          "X-Request-Id"?: string;
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
    };
  };
  commitLeadImport: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": {
          /** Format: uuid */
          submissionId: string;
          /** @description Currently 1; unsupported positive version requires another preview. */
          schemaVersion: number;
          digest: string;
          csv: string;
        };
      };
    };
    responses: {
      /** @description Original batch IDs/count; replayed=true. */
      200: {
        headers: {
          "Cache-Control"?: "no-store";
          "X-Request-Id"?: string;
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadImportResult"];
        };
      };
      /** @description New batch; replayed=false. */
      201: {
        headers: {
          "Cache-Control"?: "no-store";
          "X-Request-Id"?: string;
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadImportResult"];
        };
      };
      /** @description VALIDATION_ERROR for request shape, or IMPORT_INVALID_CSV for structural/header/encoding errors. */
      400: {
        headers: {
          "Cache-Control"?: "no-store";
          "X-Request-Id"?: string;
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description UNAUTHENTICATED: current staff session required. */
      401: {
        headers: {
          "Cache-Control"?: "no-store";
          "X-Request-Id"?: string;
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description FORBIDDEN: only current Admin/Manager staff may import. */
      403: {
        headers: {
          "Cache-Control"?: "no-store";
          "X-Request-Id"?: string;
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description IMPORT_CONFLICT (private generic response) or IMPORT_PREVIEW_STALE. */
      409: {
        headers: {
          "Cache-Control"?: "no-store";
          "X-Request-Id"?: string;
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description IMPORT_LIMIT_EXCEEDED or transport body too large. */
      413: {
        headers: {
          "Cache-Control"?: "no-store";
          "X-Request-Id"?: string;
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description UNSUPPORTED_MEDIA_TYPE: require UTF-8 application/json. */
      415: {
        headers: {
          "Cache-Control"?: "no-store";
          "X-Request-Id"?: string;
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description IMPORT_VALIDATION_FAILED: zero batch writes. */
      422: {
        headers: {
          "Cache-Control"?: "no-store";
          "X-Request-Id"?: string;
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadImportValidationError"];
        };
      };
      /** @description Safe persistence failure; whole batch rolls back. */
      500: {
        headers: {
          "Cache-Control"?: "no-store";
          "X-Request-Id"?: string;
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
    };
  };
  exportLeadsCsv: {
    parameters: {
      query?: {
        view?: "unassigned" | "all" | "mine";
        q?: string;
        stage?:
          "new" | "contacted" | "viewing_scheduled" | "offer" | "won" | "lost";
        source?: "website" | "call" | "walk_in";
        agentId?: string;
        sort?: "newest" | "oldest" | "updated";
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description CSV attachment (empty matches return BOM plus header). Fixed columns are defined in specs/csv-import-export/contract.md. */
      200: {
        headers: {
          /** @description Export-start calendar date in Asia/Dubai. */
          "Content-Disposition"?: string;
          "Cache-Control"?: "no-store";
          "X-Content-Type-Options"?: "nosniff";
          "X-Request-Id"?: string;
          [name: string]: unknown;
        };
        content: {
          "text/csv; charset=utf-8": string;
        };
      };
      /** @description VALIDATION_ERROR: invalid query or contradictory ranges */
      400: {
        headers: {
          "X-Request-Id"?: string;
          "Cache-Control"?: "no-store";
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description UNAUTHENTICATED: live staff session required */
      401: {
        headers: {
          "X-Request-Id"?: string;
          "Cache-Control"?: "no-store";
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description FORBIDDEN: access denied */
      403: {
        headers: {
          "X-Request-Id"?: string;
          "Cache-Control"?: "no-store";
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description EXPORT_LIMIT_EXCEEDED: Too many results to export. Narrow your filters and try again. */
      422: {
        headers: {
          "X-Request-Id"?: string;
          "Cache-Control"?: "no-store";
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Safe internal error */
      500: {
        headers: {
          "X-Request-Id"?: string;
          "Cache-Control"?: "no-store";
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
    };
  };
  listLeadPropertyMatches: {
    parameters: {
      query: {
        purpose: "sale" | "rent";
        maxPriceFils?: number;
        location?: string;
        type?: "apartment" | "villa" | "townhouse" | "penthouse";
        exactBedrooms?: number;
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
      /** @description Page of published and available properties */
      200: {
        headers: {
          "Cache-Control"?: "no-store";
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["PublicPropertyList"];
        };
      };
      /** @description Invalid search */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Session required */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Staff access required */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Lead unavailable */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["LeadApiError"];
        };
      };
      /** @description Unexpected error */
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
  submitAgencyInquiry: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["AgencyInquiryInput"];
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
