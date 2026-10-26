# Frontend data fetching and form submission refactor

Status: Verified on 2026-10-23.

## Goal

Make property mutations, form composition and inventory loading easier to understand and maintain while preserving the existing Express API, permissions and user workflows.

## Scope

Included:

- Separate property API types, request handling, reads and mutations into focused feature-owned modules.
- Route property writes through Next.js Server Actions that validate input and forward the current staff session to Express.
- Extract property field sections and lifecycle controls from the current large form; retain one shared create/edit form.
- Introduce a small shared submit button used by both staff login and the property save form.
- Separate CRM inventory filters from results and stream inventory results behind a query-keyed Suspense boundary.
- Preserve existing public listing Suspense and URL-based search/pagination.
- Capture the verified pattern in `.agents/skills/frontend-data-forms/SKILL.md` and link it from the existing frontend-development skill for future features.
- Keep streamed inventory controls inert until hydration attaches their handlers, reusing the shared client-readiness hook.

Excluded:

- Backend changes, backend API contract changes, new dependencies, authentication changes or new business features.
- Adopting a client query cache, adding optimistic writes or changing the current no-store policy.
- A generic form builder, global mutation framework, toast system or wholesale UI redesign.
- The previously discussed backend field-error contract and expanded runtime response validation; those require separate scoped work.

## User flow

### Create and edit properties

1. Server-rendered routes verify the staff session. The edit route loads the saved property; the create route starts with existing defaults.
2. Both routes render the same PropertyForm coordinator and the same extracted fields. React Hook Form and the existing Zod schema remain the field-state and validation owners.
3. On submission, acquire the synchronous duplicate guard before asynchronous validation. Preserve the existing native-input/autofill synchronization.
4. Validate in the client, call a feature Server Action, validate again at the action boundary and forward the authenticated request to Express. Express independently validates and authorizes it. Show pending feedback throughout; preserve current restrictions during photo operations and lifecycle changes.
5. On confirmed create, navigate to the saved property's edit route. On confirmed update, reset from the returned saved record, show persistent success feedback and refresh dependent server content.
6. On validation or request failure, retain entered values and accessible errors. Preserve uncertain-create blocking and inventory reconciliation guidance; do not automatically retry writes.
7. Publishing, availability, archive/restore and deletion retain their existing confirmation, dirty-form and role restrictions.

### Inventory loading

1. Verify the staff session and parse the URL filters before rendering inventory content.
2. Render the inventory heading, permitted Add property action and filter controls independently of the inventory data request.
3. An async server results component fetches inventory inside Suspense. Its query-derived key and table-shaped loading fallback cover filter and page changes.
4. Results retain the existing rows, counts, empty state and pagination links. Invalid filters retain their current recovery flow. Session expiry redirects to login; failures reach the existing error/retry boundary.
5. Never render private rows before authentication or put authorization behind the loading fallback. The backend still authorizes every request.

## Contracts and access

- Backend remains authoritative for persistence, business validation and authorization. Existing backend-owned property contract is mirrored in the frontend [contract snapshot](../../docs/contracts/properties.md) and [OpenAPI snapshot](../../docs/contracts/properties.openapi.yaml).
- Preserve `/api/v1/properties`, `/api/v1/staff/properties` and their current detail, lifecycle and photo operations, including HTTP methods, JSON/binary bodies, status handling and error messages.
- Continue using generated types from `src/lib/api/generated/properties.d.ts`. Preserve request timeouts, same-origin credentials, no-store requests, response checks, 204 handling and ApiError metadata.
- Browser reconciliation reads continue to use relative `/api/v1` paths. Property writes use imported Server Actions; server reads and action-to-Express requests use private `API_URL` and explicit forwarding of the allowlisted staff-session cookie plus a validated `Origin`. Do not fetch a relative browser URL from a Server Action or forward arbitrary browser headers.
- Each action verifies the current staff session, validates IDs and payloads, and forwards only permitted fields. UI visibility and TypeScript types are not authorization or runtime validation. Express remains the final permission authority.
- Expected failures return a serializable union: `{ ok: true, data: T }` or `{ ok: false, error: { code: string, message: string, status?: number, requestId?: string, fieldErrors?: Record<string, string[]>, uncertain?: boolean } }`. Never serialize Error instances, credentials or raw backend/internal exceptions. Mark ambiguous create outcomes as uncertain; client transport failures must also block unsafe create retries.
- Keep navigation/form reset in the client coordinator. After awaited actions, wrap navigation updates intended as transitions in a fresh startTransition. Retain no-store reads and router refresh; do not introduce cache tags merely to imitate the reference project.
- Photo upload actions accept one file per request and retain the backend's 5 MiB file limit and sequential upload/reconciliation behavior. Configure `experimental.serverActions.bodySizeLimit` to `6mb` in next.config.ts to allow multipart overhead; reject oversized/unsupported files at the action boundary and independently in Express. Verify the installed Next.js guide and deployment request limits before implementation.
- Better Auth login/logout retain the existing native client contract and cookie handling; the shared submit button does not migrate authentication into custom actions.
- Admin/Manager editing, Agent read-only access, archived-record restrictions and public/private field boundaries remain unchanged.
- No backend source imports, database access or public exposure of API_URL. New server-only components/modules must not enter client import graphs.

