---
name: frontend-data-forms
description: Use when implementing or refactoring this project's business data reads, Server Action mutations, create/edit forms, or independently loading public and CRM result regions. Native Better Auth flows retain their existing client protocol.
---

# Frontend data and forms

Use this repository's verified property workflow as a reference, adapting fields and permissions to the affected feature's backend-owned contract. Read `AGENTS.md` and that feature's spec first. This skill does not authorize new endpoints, schema changes or unrelated refactors.

## Choose the boundaries

- Initial reads belong in Server Components through `src/lib/api/server.ts`. Put a separate async results component inside a query-keyed Suspense boundary when headings or filters can usefully render first; do not await that result above the boundary. Keep shareable filters and pagination in the URL.
- Business writes follow client form -> feature-owned Server Actions -> server-only mutation transport -> Express. Properties keeps these entrypoints in `src/features/properties/data/actions.ts`. Keep queries, mutations, transport/error handling and contract types separate when those responsibilities exist; do not add unused modules.
- Server Actions orchestrate requests. Express owns business rules, resource permissions, persistence and final validation. Generated TypeScript declarations do not validate untrusted runtime input.
- Keep Better Auth sign-in/out on its native client protocol. Browser reconciliation reads and auth use same-origin `/api/v1`; action transport uses private API_URL through the server API boundary.

## Navigate the property reference

- `src/features/properties/data/` owns actions, input validation, query/mutation transport, types and URL/filter helpers; `input.ts` contains the form schema/defaults and display-unit conversions.
- `data/queries.ts` provides browser reconciliation reads through same-origin `/api/v1`. Initial public/staff Server Component reads continue through `src/lib/api/server.ts`.
- `src/features/properties/public/` owns search controls, cards, gallery and public results. `crm/` owns inventory filters/table/results, the create/edit form, lifecycle controls and photo editor.
- `src/features/properties/shared/` owns the reused property image and loading components. Keep imports concrete so client components cannot pull in server-only transport through a barrel.
- Use this grouping where a feature has these real responsibilities; a smaller feature does not need all four folders. Keep screen-specific forms and filters separate instead of forcing public and CRM layouts into one configurable component.

## Implement the action boundary

- Export async entrypoints from a `"use server"` module. Keep non-action types/helpers elsewhere and protect mutation transport with `server-only`.
- Verify the live staff session in every action. Apply the feature's agreed role restrictions and let Express independently authorize the resource; do not copy property-role assumptions into another domain.
- Parse IDs, payloads and uploads on the server, allowing only contract fields. Validate API units, such as priceFils, separately from display-unit form values. Reject empty or undefined-only patches before dispatch.
- Forward only the configured staff-session cookie via `getStaffRequestHeaders` and the validated incoming Origin. Express checks its exact configured APP_ORIGIN. Never forward arbitrary request headers or accept a backend URL from action arguments.
- Return a serializable success/error union with safe code, message, optional field errors and request ID. Expected failures are data, not serialized Error objects or raw internal exceptions. See `src/features/properties/data/types.ts` and `src/features/properties/data/action-boundary.ts`.
- Treat a dropped response after create as uncertain. Preserve values, block unsafe resubmission and offer reconciliation; never automatically retry writes. Frontend guards prevent accidental overlap but do not guarantee backend idempotency across clients.

## Compose the form

- One coordinator owns React Hook Form, the feature-local Zod schema, defaults, guarded submission and confirmed-result handling. Share typed field components between create/edit; lifecycle controls receive state/callbacks and do not fetch.
- Use `src/components/ui/submit-button.tsx` for real submit actions, with explicit pending/idle labels and caller-disabled rules. Use ordinary Button variants for other actions.
- Acquire a synchronous guard before asynchronous validation, combine submission/transition pending state, and release the guard on retryable failures. Preserve native autofill values before validation. Hold the guard through successful navigation or uncertain creation until the form unmounts/reconciliation resolves it.
- Keep text input updates outside transitions. Await actions within the submission transition; after await, use a fresh transition for navigation/refresh that should be transitional. Apply confirmed saved records before reset; preserve entered values on failures.
- Associate FieldError IDs with aria-describedby/aria-invalid, including select and upload errors. Use persistent Alert feedback for action failures. Keep existing focus, responsive layout and, where applicable, photo locks and dirty-form protections.
- If controls render before hydration, use `src/lib/use-client-ready.ts` to keep them inert until handlers attach. Do not let a streamed filter form accidentally submit a native request containing unnormalized empty parameters.

## Refresh and uploads

- Current property reads are no-store. Update local state from the confirmed action response and refresh dependent server content deliberately. Do not add tags/cache invalidation without an actual cached-read policy; router.refresh does not invalidate server caches.
- Existing property uploads send one file per action, at most 5 MiB; the 6mb Server Action body limit leaves multipart overhead. Validate type/size in the action and Express. Verify deployment/proxy limits before adopting uploads elsewhere; do not increase global limits without the feature's need.
- For upload flows, preserve sequential progress, partial-failure reconciliation and saved-photo checks where applicable. Avoid optimistic success for an unconfirmed write.

## Verify the real flow

- Use focused action tests for invalid input, missing/expired session, roles, backend failures and serialization. Exercise the actual browser action request and resulting backend state, not only mocked form callbacks.
- To prove streaming, hold the actual Next-to-Express request using the Playwright-only proxy under `tests/fixtures`, then assert headings/filters/fallback before release and correct results afterward. Browser interception cannot hold a server fetch.
- Playwright manages proxy4312 -> disposable backend4311 and frontend3100; its warmup compiles routes before parallel browsers. Run the documented development fixture; a production frontend expects different secure-cookie configuration.
- Follow AGENTS.md quality/runtime checks. Preserve public/private projections and review desktop/mobile screenshots. Record evidence in the feature spec before claiming delivery.

Concrete references:

- Actions and validation: `src/features/properties/data/actions.ts`, `src/features/properties/data/action-input.ts`, `src/features/properties/data/mutations.ts`.
- Shared create/edit form: `src/features/properties/crm/property-form.tsx`, `src/features/properties/crm/property-form-fields.tsx`.
- Streamed inventory: `src/features/properties/crm/property-inventory-results.tsx`, `src/app/(staff)/crm/properties/page.tsx`.
- Public cards/results: `src/features/properties/public/property-card.tsx`, `src/features/properties/public/property-results.tsx`, `src/app/(public)/properties/page.tsx`.
- Reused media/loading: `src/features/properties/shared/property-image.tsx`, `src/features/properties/shared/property-loading.tsx`.
- Regression coverage: `tests/unit/property-actions.test.ts`, `tests/e2e/properties.spec.ts`.
