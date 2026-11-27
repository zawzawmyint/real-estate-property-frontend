/** Generated from docs/contracts/record-audit-log.openapi.yaml. Do not edit. */
export interface paths {
  "/api/v1/staff/audit-log": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** @description Current Admin and Manager only. Inclusive from and exclusive to span at most 93 days. actorId excludes actorKind. entityId requires entityType and action must match a supplied entityType. All filters intersect. Ordering is occurredAt then id descending. */
    get: operations["listAuditEvents"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/staff/audit-log/actors": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** @description Current Admin and Manager only. Latest historical staff snapshots per identity. Search is a trimmed literal substring of that snapshot name. Sort by name then id ascending. */
    get: operations["listAuditActors"];
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
    AuditAction:
      | "property.created"
      | "property.updated"
      | "property.deleted"
      | "property.photo_added"
      | "property.photo_removed"
      | "property.photos_reordered"
      | "lead.created"
      | "lead.updated"
      | "lead.assigned"
      | "lead.stage_changed"
      | "lead.temperature_changed"
      | "lead.note_added"
      | "lead.call_logged"
      | "viewing.created"
      | "viewing.rescheduled"
      | "viewing.cancelled"
      | "viewing.completed"
      | "task.created"
      | "task.updated"
      | "task.completed"
      | "task.cancelled"
      | "import.completed";
    /** @enum {string} */
    AuditEntityType: "property" | "lead" | "viewing" | "task" | "import";
    /** @enum {string} */
    AuditActorKind: "staff" | "website" | "system";
    AuditValue: null | boolean | number | string | string[];
    AuditChange:
      | {
          field: string;
          /** @constant */
          redacted: true;
        }
      | {
          field: string;
          /** @constant */
          redacted: false;
          before: components["schemas"]["AuditValue"];
          after: components["schemas"]["AuditValue"];
        };
    AuditActor: {
      /** @enum {string} */
      kind: "staff" | "website" | "system";
      id: string | null;
      name: string | null;
      role: ("admin" | "manager" | "agent") | null;
    };
    AuditActorOption: {
      id: string;
      name: string;
      /** @enum {string} */
      role: "admin" | "manager" | "agent";
    };
    AuditEntity: {
      /** @enum {string} */
      type: "property" | "lead" | "viewing" | "task" | "import";
      /** Format: uuid */
      id: string;
      label: string;
      available: boolean;
    };
    AuditImport: {
      /** Format: uuid */
      id: string;
      /** @enum {string} */
      kind: "property" | "lead";
      createdCount: number | null;
    };
    AuditCoverage: {
      /** Format: date-time */
      startedAt: string;
      /** @constant */
      version: 1;
      /** @constant */
      historicalBackfill: false;
    };
    AuditEvent: {
      /** Format: uuid */
      id: string;
      /** @constant */
      schemaVersion: 1;
      /** Format: date-time */
      occurredAt: string;
      actor: components["schemas"]["AuditActor"];
      entity: components["schemas"]["AuditEntity"];
      action: components["schemas"]["AuditAction"];
      changes: components["schemas"]["AuditChange"][];
      import: components["schemas"]["AuditImport"] | null;
    };
    AuditPage: {
      items: components["schemas"]["AuditEvent"][];
      page: number;
      pageSize: number;
      total: number;
      coverage: components["schemas"]["AuditCoverage"];
    };
    AuditActorPage: {
      items: components["schemas"]["AuditActorOption"][];
      page: number;
      pageSize: number;
      total: number;
    };
    AuditError: {
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
  listAuditEvents: {
    parameters: {
      query: {
        from: string;
        to: string;
        actorId?: string;
        actorKind?: "staff" | "website" | "system";
        entityType?: "property" | "lead" | "viewing" | "task" | "import";
        entityId?: string;
        action?: components["schemas"]["AuditAction"];
        importId?: string;
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
          "Cache-Control"?: "no-store";
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["AuditPage"];
        };
      };
      /** @description Invalid filters */
      400: {
        headers: {
          "Cache-Control"?: "no-store";
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["AuditError"];
        };
      };
      /** @description Staff sign-in required */
      401: {
        headers: {
          "Cache-Control"?: "no-store";
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["AuditError"];
        };
      };
      /** @description Access denied */
      403: {
        headers: {
          "Cache-Control"?: "no-store";
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["AuditError"];
        };
      };
      /** @description Unexpected failure */
      500: {
        headers: {
          "Cache-Control"?: "no-store";
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["AuditError"];
        };
      };
    };
  };
  listAuditActors: {
    parameters: {
      query?: {
        q?: string;
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
          "Cache-Control"?: "no-store";
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["AuditActorPage"];
        };
      };
      /** @description Invalid filters */
      400: {
        headers: {
          "Cache-Control"?: "no-store";
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["AuditError"];
        };
      };
      /** @description Staff sign-in required */
      401: {
        headers: {
          "Cache-Control"?: "no-store";
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["AuditError"];
        };
      };
      /** @description Access denied */
      403: {
        headers: {
          "Cache-Control"?: "no-store";
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["AuditError"];
        };
      };
      /** @description Unexpected failure */
      500: {
        headers: {
          "Cache-Control"?: "no-store";
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["AuditError"];
        };
      };
    };
  };
}
