# Lead CSV import

Status: Verified delivery — 2026-11-13.

## Goal

Import new leads through the existing CSV review workflow without duplicating the property importer. The user selected **New and unassigned**, without agent assignment or property links. Retain whole-batch rejection: any invalid row prevents the entire import.

## Scope

Included: Admin/Manager-only entry on the Leads list, `/crm/leads/import`, template download, file selection, read-only preview, row diagnostics, explicit confirmation, completion and safe retry/reload recovery.

Six columns: `name,phone,email,purpose,budget_aed,source`; existing manual sources `call` and `walk_in`; no source inference. Name, purpose, source and at least one valid phone/email are required per row. The backend contract owns exact rules.

Excluded: Agent bulk imports, updates/upserts, duplicate matching, skipping invalid rows, agent/property columns, stage/history imports, website-source backfills, notes/messages, automatic replies/notifications, XLSX, column mapping, jobs and deployment. Existing Agent manual lead creation and all staff exports remain unchanged. Matching phone/email values, including identical CSV rows, do not imply an update or deduplication; P2-05 remains separate.

## User flow

1. Admin/Manager selects a compact **Import CSV** link beside existing Export CSV/New lead actions. Agents retain their current actions and cannot use the import page, template or actions. Keep import out of the pipeline toolbar.
2. Download the header-only template. Explain new unassigned leads only, contact requirements, plain decimal AED budgets and spreadsheet text columns for phones. Reports are not import templates.
3. Choose one UTF-8 CSV up to 1 MiB/500 data records. Reuse fatal byte decoding, retaining a BOM for the exact-content digest. Changing the file invalidates its preview. Invalid UTF-8, empty/oversized files and NUL characters produce an associated file error.
4. Preview validates all records and creates nothing. Show counts, at most 20 normalized rows and at most 100 row/column issues with the accurate total issue count. Any invalid row prevents confirmation; fix the file and preview again.
5. **Import N leads** explicitly confirms the exact CSV/version/digest using one stable submission UUID. A duplicate-click guard prevents concurrent local submissions. Backend revalidates and commits all leads, their creation-history entries and the batch receipt together.
6. Success clears file/preview state, announces the created count and links to `/crm/leads?view=unassigned&stage=new`. Imported leads can subsequently use the existing assignment and property-linking flows.
7. Uncertain responses retain the same identity and offer explicit **Retry confirmation**. Before commit persist only UUID/digest/version under the `leads` namespace and rendered staff ID. After reload reselect the same file and preview to recover. Different files, corrupt recovery metadata or unrecoverable identity require the existing duplicate-risk acknowledgement before a new identity. If storage is blocked, keep in-memory retries safe and state the reload limitation accurately.
8. Preview and commit compare the expected rendered staff ID with the current session before backend dispatch. A changed actor must reload; never save under one staff member while storing retry metadata under another. Keep property/lead recovery keys independent.

## Contracts and access

Backend authority: the backend-owned lead-import contract. Implemented endpoints are GET `/api/v1/staff/leads/imports/template`, POST `/imports/preview`, and POST `/imports/commit` under that lead base. The backend leads OpenAPI and frontend snapshot/generated declarations include them.

Business POSTs use feature-owned Server Actions, live Admin/Manager checks, expected-actor consistency checks and the existing allowlisted cookie/Origin transport. The backend independently authorizes template, preview, commit and replay. No browser API-origin setting or cross-repository source imports.

`runLeadMutation` retains its individual-lead result checks and synchronous validator. The extracted `runLeadOperation` provides the shared session/Origin/error boundary; import actions supply asynchronous file decoding, strict batch preview/receipt validators and bounded 422 diagnostics. Existing manual/public mutation semantics and single-lead response checks remain intact.

## Design

Reuse `src/components/crm/csv-import.tsx`, `csv-import-file-field.tsx`, `csv-import-state.ts`, DataTable, Alert, Button and dialog primitives. Add a lead adapter under `src/features/leads/crm/` supplying columns, actions, `lead`/`leads` labels, `pendingStorageKey("leads", staffId)` and completion destination. Remount on rendered staff changes. No second upload wizard or property business code inside shared UI.

Move the property importer's neutral file decoder/identity schema and common issue schema into a small shared `src/lib/csv/import.ts` module, and update the property importer to consume it directly. Keep feature response schemas, paths, errors and persistence feature-owned. No importer registry, global provider, generic CRUD engine or new dependency.

Preserve compact headers and the fixed export-navigation behavior. Verify visible keyboard focus, associated file errors, pending/summary announcements and 320px/390px/1532px layouts. Wide preview rows scroll inside their table rather than overflowing the document.

## Acceptance criteria

- [x] Admin/Manager entry/template/page/actions work; Agent, absent/stale sessions and changed-actor tabs are independently denied without a write.
- [x] Preview writes no leads, activities, notifications or receipts; file changes and malformed input invalidate confirmation with useful errors.
- [x] Any invalid row creates zero leads/activities/receipts; valid confirmation creates exactly N New/unassigned leads with no property links and correct contact/budget/search data.
- [x] Each imported lead has one actor-attributed creation entry; replay creates no extra leads or activities and does not reset later edits or assignments.
- [x] Same-ID retries, lost-response/reload recovery and concurrent commits create one batch. Lead/property pending metadata remain isolated and contain no contact or raw-file data.
- [x] Existing CSV UI/parser are actually reused; lead-import modules do not import property-import business code, and no new packages were added.
- [x] Full checks, contract parity, disposable migration/database checks, focused import/export/manual-lead/property-import browser regressions and source review pass.
- [x] P2-04 is verified with the existing export and property-import slices; P2-05 is not delivered.

## Validation

Unit tests cover exact file bytes, actor/namespace recovery, batch response validation and the lead action-boundary refactor's unchanged manual/public behavior. Disposable browser cases cover template, invalid final row, contact alternatives, previews, whole-batch confirmation, keyboard/double clicks, lost response after commit, reload/same-file replay, actor changes, Agent denial and actual list/detail/history visibility. Check responsive states and the three-action header. Run frontend API parity, lint, formatting, types, tests and an isolated build; preserve existing local servers and business data.

## Rollout and risks

The additive backend receipt migration must be applied before use or deployment. It was applied to the normal local database after a consistent backup, followed by a passing database check and unchanged existing record counts; no test leads were imported there. Production deployment remains unverified. Reuse installed packages and current body limits; no new environment settings. The 500-row cap completed in 294 ms for 500 leads, 500 activities and one receipt within the existing 15-second transaction budget. Disable import UI/routes for rollback while preserving created business data and receipts.

## Implementation evidence

Frontend full gate: 56 test files / 389 tests, API parity, lint, formatting, types and build passed. Backend full gate: 53 test files / 263 tests, lint, formatting, types and build passed. Fresh/populated migrations and disposable `db:check` passed. Focused browser evidence covers 10 lead-import cases, 8 property-import cases, 6 manual/public-lead cases and 8 export cases; runtime inspection reported no configuration or session errors. Source reviews found no actionable issue. The replay regression for a lone surrogate versus U+FFFD digest collision is covered in both importers.
