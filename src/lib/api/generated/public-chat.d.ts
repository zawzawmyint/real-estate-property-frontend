/** Generated from docs/contracts/public-chat.openapi.yaml. Do not edit. */
export interface paths {
  "/api/v1/public/chat": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Answer a public property or agency question
     * @description Anonymous, stateless and read-only. Requires trusted origin and relay in production. The JSON body limit is 8 KiB.
     */
    post: operations["replyToPublicChat"];
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
    PublicChatReply: {
      /** @enum {string} */
      kind: "faq" | "properties" | "clarify" | "no_answer";
      message: string;
      /** @description Only FAQ replies include sources and include at least one. */
      sources: {
        id: string;
        title: string;
        /**
         * @description Allowlisted public site path from the FAQ catalog.
         * @enum {string}
         */
        path: "/contact" | "/properties";
      }[];
      /** @description Only listing replies include property results. An empty listing result means no available matches. */
      properties: components["schemas"]["PublicPropertySummary"][];
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
    ApiError: {
      error: {
        code: string;
        message: string;
        /** Format: uuid */
        requestId: string;
      };
    };
  };
  responses: {
    /** @description Safe public error envelope. */
    ChatError: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["ApiError"];
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
  replyToPublicChat: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": {
          /** @description Length limits apply after trimming. */
          message: string;
        };
      };
    };
    responses: {
      /** @description A sourced answer, live property matches, clarification, or fallback. */
      200: {
        headers: {
          "Cache-Control"?: "no-store";
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["PublicChatReply"];
        };
      };
      400: components["responses"]["ChatError"];
      403: components["responses"]["ChatError"];
      413: components["responses"]["ChatError"];
      415: components["responses"]["ChatError"];
      429: components["responses"]["ChatError"];
      500: components["responses"]["ChatError"];
      503: components["responses"]["ChatError"];
    };
  };
}
