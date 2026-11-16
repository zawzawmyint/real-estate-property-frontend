# Property CSV import

Status: Verified delivery — 2026-11-12. Shared CSV mechanics now also serve the verified lead importer.

## Goal

Allow Admin/Manager staff to review a CSV and create all valid property drafts together, or create nothing if any row fails. Reuse the shared parser/preview interaction with the delivered lead importer.

## Scope

Included: a compact `Import CSV` link on property inventory for Admin/Manager, `/crm/properties/import`, template download, upload/preview, row diagnostics, explicit batch confirmation, completion, safe retry/reload metadata and reusable UI primitives.

Excluded: Agent import, updates/upserts, publishing, photos, arbitrary column mapping, XLSX, duplicate matching, background jobs and deployment. No frontend parser/package. Do not crowd the header with permanent helper/status paragraphs; preserve the corrected compact action row and wrap secondary actions cleanly when three actions cannot fit.

## User flow

1. Admin/Manager selects Import CSV; Agents have no import action and cannot access its page/actions. The page explains new drafts only, no existing-record matching and no photos. Download a header-only template.
2. Choose one UTF-8 `.csv` file, maximum 1 MiB/500 data rows. File extension/type is a hint, not security validation. Server Action validates size, decodes bytes with fatal UTF-8 validation while preserving any BOM for the exact-content digest and forwards CSV to Express with safe staff cookie/Origin headers. Changing files invalidates preview and confirmation.
3. Preview before saving. Show counts, at most 20 normalized rows in a horizontally scrollable DataTable, and clear row/column diagnostics (at most 100 displayed; total issue count visible). State that the preview is limited when necessary. Shared parsing still validates every record.
4. Any error blocks confirmation for the entire batch. Staff correct the source file and preview again. No partial-import option. If every row is valid, an explicit `Import N drafts` button submits the same CSV/version/digest with a stable submission UUID. Keep selection/confirmation inert before hydration and during requests; use a synchronous duplicate guard.
5. Pending confirmation is announced accessibly. Success shows the created count and a native link to draft inventory. Clear the sensitive file/CSV state after success. Failed validation creates nothing and shows diagnostics. Preview transport/5xx failures instruct staff to retry the preview; confirmation transport/5xx uncertainty offers explicit same-ID retry and does not automatically submit again.
6. Before confirming, save only pending identity/digest metadata in staff-scoped session storage. Reload recovery requires selecting the same file and re-previewing, then reuses the stored ID. Do not silently use a new ID after uncertainty. Starting a different batch requires an explicit duplicate-risk acknowledgement. Corrupt/unavailable storage has safe in-memory fallback with an accurate reload-recovery limitation; require duplicate-risk acknowledgement before replacing an unrecoverable prior identity.

## Contracts and access

Backend authority: companion `backend/specs/property-import/contract.md`; root property OpenAPI operations and the frontend property snapshot/types are implemented. Endpoints: GET `/api/v1/staff/properties/imports/template`; POST `/imports/preview` and `/imports/commit` beneath that property base. POSTs use property-owned Server Actions with existing safe live-session/cookie/Origin transport. No browser API origin, direct database access or new upload proxy.

Exact CSV columns, scalar conversion, limits, 20-row preview/100-issue bound, digest, atomic transaction and durable receipt semantics are backend-owned. Preserve phone strings/zeroes and explain spreadsheet text-column import. Never render imported content as HTML; backend validation remains authoritative. Agents cannot import or preview private owner fields through this feature. Recheck staff identity before mutations and scope pending metadata to the current staff ID.

## Design

Reuse existing PageHeader, Button/buttonVariants, labelled file field, Alert/AlertDescription, DataTable and dialog primitives for explicit abandon acknowledgement if needed. Keep this workflow on its own page rather than a crowded header dialog. Shared `src/components/crm/csv-import.tsx` owns upload/preview/confirm states and presentation only; property feature supplies its actions, columns/labels, limits, staff-scoped storage key and completion link. Generic mechanics must be used by this property workflow now; do not add unused lead configuration or a global import provider.

Support visible focus, associated file errors, keyboard activation, announced pending/summary states and 320px/390px/1532px layouts without document overflow. Table overflow stays inside its container. Keep status feedback local to the import workflow; inventory header stays compact.

## Acceptance criteria

- [x] Admin/Manager entry, page, template and actions work; Agent page/action access is independently denied by Express and frontend guards.
- [x] File changes invalidate previews; bounded parser/validation responses show useful logical CSV row/column messages and no raw server errors.
- [x] An invalid final row disables the whole batch; valid confirmation creates exactly N drafts and no existing records change.
- [x] Duplicate clicks, same-ID retries and lost-response/reload recovery do not create duplicate batches; storage failure/corruption does not crash or silently reset an uncertain import.
- [x] Preview success is never trusted as permission or write authority; commit receives only CSV/digest/version/submission ID and backend revalidates.
- [x] Shared CSV UI contains no property business validation, and property-specific mapping/persistence stays in its feature.
- [x] Desktop/mobile normal, invalid, pending, uncertain, replay and success states pass visual/keyboard checks; header action grouping remains tidy.
- [x] API parity, frontend/backend checks/builds, disposable migrations/database checks and focused plus affected browser regressions pass; specs and roadmaps reflect actual evidence.

## Validation

Use unit tests for action input/response handling, exact file-byte decoding, generic workflow state/retry identity and staff-scoped pending metadata. Use disposable Playwright fixtures to template/upload/preview invalid and valid batches, assert zero/whole database outcomes, simulate a lost response after commit, reload/reselect safely, test denied roles and visually inspect narrow/desktop states. Run `bun run check` in both repositories, backend fresh/populated migration/database checks, focused import and affected property/CSV export regressions. Preserve the user's existing servers/database; use an isolated build/preview when needed. Inspect current checkout identity and active-page errors with Next DevTools.

## Rollout and risks

The receipt migrations are additive and must be applied before import use or deployment. Existing CSV export is a reporting contract, not the import template. Rollback removes/disables import UI/routes without deleting created properties or receipts. The shared frontend decoder is `src/lib/csv/import.ts`; backend transport guards are `src/shared/csv/import-middleware.ts`.

## Implementation evidence

The full frontend gate passed (54 test files / 346 tests, lint, format, typecheck and production build); the backend full gate passed (49 files / 222 tests, including build). Fresh and populated migration checks plus disposable `bun run db:migrate` and `bun run db:check` passed. The final browser suite passed eight import cases at desktop and mobile widths, covering template/download, BOM and multiline CSV, invalid-final-row zero writes, changed-file invalidation, keyboard confirmation, lost-response/reload same-file retry, role denial, invalid UTF-8 field feedback, stale-actor prevention and double-click idempotency. Runtime inspection found the normal checkout active at `/crm/properties/import` with no configuration or session errors. Plan: [property import](../../docs/superpowers/plans/2026-11-12-property-import.md).
