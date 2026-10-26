/** Generated from docs/contracts/properties.openapi.yaml. Do not edit. */
export interface paths {
  "/api/v1/health": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Process liveness, independent of database readiness */
    get: operations["getHealth"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/media/{key}": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Retrieve a saved public image */
    get: operations["getPublicImage"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/auth/sign-in/email": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Sign in provisioned staff using the native Better Auth protocol
     * @description Requires Origin equal to APP_ORIGIN. No signup or administration HTTP endpoints exist. Auth request bodies are limited to 100 KiB before native JSON parsing, including chunked requests. Account throttling allows five attempts per normalized email in fifteen minutes and one hundred attempts per service per minute (single process).
     */
    post: operations["signInEmail"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/auth/get-session": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Read the current database session and staff identity
     * @description Cookie caching and sliding refresh are disabled. Current database role and disabled state are authoritative. Missing, invalid, tampered, expired, revoked or disabled sessions return native 200 null. A store failure returns a non-2xx error. Server callers may omit Origin.
     */
    get: operations["getSession"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/auth/sign-out": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Revoke only the current session and expire its cookie
     * @description Requires exact trusted Origin even without a session. Native empty body or JSON object is accepted. Missing or expired sessions succeed idempotently. Password reset and deactivation revoke all sessions through trusted operator commands only.
     */
    post: operations["signOut"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/properties": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * List published available public properties
     * @description Filters combine with AND except location city/community OR. No private fields. Featured is optional; no fallback inventory. All property responses use Cache-Control: no-store. Unknown/duplicate query keys and malformed numeric strings return 400. Stable sorting uses ID ascending as tie-breaker.
     */
    get: operations["listPublicProperties"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/properties/{id}": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Read one eligible public property
     * @description Missing, draft, archived, sold and rented records all return 404. All property responses use Cache-Control: no-store. Unknown/duplicate query keys and malformed numeric strings return 400. Stable sorting uses ID ascending as tie-breaker.
     */
    get: operations["getPublicProperty"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/staff/properties": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Search all staff inventory
     * @description Admin/Manager/Agent. q matches title/city/community only; owner contact is never searched. All property responses use Cache-Control: no-store. Unknown/duplicate query keys and malformed numeric strings return 400. Stable sorting uses ID ascending as tie-breaker.
     */
    get: operations["listStaffProperties"];
    put?: never;
    /**
     * Create a draft property
     * @description Admin/Manager only. All property responses use Cache-Control: no-store. Unknown/duplicate query keys and malformed numeric strings return 400. Stable sorting uses ID ascending as tie-breaker.
     */
    post: operations["createProperty"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/staff/properties/{id}": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Read staff property details
     * @description All property responses use Cache-Control: no-store. Unknown/duplicate query keys and malformed numeric strings return 400. Stable sorting uses ID ascending as tie-breaker.
     */
    get: operations["getStaffProperty"];
    put?: never;
    post?: never;
    /**
     * Permanently delete an archived property
     * @description Admin only. Existing nonarchived property returns 409. Missing record returns 404, including retry after deletion. All property responses use Cache-Control: no-store. Unknown/duplicate query keys and malformed numeric strings return 400. Stable sorting uses ID ascending as tie-breaker.
     */
    delete: operations["deleteProperty"];
    options?: never;
    head?: never;
    /**
     * Edit, publish, unpublish, archive or restore a property
     * @description Admin/Manager. Archive hides listing. Restore becomes draft. Scalar edits are last committed write wins; never automatically retry ambiguous writes. All property responses use Cache-Control: no-store. Unknown/duplicate query keys and malformed numeric strings return 400. Stable sorting uses ID ascending as tie-breaker.
     */
    patch: operations["patchProperty"];
    trace?: never;
  };
  "/api/v1/staff/properties/{id}/photos": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Append one processed public property image
     * @description Admin/Manager. One raw file, not multipart/base64. 5 MiB streamed and declared limit; 25 million decoded pixels; max 12 photos. MIME must match decoded single-frame JPEG/PNG/WebP; SVG/GIF/animation rejected. Auto-orient, strip metadata, WebP max 2400px without enlargement. Authorization/origin/resource checked before buffering. Draft images are public by direct URL. Failed attachment removes only files confirmed unreferenced; unknown database outcomes retain files for maintenance reconciliation. All property responses use Cache-Control: no-store. Unknown/duplicate query keys and malformed numeric strings return 400. Stable sorting uses ID ascending as tie-breaker.
     */
    post: operations["uploadPropertyPhoto"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/staff/properties/{id}/photos/order": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    /**
     * Set exact current photo order and cover
     * @description Admin/Manager. First photo becomes cover. Stale/foreign/duplicate/incomplete set returns 409. Archived writes fail. All property responses use Cache-Control: no-store. Unknown/duplicate query keys and malformed numeric strings return 400. Stable sorting uses ID ascending as tie-breaker.
     */
    patch: operations["orderPropertyPhotos"];
    trace?: never;
  };
  "/api/v1/staff/properties/{id}/photos/{photoId}": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    /**
     * Remove a property photo and preserve relative order
     * @description Admin/Manager. Wrong membership 404. Published last-photo removal 409. Archived writes fail. DB removal commits before disk cleanup; cleanup failure does not resurrect a photo. All property responses use Cache-Control: no-store. Unknown/duplicate query keys and malformed numeric strings return 400. Stable sorting uses ID ascending as tie-breaker.
     */
    delete: operations["removePropertyPhoto"];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
}
export type webhooks = Record<string, never>;
export interface components {
  schemas: {
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
    PublicPropertyDetail: {
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
      description: string;
      /** @description Ordered; first image is the cover. Public URLs remain accessible for draft and archived properties. */
      photos: components["schemas"]["Photo"][];
    };
    /** @description Agent responses omit ownerName and ownerPhone entirely. Manager/Admin receive nullable owner fields. */
    StaffProperty: {
      /** Format: uuid */
      id: string;
      isDemo: boolean;
      title: string;
      /** @enum {string} */
      purpose: "sale" | "rent";
      type: ("apartment" | "villa" | "townhouse" | "penthouse") | null;
      description: string | null;
      priceFils: number | null;
      city: string | null;
      community: string | null;
      bedrooms: number | null;
      bathrooms: number | null;
      areaSqft: string | null;
      ownerName?: string | null;
      ownerPhone?: string | null;
      featured: boolean;
      /** @enum {string} */
      publishingState: "draft" | "published" | "archived";
      /** @enum {string} */
      availability: "available" | "sold" | "rented";
      /** @description Ordered; first image is the cover. Public URLs remain accessible for draft and archived properties. */
      photos: components["schemas"]["Photo"][];
      /** Format: date-time */
      createdAt: string;
      /** Format: date-time */
      updatedAt: string;
    };
    /** @description Creates a draft, available property. Omitted nullable fields become null; featured defaults false. Immutable IDs, demo flags, URLs, state and availability are rejected. */
    CreateProperty: {
      title: string;
      /** @enum {string} */
      purpose: "sale" | "rent";
      type?: ("apartment" | "villa" | "townhouse" | "penthouse") | null;
      description?: string | null;
      priceFils?: number | null;
      city?: string | null;
      community?: string | null;
      bedrooms?: number | null;
      bathrooms?: number | null;
      areaSqft?: string | null;
      ownerName?: string | null;
      ownerPhone?: string | null;
      featured?: boolean;
    };
    /** @description Atomic merge. Publish requires complete fields, available status and at least one saved photo. Published edits preserve completeness. Archived records accept only publishingState draft. Sold is sale-only, rented rent-only. */
    PatchProperty: {
      title?: string;
      /** @enum {string} */
      purpose?: "sale" | "rent";
      type?: ("apartment" | "villa" | "townhouse" | "penthouse") | null;
      description?: string | null;
      priceFils?: number | null;
      city?: string | null;
      community?: string | null;
      bedrooms?: number | null;
      bathrooms?: number | null;
      areaSqft?: string | null;
      ownerName?: string | null;
      ownerPhone?: string | null;
      featured?: boolean;
      /** @enum {string} */
      publishingState?: "draft" | "published" | "archived";
      /** @enum {string} */
      availability?: "available" | "sold" | "rented";
    };
    PropertyPhotoOrder: {
      /** @description Exact current photo-ID permutation. Stale/foreign/incomplete sets return 409. */
      photoIds: string[];
    };
    PublicPropertyList: {
      items: components["schemas"]["PublicPropertySummary"][];
      total: number;
      page: number;
      pageSize: number;
    };
    StaffPropertyList: {
      items: components["schemas"]["StaffProperty"][];
      total: number;
      page: number;
      pageSize: number;
    };
    /** @description Native Better Auth-compatible error; optional native fields are permitted. */
    AuthError: {
      code?: string;
      message: string;
    };
    /** @description Native user object; credential hashes and disabled field are never returned. Additional library fields may be present. */
    StaffUser: {
      id: string;
      name: string;
      /** Format: email */
      email: string;
      /** @enum {string} */
      role: "admin" | "manager" | "agent";
      emailVerified?: boolean;
      image?: string | null;
      /** Format: date-time */
      createdAt?: string;
      /** Format: date-time */
      updatedAt?: string;
    };
    /** @description Native session metadata. Application code narrows this before rendering; tokens must not be persisted or used as bearer credentials. */
    StaffSession: {
      id: string;
      userId: string;
      token: string;
      /** Format: date-time */
      expiresAt: string;
      /** Format: date-time */
      createdAt: string;
      /** Format: date-time */
      updatedAt: string;
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
    /** @description Native auth failure. Validation 400; generic wrong, unknown or disabled credentials 401; origin 403; auth body over 100 KiB 413; unsupported media 415; safe service failure 500. Auth errors do not use the business error envelope. */
    AuthFailure: {
      headers: {
        "X-Request-Id": components["headers"]["RequestId"];
        "Cache-Control": components["headers"]["NoStore"];
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["AuthError"];
      };
    };
    /** @description Structured failure; unknown routes use 404, malformed JSON 400, oversized JSON 413, unexpected failures 500. */
    Error: {
      headers: {
        "X-Request-Id": components["headers"]["RequestId"];
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["ApiError"];
      };
    };
    /** @description Property business error envelope: validation/invalid image 400; live-session 401; role/origin 403; missing/ineligible 404; workflow/photo invariant 409; bytes 413; media 415; safe infrastructure 500. Messages never echo private values. */
    PropertyError: {
      headers: {
        "Cache-Control": components["headers"]["NoStore"];
        "X-Request-Id": components["headers"]["RequestId"];
        [name: string]: unknown;
      };
      content: {
        "application/json": components["schemas"]["ApiError"];
      };
    };
  };
  parameters: never;
  requestBodies: never;
  headers: {
    /** @description Authentication and property responses are never cacheable. */
    NoStore: "no-store";
    /** @description Server-generated UUID for request correlation */
    RequestId: string;
  };
  pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
  getHealth: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Process is running */
      200: {
        headers: {
          "X-Request-Id": components["headers"]["RequestId"];
          [name: string]: unknown;
        };
        content: {
          "application/json": {
            /** @constant */
            status: "ok";
            /** @constant */
            service: "real-estate-api";
          };
        };
      };
    };
  };
  getPublicImage: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description Generated UUID key with an allowed image extension. Property uploads produce generated public WebP keys. */
        key: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Public image, with Cross-Origin-Resource-Policy cross-origin */
      200: {
        headers: {
          "X-Request-Id": components["headers"]["RequestId"];
          [name: string]: unknown;
        };
        content: {
          "image/*": string;
        };
      };
      404: components["responses"]["Error"];
      500: components["responses"]["Error"];
    };
  };
  signInEmail: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": {
          /**
           * Format: email
           * @description Trimmed and lowercased before validation and credential lookup.
           */
          email: string;
          password: string;
          /**
           * @description Fixed policy; eight-hour absolute sessions, no sliding refresh.
           * @constant
           */
          rememberMe: true;
        };
      };
    };
    responses: {
      /** @description Native successful sign-in; token metadata is protocol data and must never be logged, rendered, persisted in browser storage or used as a bearer credential. */
      200: {
        headers: {
          "X-Request-Id": components["headers"]["RequestId"];
          "Cache-Control": components["headers"]["NoStore"];
          /** @description Signed HttpOnly SameSite=Lax Path=/ host-only agency.session cookie; production uses Secure __Host-agency.session. Max-Age=28800. */
          "Set-Cookie"?: string;
          [name: string]: unknown;
        };
        content: {
          "application/json": {
            /** @constant */
            redirect: false;
            /** @description Native protocol metadata, not an application bearer API. */
            token: string;
            user: components["schemas"]["StaffUser"];
          };
        };
      };
      400: components["responses"]["AuthFailure"];
      401: components["responses"]["AuthFailure"];
      403: components["responses"]["AuthFailure"];
      413: components["responses"]["AuthFailure"];
      415: components["responses"]["AuthFailure"];
      /** @description Login throttled; all attempts including successful attempts count. */
      429: {
        headers: {
          /** @description Seconds until retry is permitted. */
          "Retry-After"?: number;
          "Cache-Control": components["headers"]["NoStore"];
          "X-Request-Id": components["headers"]["RequestId"];
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["AuthError"];
        };
      };
      500: components["responses"]["AuthFailure"];
    };
  };
  getSession: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Native session/user or null; never infer authorization solely from cookie presence. Session token fields are native protocol metadata. */
      200: {
        headers: {
          "X-Request-Id": components["headers"]["RequestId"];
          "Cache-Control": components["headers"]["NoStore"];
          [name: string]: unknown;
        };
        content: {
          "application/json": null | {
            user: components["schemas"]["StaffUser"];
            session: components["schemas"]["StaffSession"];
          };
        };
      };
      500: components["responses"]["AuthFailure"];
    };
  };
  signOut: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: {
      content: {
        "application/json": Record<string, never>;
      };
    };
    responses: {
      /** @description Native logout success, with expiration of the matching signed session cookie. */
      200: {
        headers: {
          "X-Request-Id": components["headers"]["RequestId"];
          "Cache-Control": components["headers"]["NoStore"];
          /** @description Expire the same session cookie name and path with Max-Age=0. */
          "Set-Cookie"?: string;
          [name: string]: unknown;
        };
        content: {
          "application/json": {
            /** @constant */
            success: true;
          };
        };
      };
      403: components["responses"]["AuthFailure"];
      413: components["responses"]["AuthFailure"];
      415: components["responses"]["AuthFailure"];
      500: components["responses"]["AuthFailure"];
    };
  };
  listPublicProperties: {
    parameters: {
      query?: {
        purpose?: "sale" | "rent";
        type?: "apartment" | "villa" | "townhouse" | "penthouse";
        location?: string;
        minPriceFils?: number;
        maxPriceFils?: number;
        minBedrooms?: number;
        featured?: "true" | "false";
        sort?: "newest" | "price_asc" | "price_desc";
        page?: number;
        pageSize?: number;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Success */
      200: {
        headers: {
          "Cache-Control": components["headers"]["NoStore"];
          "X-Request-Id": components["headers"]["RequestId"];
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["PublicPropertyList"];
        };
      };
      400: components["responses"]["PropertyError"];
      404: components["responses"]["PropertyError"];
      500: components["responses"]["PropertyError"];
    };
  };
  getPublicProperty: {
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
      /** @description Success */
      200: {
        headers: {
          "Cache-Control": components["headers"]["NoStore"];
          "X-Request-Id": components["headers"]["RequestId"];
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["PublicPropertyDetail"];
        };
      };
      400: components["responses"]["PropertyError"];
      404: components["responses"]["PropertyError"];
      500: components["responses"]["PropertyError"];
    };
  };
  listStaffProperties: {
    parameters: {
      query?: {
        purpose?: "sale" | "rent";
        type?: "apartment" | "villa" | "townhouse" | "penthouse";
        location?: string;
        minPriceFils?: number;
        maxPriceFils?: number;
        minBedrooms?: number;
        featured?: "true" | "false";
        sort?: "newest" | "price_asc" | "price_desc" | "updated_desc";
        page?: number;
        pageSize?: number;
        q?: string;
        publishingState?: "draft" | "published" | "archived";
        availability?: "available" | "sold" | "rented";
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Success */
      200: {
        headers: {
          "Cache-Control": components["headers"]["NoStore"];
          "X-Request-Id": components["headers"]["RequestId"];
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["StaffPropertyList"];
        };
      };
      400: components["responses"]["PropertyError"];
      401: components["responses"]["PropertyError"];
      403: components["responses"]["PropertyError"];
      404: components["responses"]["PropertyError"];
      500: components["responses"]["PropertyError"];
    };
  };
  createProperty: {
    parameters: {
      query?: never;
      header: {
        /** @description Exact configured APP_ORIGIN; checked before request-body parsing. */
        Origin: string;
      };
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["CreateProperty"];
      };
    };
    responses: {
      /** @description Created */
      201: {
        headers: {
          "Cache-Control": components["headers"]["NoStore"];
          "X-Request-Id": components["headers"]["RequestId"];
          /** @description Created staff property resource (property creation only). */
          Location?: string;
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["StaffProperty"];
        };
      };
      400: components["responses"]["PropertyError"];
      401: components["responses"]["PropertyError"];
      403: components["responses"]["PropertyError"];
      404: components["responses"]["PropertyError"];
      409: components["responses"]["PropertyError"];
      413: components["responses"]["PropertyError"];
      415: components["responses"]["PropertyError"];
      500: components["responses"]["PropertyError"];
    };
  };
  getStaffProperty: {
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
      /** @description Success */
      200: {
        headers: {
          "Cache-Control": components["headers"]["NoStore"];
          "X-Request-Id": components["headers"]["RequestId"];
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["StaffProperty"];
        };
      };
      400: components["responses"]["PropertyError"];
      401: components["responses"]["PropertyError"];
      403: components["responses"]["PropertyError"];
      404: components["responses"]["PropertyError"];
      500: components["responses"]["PropertyError"];
    };
  };
  deleteProperty: {
    parameters: {
      query?: never;
      header: {
        /** @description Exact configured APP_ORIGIN; checked before request-body parsing. */
        Origin: string;
      };
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Deleted; no body. File cleanup follows DB commit; failures are logged for maintenance reconciliation. */
      204: {
        headers: {
          "Cache-Control": components["headers"]["NoStore"];
          [name: string]: unknown;
        };
        content?: never;
      };
      400: components["responses"]["PropertyError"];
      401: components["responses"]["PropertyError"];
      403: components["responses"]["PropertyError"];
      404: components["responses"]["PropertyError"];
      409: components["responses"]["PropertyError"];
      500: components["responses"]["PropertyError"];
    };
  };
  patchProperty: {
    parameters: {
      query?: never;
      header: {
        /** @description Exact configured APP_ORIGIN; checked before request-body parsing. */
        Origin: string;
      };
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["PatchProperty"];
      };
    };
    responses: {
      /** @description Success */
      200: {
        headers: {
          "Cache-Control": components["headers"]["NoStore"];
          "X-Request-Id": components["headers"]["RequestId"];
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["StaffProperty"];
        };
      };
      400: components["responses"]["PropertyError"];
      401: components["responses"]["PropertyError"];
      403: components["responses"]["PropertyError"];
      404: components["responses"]["PropertyError"];
      409: components["responses"]["PropertyError"];
      413: components["responses"]["PropertyError"];
      415: components["responses"]["PropertyError"];
      500: components["responses"]["PropertyError"];
    };
  };
  uploadPropertyPhoto: {
    parameters: {
      query?: never;
      header: {
        /** @description Exact configured APP_ORIGIN; checked before request-body parsing. */
        Origin: string;
      };
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        "image/jpeg": string;
        "image/png": string;
        "image/webp": string;
      };
    };
    responses: {
      /** @description Created */
      201: {
        headers: {
          "Cache-Control": components["headers"]["NoStore"];
          "X-Request-Id": components["headers"]["RequestId"];
          /** @description Created staff property resource (property creation only). */
          Location?: string;
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["StaffProperty"];
        };
      };
      400: components["responses"]["PropertyError"];
      401: components["responses"]["PropertyError"];
      403: components["responses"]["PropertyError"];
      404: components["responses"]["PropertyError"];
      409: components["responses"]["PropertyError"];
      413: components["responses"]["PropertyError"];
      415: components["responses"]["PropertyError"];
      500: components["responses"]["PropertyError"];
    };
  };
  orderPropertyPhotos: {
    parameters: {
      query?: never;
      header: {
        /** @description Exact configured APP_ORIGIN; checked before request-body parsing. */
        Origin: string;
      };
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["PropertyPhotoOrder"];
      };
    };
    responses: {
      /** @description Success */
      200: {
        headers: {
          "Cache-Control": components["headers"]["NoStore"];
          "X-Request-Id": components["headers"]["RequestId"];
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["StaffProperty"];
        };
      };
      400: components["responses"]["PropertyError"];
      401: components["responses"]["PropertyError"];
      403: components["responses"]["PropertyError"];
      404: components["responses"]["PropertyError"];
      409: components["responses"]["PropertyError"];
      413: components["responses"]["PropertyError"];
      415: components["responses"]["PropertyError"];
      500: components["responses"]["PropertyError"];
    };
  };
  removePropertyPhoto: {
    parameters: {
      query?: never;
      header: {
        /** @description Exact configured APP_ORIGIN; checked before request-body parsing. */
        Origin: string;
      };
      path: {
        id: string;
        photoId: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Success */
      200: {
        headers: {
          "Cache-Control": components["headers"]["NoStore"];
          "X-Request-Id": components["headers"]["RequestId"];
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["StaffProperty"];
        };
      };
      400: components["responses"]["PropertyError"];
      401: components["responses"]["PropertyError"];
      403: components["responses"]["PropertyError"];
      404: components["responses"]["PropertyError"];
      409: components["responses"]["PropertyError"];
      413: components["responses"]["PropertyError"];
      415: components["responses"]["PropertyError"];
      500: components["responses"]["PropertyError"];
    };
  };
}
