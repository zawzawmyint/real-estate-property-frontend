/** Generated from docs/contracts/viewings.openapi.yaml. Do not edit. */
export interface paths {
  "/api/v1/staff/viewings": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** List current-ownership scoped appointments ordered by startsAt and id */
    get: operations["listViewings"];
    put?: never;
    /** Book a future 15–240 minute appointment for an eligible assigned lead and published available property */
    post: operations["createViewing"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/staff/viewings/{id}": {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    get: operations["getViewing"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    /** Reschedule scheduled appointment with current lead/version/eligibility checks */
    patch: operations["rescheduleViewing"];
    trace?: never;
  };
  "/api/v1/staff/viewings/{id}/status": {
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
    /** Cancel or complete a scheduled appointment; completion requires a started appointment and immutable feedback */
    patch: operations["updateViewingStatus"];
    trace?: never;
  };
}
export type webhooks = Record<string, never>;
export interface components {
  schemas: {
    Viewing: {
      /** Format: uuid */
      id: string;
      lead: {
        /** Format: uuid */
        id: string;
        name: string;
      };
      property: {
        /** Format: uuid */
        id: string;
        title: string;
        location: string | null;
        bookable: boolean;
      };
      assignedAgent: null | {
        id: string;
        name: string;
      };
      /** Format: date-time */
      startsAt: string;
      /** Format: date-time */
      endsAt: string;
      /** @enum {string} */
      status: "scheduled" | "completed" | "cancelled";
      feedback: string | null;
      version: number;
      /** Format: date-time */
      createdAt: string;
      /** Format: date-time */
      updatedAt: string;
    };
    CreateViewing: {
      /** Format: uuid */
      submissionId: string;
      /** Format: uuid */
      leadId: string;
      /** Format: uuid */
      propertyId: string;
      expectedLeadVersion: number;
      /** Format: date-time */
      startsAt: string;
      /** Format: date-time */
      endsAt: string;
    };
    RescheduleViewing: {
      expectedVersion: number;
      expectedLeadVersion: number;
      /** Format: date-time */
      startsAt: string;
      /** Format: date-time */
      endsAt: string;
    };
    UpdateViewingStatus:
      | {
          expectedVersion: number;
          /** @constant */
          status: "cancelled";
        }
      | {
          expectedVersion: number;
          /** @constant */
          status: "completed";
          feedback: string;
        };
  };
  responses: {
    /** @description Privacy-safe viewing; identical authorized create replay returns 200 */
    ViewingSuccess: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["Viewing"];
      };
    };
    /** @description Structured error; inaccessible records return 404, stale versions or lifecycle/eligibility conflicts return 409 */
    ViewingError: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": {
          error: {
            code: string;
            message: string;
            requestId: string;
            /**
             * Format: uuid
             * @description Only for VIEWING_RECEIPT_CONFLICT after current access and same-actor verification; open the saved appointment for review. Retain submissionId across deliberate corrections to prevent delayed requests creating duplicates.
             */
            existingViewingId?: string;
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
  listViewings: {
    parameters: {
      query: {
        /** @description Inclusive start; offset required */
        from: string;
        /** @description Exclusive end; range at most 42 days */
        to: string;
        page?: number;
        pageSize?: number;
        leadId?: string;
        status?: "scheduled" | "completed" | "cancelled";
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Authorized appointments; all states by default */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": {
            items: components["schemas"]["Viewing"][];
            page: number;
            pageSize: number;
            total: number;
          };
        };
      };
      400: components["responses"]["ViewingError"];
      401: components["responses"]["ViewingError"];
      404: components["responses"]["ViewingError"];
    };
  };
  createViewing: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["CreateViewing"];
      };
    };
    responses: {
      200: components["responses"]["ViewingSuccess"];
      201: components["responses"]["ViewingSuccess"];
      400: components["responses"]["ViewingError"];
      401: components["responses"]["ViewingError"];
      403: components["responses"]["ViewingError"];
      404: components["responses"]["ViewingError"];
      409: components["responses"]["ViewingError"];
      413: components["responses"]["ViewingError"];
      415: components["responses"]["ViewingError"];
    };
  };
  getViewing: {
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
      200: components["responses"]["ViewingSuccess"];
      400: components["responses"]["ViewingError"];
      401: components["responses"]["ViewingError"];
      404: components["responses"]["ViewingError"];
    };
  };
  rescheduleViewing: {
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
        "application/json": components["schemas"]["RescheduleViewing"];
      };
    };
    responses: {
      200: components["responses"]["ViewingSuccess"];
      400: components["responses"]["ViewingError"];
      401: components["responses"]["ViewingError"];
      403: components["responses"]["ViewingError"];
      404: components["responses"]["ViewingError"];
      409: components["responses"]["ViewingError"];
      413: components["responses"]["ViewingError"];
      415: components["responses"]["ViewingError"];
    };
  };
  updateViewingStatus: {
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
        "application/json": components["schemas"]["UpdateViewingStatus"];
      };
    };
    responses: {
      200: components["responses"]["ViewingSuccess"];
      400: components["responses"]["ViewingError"];
      401: components["responses"]["ViewingError"];
      403: components["responses"]["ViewingError"];
      404: components["responses"]["ViewingError"];
      409: components["responses"]["ViewingError"];
      413: components["responses"]["ViewingError"];
      415: components["responses"]["ViewingError"];
    };
  };
}
