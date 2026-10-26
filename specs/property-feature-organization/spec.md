# Property feature organization

Status: Verified on 2026-10-23.

## Goal

Make the property feature easier to navigate by grouping existing data/actions, public UI, CRM UI and shared components without changing behavior.

## Scope

- Move the existing 25 files into four feature-local folders and update all consumers and test mocks.
- `data/`: action-boundary.ts, action-input.ts, actions.ts, mutations.ts, queries.ts, request.ts, types.ts, input.ts and filters.ts.
- `public/`: property-card.tsx, property-filters.tsx, property-gallery.tsx, property-pagination.tsx, property-results.tsx and property-retry.tsx.
- `crm/`: property-form.tsx, property-form-fields.tsx, property-lifecycle-controls.tsx, property-read-only.tsx, property-photos.tsx, property-inventory.tsx, property-inventory-filters.tsx and property-inventory-results.tsx.
- `shared/`: property-image.tsx and property-loading.tsx. `PropertyImage` is reused by public homepage, card and gallery views; `property-loading.tsx` exports public and CRM loading fallbacks.
- Update the affected frontend skills, architecture guidance and specifications to reference the new paths.
- Exclude logic changes, component splitting, barrel exports, compatibility forwarding files, dependencies, backend changes and API contract changes.

## User flow

Preserve public listings, filters, pagination and gallery; staff inventory, create/edit, lifecycle and photo operations; login and role restrictions; loading, errors, duplicate-submit protection and reconciliation.

## Contracts and access

Preserve client/server directives, server-only imports, live session checks, cookie/Origin forwarding and backend authorization. Keep generated types and the backend-owned [property contract](../../docs/contracts/properties.md) unchanged. The grouping does not change module exports or their runtime responsibilities.

## Design

Keep public cards/search separate from CRM tables/forms. Share only currently reused components. Keep data helpers UI-free and retain explicit imports to concrete modules so server-only transport does not enter client bundles. Preserve JSX, styling, hook order and readable blank-line grouping.

## Acceptance criteria

- [x] All 25 feature files live in their agreed folders with no stale flat source paths or duplicate forwarding modules.
- [x] All source imports and test mocks resolve to the same modules after applying the move map; the authored-source identity verifier found only normalized import-specifier and Prettier comma changes, with directives, JSX, literals and comments unchanged.
- [x] API generation check, lint, formatting, typecheck, unit tests and production build pass.
- [x] Desktop/mobile public, authentication and property browser coverage passes; live Next.js inspection confirms the actual affected form has no runtime errors.
- [x] Skills and relevant documentation use the delivered paths and describe the grouping without requiring unnecessary folders for future features.

## Validation

Capture original authored frontend sources before moving. Verify the 25-file move map, import/mocking target identity and syntax with only expected module-path changes. Run `bun run check`, the full disposable-backend Playwright suite and live Next.js runtime inspection. Exercise updated skill references through an independent read-only scenario; validate metadata, links and formatting. Reconcile documentation after code and checks settle.

## Rollout and risks

Incorrect relative paths, stale mocks and mixed server/client exports can break builds or runtime actions. Use concrete imports, target-identity checks, production compilation and real browser requests. No migration or runtime configuration changes. Rollback restores files/imports using the captured mapping; no database rollback is needed.

## Implementation evidence

The 25 files were moved to `data/` (9), `public/` (6), `crm/` (8) and `shared/` (2), with all callers and test mocks updated to concrete module paths. The AST module-identity verifier passed across 90 authored-original snapshots. `bun run check` passed, including the generated API type check, lint, formatting, typecheck, 75 unit tests in 11 files and the production build. The disposable-fixture Playwright suite passed 44/44 desktop/mobile tests across authentication, public and CRM flows. Runtime inspection identified this checkout and reported empty `configErrors` and `sessionErrors` while `/crm/properties/new` was open.

An independent source review found no code issues; its stale-spec-path finding was corrected. An independent skill scenario found the moved references and retained the action, server-read and streaming boundaries; the browser-only role of `data/queries.ts` was clarified. Both updated skill metadata blocks, Markdown links and 37 concrete source references passed local validation.
