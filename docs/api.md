# API boundary

Backend owns API contracts, validation, authorization, persistence and uploads. Browser `/api/v1/*` calls proxy through Next to Express. Server calls use `API_URL` through the server-only entry point.

## Current endpoints

`GET /api/v1/health`: HTTP 200, `{ "status": "ok", "service": "real-estate-api" }`. This indicates backend liveness, not database readiness. The server transport validates both fields, times out after 5 seconds and disables caching.

Staff authentication uses Better Auth's native client/server protocol through the same-origin proxy: POST `/api/v1/auth/sign-in/email`, GET `/api/v1/auth/get-session`, and POST `/api/v1/auth/sign-out`. Server session calls forward only the configured session cookie, use no-store and a five-second timeout, and distinguish native anonymous `200 null` from a service failure. The backend-owned [auth contract snapshot](contracts/staff-authentication.md) and backend OpenAPI document define exact native request/response behavior.

Error shape: `{ "error": { "code": "...", "message": "...", "requestId": "..." } }`. `ApiError` preserves status, code, message and requestId for server diagnostics. Errors propagate to the Next boundary; pages never substitute a successful fake response.

## Property contracts

Property list/detail reads are available at `GET /api/v1/properties` and `GET /api/v1/properties/:id`; only published, available records are public. Staff inventory and lifecycle/photo routes live under `/api/v1/staff/properties` and require the backend's current-session and role checks. The backend-owned [property contract snapshot](contracts/properties.md) defines fields, filters, error cases, privacy projections and upload bounds. The OpenAPI snapshots generate `src/lib/api/generated/properties.d.ts` and `src/lib/api/generated/leads.d.ts`; run `bun run api:check` after contract changes. See [lead contract](contracts/leads.md) for the delivered inquiry and staff-lead API. Do not treat the browser proxy or CRM navigation as authorization.

Property browser reconciliation reads use relative `/api/v1` paths. Business writes use imported Server Actions, then server-only mutation transport through private `API_URL`; they never expose the backend origin to the browser. Each action checks the current staff session and role, validates input and Origin, forwards only the configured session cookie plus the validated Origin, and returns `{ ok: true, data }` or `{ ok: false, error }` with safe serializable error fields. The Server Action boundary does not replace Express validation or authorization.

Property upload actions accept one file at a time. The 5 MiB contract limit is checked at the action boundary and again by Express; Next's 6mb Server Action body limit allows multipart overhead. Photo writes remain sequential and reconcile saved state after an interruption. All property reads use `no-store`.
