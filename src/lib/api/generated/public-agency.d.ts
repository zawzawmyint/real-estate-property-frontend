/** Generated from docs/contracts/public-agency.openapi.yaml. Do not edit. */
export interface paths {
  "/api/v1/public/agency": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * getPublicAgency
     * @description Anonymous, read-only curated editorial content, independent of staff accounts. No query parameters accepted; unknown or duplicate query keys return 400. Catalog validation fails closed for all content routes. Plain-text content; no internal editorial or auth fields.
     */
    get: operations["getPublicAgency"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/public/agents": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * listPublicAgents
     * @description Anonymous, read-only curated editorial content, independent of staff accounts. No query parameters accepted; unknown or duplicate query keys return 400. Catalog validation fails closed for all content routes. Plain-text content; no internal editorial or auth fields.
     */
    get: operations["listPublicAgents"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/public/agents/{slug}": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * getPublicAgent
     * @description Anonymous, read-only curated editorial content, independent of staff accounts. No query parameters accepted; unknown or duplicate query keys return 400. Catalog validation fails closed for all content routes. Plain-text content; no internal editorial or auth fields.
     */
    get: operations["getPublicAgent"];
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
    AgentPortrait: {
      src: string;
      width: number;
      height: number;
    };
    PublicAgency: {
      name: string;
      isDemo: boolean;
      /** @description Canonical phone: ASCII spaces only, trimmed, 3-40 characters and at least one digit. Repeated internal spaces are preserved. */
      phone: string | null;
      /** Format: email */
      email: string | null;
      address: string | null;
      officeHours: {
        days: string;
        hours: string;
      }[];
      /** @constant */
      timeZone: "Asia/Dubai";
      /**
       * Format: uri
       * @description Approved absolute HTTPS URL without credentials.
       */
      mapUrl: string | null;
    };
    PublicAgentSummary: {
      slug: string;
      name: string;
      title: string;
      specialties: string[];
      portrait: components["schemas"]["AgentPortrait"] | null;
      isDemo: boolean;
    };
    PublicAgentDetail: {
      slug: string;
      name: string;
      title: string;
      specialties: string[];
      portrait: components["schemas"]["AgentPortrait"] | null;
      isDemo: boolean;
      introduction: string;
      biography: string[];
      languages: string[];
      /** @description Canonical phone: ASCII spaces only, trimmed, 3-40 characters and at least one digit. Repeated internal spaces are preserved. */
      publicPhone: string | null;
      /** Format: email */
      publicEmail: string | null;
    };
    PublicAgentDirectory: {
      items: components["schemas"]["PublicAgentSummary"][];
      /** @description Equals items.length. Published profiles only, sorted by name then slug using UTF-16 code-unit comparison. */
      total: number;
    };
    PublicAgencyApiError: {
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
  getPublicAgency: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Public content */
      200: {
        headers: {
          "Cache-Control"?: "no-store";
          "X-Request-Id"?: string;
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["PublicAgency"];
        };
      };
      /** @description Query parameters are not supported */
      400: {
        headers: {
          "Cache-Control"?: "no-store";
          "X-Request-Id"?: string;
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["PublicAgencyApiError"];
        };
      };
      /** @description Public agency content is unavailable */
      503: {
        headers: {
          "Cache-Control"?: "no-store";
          "X-Request-Id"?: string;
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["PublicAgencyApiError"];
        };
      };
    };
  };
  listPublicAgents: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Public content */
      200: {
        headers: {
          "Cache-Control"?: "no-store";
          "X-Request-Id"?: string;
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["PublicAgentDirectory"];
        };
      };
      /** @description Query parameters are not supported */
      400: {
        headers: {
          "Cache-Control"?: "no-store";
          "X-Request-Id"?: string;
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["PublicAgencyApiError"];
        };
      };
      /** @description Public agency content is unavailable */
      503: {
        headers: {
          "Cache-Control"?: "no-store";
          "X-Request-Id"?: string;
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["PublicAgencyApiError"];
        };
      };
    };
  };
  getPublicAgent: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        slug: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Public content */
      200: {
        headers: {
          "Cache-Control"?: "no-store";
          "X-Request-Id"?: string;
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["PublicAgentDetail"];
        };
      };
      /** @description Query parameters are not supported */
      400: {
        headers: {
          "Cache-Control"?: "no-store";
          "X-Request-Id"?: string;
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["PublicAgencyApiError"];
        };
      };
      /** @description Malformed, unknown or unpublished agent slug */
      404: {
        headers: {
          "Cache-Control"?: "no-store";
          "X-Request-Id"?: string;
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["PublicAgencyApiError"];
        };
      };
      /** @description Public agency content is unavailable */
      503: {
        headers: {
          "Cache-Control"?: "no-store";
          "X-Request-Id"?: string;
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["PublicAgencyApiError"];
        };
      };
    };
  };
}
