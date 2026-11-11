/** Generated from docs/contracts/notifications.openapi.yaml. Do not edit. */
export interface paths {
  "/api/v1/staff/notifications": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * List the session recipient's visible notifications
     * @description Newest first by creation timestamp and ID. The unread count includes all visible unread items, independent of the cursor.
     */
    get: operations["listStaffNotifications"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/staff/notifications/{id}/read": {
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
     * Mark an owned and visible notification as read
     * @description No body. Requires Origin equal to APP_ORIGIN. Repeated calls preserve the first read timestamp.
     */
    patch: operations["markStaffNotificationRead"];
    trace?: never;
  };
  "/api/v1/staff/notifications/stream": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Receive session-scoped notification change signals
     * @description Sends a named notifications.changed event with JSON data {} after subscribing and after committed inbox changes. A comment heartbeat checks live access every 15 seconds. Reconnect and refresh the inbox to recover missed signals.
     */
    get: operations["streamStaffNotifications"];
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
    NotificationType:
      | "lead_assigned"
      | "viewing_rescheduled"
      | "viewing_cancelled"
      | "task_due_soon"
      | "website_inquiry_received";
    NotificationItem: {
      /** Format: uuid */
      id: string;
      type: components["schemas"]["NotificationType"];
      /** Format: uuid */
      leadId: string;
      /** Format: uuid */
      viewingId: string | null;
      /** Format: uuid */
      taskId: string | null;
      /** Format: date-time */
      createdAt: string;
      /** Format: date-time */
      readAt: string | null;
    };
    NotificationPage: {
      items: components["schemas"]["NotificationItem"][];
      unreadCount: number;
      nextCursor: string | null;
    };
  };
  responses: {
    /** @description Safe API error */
    Error: {
      headers: {
        "Cache-Control": components["headers"]["NoStore"];
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
  headers: {
    NoStore: "no-store";
  };
  pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
  listStaffNotifications: {
    parameters: {
      query?: {
        /** @description Opaque cursor from a previous response. */
        cursor?: string;
      };
      header?: {
        /** @description Optional expected staff ID. A mismatch with the live session identity returns 403. */
        "X-Staff-Account"?: string;
      };
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Visible notification page and total unread count */
      200: {
        headers: {
          "Cache-Control": components["headers"]["NoStore"];
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["NotificationPage"];
        };
      };
      400: components["responses"]["Error"];
      401: components["responses"]["Error"];
      403: components["responses"]["Error"];
      500: components["responses"]["Error"];
    };
  };
  markStaffNotificationRead: {
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
      /** @description Marked read or already read */
      204: {
        headers: {
          "Cache-Control": components["headers"]["NoStore"];
          [name: string]: unknown;
        };
        content?: never;
      };
      400: components["responses"]["Error"];
      401: components["responses"]["Error"];
      403: components["responses"]["Error"];
      404: components["responses"]["Error"];
      500: components["responses"]["Error"];
    };
  };
  streamStaffNotifications: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Server-sent event stream */
      200: {
        headers: {
          "Cache-Control"?: "no-store, no-transform";
          [name: string]: unknown;
        };
        content: {
          "text/event-stream": string;
        };
      };
      400: components["responses"]["Error"];
      401: components["responses"]["Error"];
      500: components["responses"]["Error"];
      503: components["responses"]["Error"];
    };
  };
}
