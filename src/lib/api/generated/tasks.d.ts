/** Generated from docs/contracts/tasks.openapi.yaml. Do not edit. */
export interface paths {
  "/api/v1/staff/tasks": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: operations["listTasks"];
    put?: never;
    post: operations["createTask"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/api/v1/staff/tasks/{id}": {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    get: operations["getTask"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch: operations["updateTask"];
    trace?: never;
  };
  "/api/v1/staff/tasks/{id}/status": {
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
    patch: operations["updateTaskStatus"];
    trace?: never;
  };
}
export type webhooks = Record<string, never>;
export interface components {
  schemas: {
    Task: {
      /** Format: uuid */
      id: string;
      lead: {
        id: string;
        name: string;
      };
      assignedAgent: {
        id: string;
        name: string;
      } | null;
      title: string;
      notes: string | null;
      /** Format: date-time */
      dueAt: string;
      /** @enum {string} */
      status: "open" | "completed" | "cancelled";
      isOverdue: boolean;
      /** Format: date-time */
      completedAt: string | null;
      /** Format: date-time */
      cancelledAt: string | null;
      version: number;
      /** Format: date-time */
      createdAt: string;
      /** Format: date-time */
      updatedAt: string;
    };
    TaskResult: {
      task: components["schemas"]["Task"];
      /** Format: date-time */
      asOf: string;
    };
    TaskPage: {
      items: components["schemas"]["Task"][];
      page: number;
      pageSize: number;
      total: number;
      /** Format: date-time */
      asOf: string;
    };
    CreateTask: {
      /** Format: uuid */
      submissionId: string;
      /** Format: uuid */
      leadId: string;
      expectedLeadVersion: number;
      title: string;
      notes?: string | null;
      /** Format: date-time */
      dueAt: string;
    };
    UpdateTask: {
      expectedVersion: number;
      expectedLeadVersion: number;
      title: string;
      notes: string | null;
      /** Format: date-time */
      dueAt: string;
    };
    UpdateTaskStatus: {
      expectedVersion: number;
      /** @enum {string} */
      status: "completed" | "cancelled";
    };
    TaskError: {
      error: {
        code: string;
        message: string;
        requestId: string;
        /** Format: uuid */
        existingTaskId?: string;
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
  listTasks: {
    parameters: {
      query?: {
        leadId?: string;
        status?: "open" | "completed" | "cancelled" | "all";
        due?: "all" | "overdue" | "today" | "upcoming";
        page?: number;
        pageSize?: number;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Task response */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["TaskPage"];
        };
      };
      /** @description Task response */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["TaskError"];
        };
      };
      /** @description Task response */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["TaskError"];
        };
      };
      /** @description Task response */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["TaskError"];
        };
      };
    };
  };
  createTask: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["CreateTask"];
      };
    };
    responses: {
      /** @description Task response */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["TaskResult"];
        };
      };
      /** @description Task response */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["TaskResult"];
        };
      };
      /** @description Task response */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["TaskError"];
        };
      };
      /** @description Task response */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["TaskError"];
        };
      };
      /** @description Task response */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["TaskError"];
        };
      };
      /** @description Task response */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["TaskError"];
        };
      };
      /** @description Task response */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["TaskError"];
        };
      };
      /** @description Task response */
      413: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["TaskError"];
        };
      };
      /** @description Task response */
      415: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["TaskError"];
        };
      };
    };
  };
  getTask: {
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
      /** @description Task response */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["TaskResult"];
        };
      };
      /** @description Task response */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["TaskError"];
        };
      };
      /** @description Task response */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["TaskError"];
        };
      };
      /** @description Task response */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["TaskError"];
        };
      };
    };
  };
  updateTask: {
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
        "application/json": components["schemas"]["UpdateTask"];
      };
    };
    responses: {
      /** @description Task response */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["TaskResult"];
        };
      };
      /** @description Task response */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["TaskError"];
        };
      };
      /** @description Task response */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["TaskError"];
        };
      };
      /** @description Task response */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["TaskError"];
        };
      };
      /** @description Task response */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["TaskError"];
        };
      };
      /** @description Task response */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["TaskError"];
        };
      };
      /** @description Task response */
      413: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["TaskError"];
        };
      };
      /** @description Task response */
      415: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["TaskError"];
        };
      };
    };
  };
  updateTaskStatus: {
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
        "application/json": components["schemas"]["UpdateTaskStatus"];
      };
    };
    responses: {
      /** @description Task response */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["TaskResult"];
        };
      };
      /** @description Task response */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["TaskError"];
        };
      };
      /** @description Task response */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["TaskError"];
        };
      };
      /** @description Task response */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["TaskError"];
        };
      };
      /** @description Task response */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["TaskError"];
        };
      };
      /** @description Task response */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["TaskError"];
        };
      };
      /** @description Task response */
      413: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["TaskError"];
        };
      };
      /** @description Task response */
      415: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": components["schemas"]["TaskError"];
        };
      };
    };
  };
}
