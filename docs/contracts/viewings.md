# Viewing API snapshot

The frontend-local [OpenAPI snapshot](viewings.openapi.yaml) mirrors the backend-owned `docs/api/viewings.openapi.yaml` contract. Refresh the snapshot from the deployed-compatible backend contract, then run `bun run api:generate` and `bun run api:check`. The generator owns `src/lib/api/generated/viewings.d.ts`.

Staff routes are `/api/v1/staff/viewings` (GET/POST), `/api/v1/staff/viewings/:id` (GET/PATCH) and `/api/v1/staff/viewings/:id/status` (PATCH). Express independently authenticates and authorizes every operation using current lead ownership. Creation has a stable submission receipt; rescheduling and lifecycle changes use expected versions. The browser never chooses an independent viewing assignee.

List reads require inclusive `from` and exclusive `to` offset-bearing instants, at most 42 days apart. Optional filters are `leadId` and `status`; pages return `{ items, page, pageSize, total }`. The CRM uses Dubai Monday-to-Sunday ranges and explicitly loads further pages.

Creation and rescheduling require a future start, a duration of 15–240 minutes, an eligible assigned lead and a published/available property. Cancellation and completion remain possible when property eligibility later changes. Completion requires a started appointment and 1–4000 trimmed feedback characters; terminal records are immutable in this delivery. Scheduling never changes lead stage.

Business writes pass through feature-owned Server Actions with live session verification, runtime validation, allowlisted session cookie and validated Origin forwarding. The development cookie is `agency.session`; production uses `__Host-agency.session`. An uncertain create preserves the same receipt for an explicit retry or deliberate correction. A changed same-actor receipt returns `VIEWING_RECEIPT_CONFLICT` with the authorized `existingViewingId`, so the CRM can offer “Review saved viewing” without exposing another actor’s record. Uncertain or conflicting versioned updates fetch the current appointment and require user review before another write. The OpenAPI file is authoritative for exact request and DTO fields.