## Design

### Implemented file responsibilities

- `src/features/properties/data/types.ts`: existing generated property type aliases and list types.
- `src/features/properties/data/request.ts`: existing property request helper, PropertyApiError and saved-record response validation.
- `src/features/properties/data/queries.ts`: browser read function such as getProperty; no writes or UI effects.
- `src/features/properties/data/mutations.ts`: server-only create/update/delete and photo write transport functions accepting explicitly constructed staff headers; no client UI imports, navigation, form state or alerts.
- `src/features/properties/data/actions.ts`: `"use server"` entrypoints for property create/update/delete and photo writes. They parse untrusted inputs, invoke mutations and return the serializable action result; `data/action-boundary.ts` verifies the live session and role, validates the incoming Origin and forwards only the configured session cookie plus that Origin.
- `next.config.ts`: bounded 6mb Server Action body limit for the existing single-file upload contract; preserve other settings.
- `src/lib/api/server.ts`: retain the server-only read interface and session forwarding; update imports to use the separated types/request module.
- `src/features/properties/crm/property-form.tsx`: retain React Hook Form ownership, validation, guarded submission and confirmed-result coordination. Avoid a new generic mutation hook unless extraction exposes a concrete current need.
- `src/features/properties/crm/property-form-fields.tsx`: cohesive Basics, Facts, Location and Owner sections, shared by create/edit through the existing coordinator. Use typed form props, existing schema and defaults; do not duplicate them.
- `src/features/properties/crm/property-lifecycle-controls.tsx`: lifecycle/sidebar presentation and confirmation UI; receive explicit pending/permission state and callbacks from the coordinator.
- `src/features/properties/crm/property-read-only.tsx`: extract existing read-only property presentation.
- `src/features/properties/crm/property-photos.tsx`: invoke photo write actions, retain browser reconciliation reads, partial-upload recovery and existing photo state ownership.
- `src/components/ui/submit-button.tsx`: compose the existing Button with required pending state, idle/pending labels and ordinary Button props. Enforce type=submit, combine caller-disabled with pending, and keep pending text accessible. Own no request, form, toast or routing logic. Integrate in login and property save; lifecycle buttons keep their existing semantics.
- `src/features/properties/crm/property-inventory-filters.tsx`: existing CRM filter form, URL updates and filter-specific pending feedback, independent of fetched rows.
- `src/features/properties/crm/property-inventory-results.tsx`: async server fetch and existing 401 handling; pass result/filter props to PropertyInventory.
- `src/features/properties/crm/property-inventory.tsx`: retain result table, counts, empty state and pagination; move filters out.
- `src/features/properties/shared/property-loading.tsx`: add an accessible inventory skeleton alongside the existing public cards skeleton.
- `src/app/(staff)/crm/properties/page.tsx`: session/filter orchestration, heading, filters and keyed Suspense boundary; do not await the inventory request above the boundary.
- Existing public listings and create/edit routes retain their contracts; no new composer is introduced.

All callers and tests use concrete owning modules, and the obsolete `api.ts` has been removed. Keep modules acyclic: types are independent; queries/mutations depend on request/types; actions depend on server auth/mutations; client UI imports action references and browser queries, never server-only mutation transport.

Use existing Field, FieldError, Alert, Button, Card and semantic tokens. Preserve responsive layout, input IDs, label/error associations, focus behavior and keyboard interaction. Splitting files must not remount fields or reset unsaved values on ordinary renders.

### Approaches considered

- **Selected: forward property mutations through Server Actions.** Centralizes server-side orchestration while Express retains business authority. Adds an action validation/session boundary and bounded upload configuration.
- **Alternative: keep browser API writes.** Simpler transport, but does not match the user's selected mutation style.
- **Alternative: client query/mutation cache.** Useful for substantially more interactive CRM screens; adds an unnecessary second state/cache model for this scope.

The selected Server Action boundary is implemented. It preserves Express as the final validation and authorization authority.

## Acceptance criteria

- [x] Read functions and mutation functions have separate modules; request/error handling has one property-specific implementation and all callers resolve.
- [x] All property writes, including lifecycle/photo operations, use authenticated, input-validated Server Actions; direct action invocation cannot bypass permissions. Expected failures return the documented serializable result without leaking internal details.
- [x] Single-file photo uploads up to 5 MiB succeed through the action boundary; oversized/unsupported files fail safely, and interrupted sequential uploads reconcile saved photos before retry.
- [x] Create/edit render the same extracted property field components with unchanged schema/defaults and no duplicated field definitions.
- [x] PropertyForm coordinates submission; extracted presentation components do not issue API requests or own duplicate form state.
- [x] Shared SubmitButton is used by login and property save; it preserves labels, caller disable rules, accessible pending feedback and submit semantics.
- [x] Invalid submissions produce no mutation; same-tick repeated submissions issue at most one write. Guards release on validation/request failure according to the existing uncertain-create rules.
- [x] Successful create/update, publishing, availability, archive/restore, deletion and photo workflows preserve their existing outcomes, dirty checks and permissions.
- [x] Network/malformed-create failures preserve entered values and block unsafe repeated creation; no mutation automatically retries.
- [x] Login retains autofill, hydration readiness, rate-limit countdown, password clearing and navigation behavior.
- [x] With an intentionally delayed inventory response, authenticated users see heading/filters and a loading fallback before rows arrive; completion replaces the fallback with results or the existing empty state.
- [x] Filter/page navigation preserves URL semantics and refreshes the correct result region; malformed filters, expired sessions and service failures retain recovery behavior.
- [x] Agent/read-only and unauthenticated users gain no new capabilities or access to private rows.
- [x] Public listing Suspense, metadata, loading, error and empty states remain functional.
- [x] Frontend quality checks and cross-repository browser smoke tests pass; specs/docs describe verified outcomes only after evidence exists.

## Validation

- Adapt existing `tests/unit/property-api.test.ts` to separated read/write/request imports and retain transport/error/response assertions. Keep input/filter unit tests.
- Add focused action-boundary coverage for invalid IDs/payloads, missing/expired session, backend 403, serialized expected failures and uncertain create outcomes. Exercise real action requests in browser tests, including a near-limit 5 MiB valid upload and rejected oversized files.
- Extend `tests/e2e/properties.spec.ts` only where coverage is missing for duplicate submission, preserved values after failure, create/edit field parity and delayed CRM inventory streaming. Control the actual server-to-backend request delay in the test fixture; browser fetch interception alone cannot prove server streaming.
- Retain real-backend create/update/lifecycle/photo and role smoke coverage, and existing `tests/e2e/authentication.spec.ts` login regression coverage.
- Run `bun run api:check`, `bun run lint`, `bun run format:check`, `bun run typecheck`, `bun run test` and `bun run build` in frontend. Run `bun run test:e2e` with the disposable backend fixture on 4311, the Playwright-only proxy on 4312 and frontend on 3100; the Playwright global setup warms routes before its parallel browsers begin.
- Verify affected screens at desktop/mobile sizes with keyboard navigation. Use configured Next.js DevTools after confirming checkout identity; inspect runtime errors while the affected pages are open.

## Rollout and risks

- The delivery introduced no backend API, dependency or environment-variable changes. `next.config.ts` now sets a 6mb Server Action body limit for the existing one-file, 5 MiB photo contract.
- Primary risks: client/server import leaks, losing submission locks during extraction, stale local form state after refresh, and rendering results before a Suspense boundary can stream. Validate each at its owning slice.
- Preserve current no-store behavior; Suspense changes loading composition, not backend latency or caching.
- Roll back the affected frontend slice if regressions appear; there is no backend migration to reverse.
- Production HTTPS and secure-cookie deployment topology was not browser-tested. The E2E fixture is development-only and must not be shipped as application behavior.

## Implementation evidence

Frontend `bun run api:check`, `bun run lint`, `bun run format:check`, `bun run typecheck` and the production Webpack build passed. The unit suite passed 75 tests in 11 files. The final disposable-fixture browser run passed 44/44 desktop/mobile tests, including actual Server Action writes, role/lifecycle/photo workflows, a valid exact-5-MiB upload and oversized rejection, and held Next-to-Express requests proving initial and filtered inventory streaming. The fixture uses backend 4311, proxy 4312 and frontend 3100; global setup compiles routes before parallel browser work.

Runtime inspection identified this checkout and found empty `configErrors` and `sessionErrors` while `/crm/properties/new` was open. Desktop/mobile form and inventory screenshots were reviewed, including a 390px-width check with no overflow. Independent review found and the implementation corrected field-error associations and undefined-only patch handling with regression coverage. The native Better Auth flow remains unchanged except for use of the shared submit button.
