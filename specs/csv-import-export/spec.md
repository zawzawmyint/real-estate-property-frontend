# CSV import/export — export delivery slice

Status: Verified locally on 2026-11-11 as the export-only slice. This historical scope excludes import; property and lead imports are separate verified specifications. P2-04 was completed on 2026-11-13.

## Goal

Let all CRM staff export filtered leads and properties within their existing access. This remains the historical export-only slice; property and lead imports completed the broader P2-04 item separately.

## Scope

Included: Export CSV actions on `/crm/leads` and `/crm/properties`, all matching rows across pages, fixed backend-owned columns, authenticated downloads, pending/error/retry feedback and desktop/mobile acceptance.

Excluded: import, CSV updates, duplicate detection, XLSX/PDF, column pickers, selected-row export, pipeline export, photo files/URLs, property descriptions, messages/notes/activity, background jobs, server file storage and deployment. No frontend dependency, migration, configuration or public API-origin setting was added; the existing same-origin rewrite is used.

## User flow

1. A staff member opens the existing list and applies filters/sort. Role-aware validated list state determines the export query; unresolved permissions, invalid filters and pre-hydration controls cannot start a download.
2. An outlined `Export CSV` button alongside list actions downloads all matching records, not just the visible page. The button title and screen-reader description state `Exports all matching results, up to 5,000 rows.` Do not infer authority from whether the button is visible.
3. On activation, issue one authenticated same-origin GET to the entity's export endpoint with allowed filters/sort and without pagination. Keep the list URL and selected filters unchanged. Export remains usable when a valid filter returns zero rows.
4. Show `Exporting…`, accessible pending status and a synchronous duplicate-click guard. Scope each request to the filters captured at activation; cancel/discard an in-flight download if the applied filters change or the control unmounts, so old data is not presented as the new result.
   Compare URL query encodings using the same `URLSearchParams` serialization as the applied scope. Equivalent `%20`/`+` spaces and percent-escape spellings must not invalidate a retained export control; different values, routes and applied scopes still cancel stale downloads.
5. Verify a successful CSV response before creating a Blob download. Use the safe entity filename supplied by the contract, trigger the download, remove the temporary anchor and revoke the object URL after dispatch. Announce `Download started.` through the screen-reader live region without adding a visible header row; do not claim the file was saved to disk.
6. A failed/invalid response never becomes a `.csv` file. Show an anchored, accessible Alert/AlertDescription with a labelled dismiss control, retain filters, and allow explicit retry. Handle 401 with sign-in guidance, 403 with access-denied feedback, 422 with the exact narrow-filters message, and network/5xx/unexpected content with safe generic feedback. Never automatically retry.

## Contracts and access

Authoritative implemented contract: companion repository `backend/specs/csv-import-export/contract.md`. This frontend spec does not own or broaden field permissions.

- `GET /api/v1/staff/leads/export`: reuse existing role-aware lead filter serialization, omit `page`, preserve current `view` defaults. Agents export only their assigned leads. Admin/Manager export their allowed selected view; do not silently change the default unassigned inbox to all leads.
- `GET /api/v1/staff/properties/export`: reuse existing staff property filters/sort, omit `page`/`pageSize`. Agent property files omit owner contacts; Admin/Manager include owner columns.
- Existing `/api/v1/:path*` rewrite forwards downloads to Express. No browser backend origin, auth tokens, new Server Action, persistence access or cross-repository source imports.
- Response: UTF-8 BOM CSV, CRLF, fixed headers, no-store and attachment filename dated in Dubai. Limits are 5,000 records and 10 MiB, with 422 JSON instead of truncated files. No matches downloads a header-only CSV.
- Backend documentation defines exact columns and mappings: AED decimal prices/budgets, square-foot area, UTC-labelled ISO timestamps, empty nulls, enum tokens and formula-safe text. Text-import guidance must explain that CSV cannot guarantee spreadsheet phone formatting. Exports are reports, not approved future import templates or backups of all CRM data.
- The backend lead OpenAPI file and the property operation from the backend root OpenAPI are represented in the existing frontend standalone snapshots; their generated domain types were regenerated. The frontend properties snapshot retains its repository-local reference adaptation.

## Design

Reuse existing PageHeader action areas, Button, Alert/AlertDescription and status primitives. Keep New lead/Add property primary; Export CSV is outlined and available to Agents even though Add property is restricted. Put the lead control in a session-resolved region using validated role-aware filters; preserve the existing Suspense behavior. Property controls also require resolved current session context.

Header correction (2026-11-11): keep export and create buttons in one compact, vertically aligned action row. Use a shrink-resistant export wrapper and download icon; put the limit in the button title and accessible description, keep pending/success announcements screen-reader-only, and anchor a dismissible error Alert below the export control without shifting header layout. Verify desktop 1532px and mobile 320px/390px normal, pending and feedback states.

Share only the actually repeated download control/transport behavior across these two screens; keep filter serialization in each feature. Support keyboard focus, announced pending/errors, disabled pending state and wrapped actions without horizontal overflow at 320px and 390px. No new modal or visual redesign is needed.

## Acceptance criteria

- [x] Every staff role can activate both exports within existing access; Agent UI cannot accidentally use provisional Manager lead defaults.
- [x] Requests preserve all applied allowed filters/sort, omit pagination and download records beyond the current page without changing navigation.
- [x] Invalid filters, unresolved session and pre-hydration state cannot initiate export; duplicate clicks initiate at most one active request.
- [x] Successful files have expected filenames, CSV bytes/headers and authorized rows; empty exports download headers only.
- [x] Agent property files contain no owner columns/values and Agent lead files contain no other agent/unassigned leads.
- [x] Filter changes/unmount cancel or discard stale requests; object URLs are cleaned up; errors never download HTML/JSON as CSV.
- [x] 401/403/422/network/5xx/unexpected-content feedback is accessible, safe and retryable without losing list state.
- [x] The compact header correction, including the labelled `Dismiss CSV export error` control, has targeted post-change browser and visual evidence.
- [x] Isolated frontend and backend whole-repository quality checks pass. Focused/full unit, browser, keyboard, affected regression and normal-port runtime evidence is recorded below.
- [x] Specs, contracts, tool inventory and both roadmaps reflect the delivered export-only slice. Property and lead imports are documented separately; P2-04 is complete without broadening this export scope.

## Validation

Use unit tests for feature query mapping and shared download response/error/lifecycle handling. Use existing Playwright disposable fixtures to inspect downloaded bytes/rows for all roles, including more than one list page, filtered sorting, owner exclusion, no matches, session/access failures and guarded repeat clicks. Do not use real CRM data. Review desktop/mobile screenshots of normal/pending/error action areas. Run `bun run check` in both repositories, backend disposable `bun run db:check`, focused browser tests and affected existing lead/property regression suites. Use Next DevTools to confirm this checkout on port 3100 with affected pages open and backend on 4311. Record evidence only after execution.

## Rollout and risks

Backend-only `csv-stringify` 6.9.0 is installed and locked. A 5,000-row/10-MiB synchronous bounded export avoids background-job infrastructure; reassess using measured performance if the cap is insufficient. Spreadsheet text coercion can remove leading zeroes; import phone fields as text rather than expecting CSV to preserve a spreadsheet cell type. Backend authorization is enforced at export time. Rollback removes the additive endpoints/UI/dependency together; existing list APIs/data remain compatible.

Implementation plan: [CSV export plan](../../docs/superpowers/plans/2026-11-11-csv-export.md).

## Implementation evidence

The implemented frontend control is `src/components/crm/csv-export-button.tsx`, with shared transport/lifecycle helpers in `src/components/crm/csv-export.ts`. Its explicit `entity`, pagination-free `query`, and applied-URL `scope` props ensure cancellation and remounting use the same identity. Feature-local serializers remain in the leads/properties data modules.

Source reviews approve the frontend and backend scope. Evidence recorded in `.delivery-work/csv-export/` includes: a passing isolated frontend `bun run check` (API/lint/format/type, 51 files / 332 tests and webpack production build), a passing backend `bun run check` (lint/format/Prisma type/build and 46 files / 189 tests in 44.57 seconds), 8/8 disposable desktop/mobile CSV acceptance cases, 14/14 affected browser regressions, two keyboard download cases and four visual cases. The normal-port runtime inspection found the controls enabled after hydration and no Next DevTools config/session errors. The earlier 46-worker backend run exposed an existing public-chat fixture timeout; the final bounded four-worker configuration passes and preserves test timeouts and CLI overrides.

The compact header correction retains the existing export transport and backend contract. Its targeted browser QA passes one ad hoc test across six route/width combinations in 32.2 seconds: `/crm/leads` and `/crm/properties` at 1532px, 390px and 320px retain one action row, an 8–16px gap, no overflow and stable header height during 503 feedback; the labelled dismiss control clears the error and leaves the export button ready. Visual review approved the desktop and 320px header captures in `.delivery-work/csv-export/screenshots/csv-header-qa-CSV-header-layout-and-dismissible-feedback-desktop`. The existing eight CSV cases also pass after the initial layout correction. The latest isolated frontend `bun run check` after final padding/dismiss changes passed API checks, lint, formatting, type checking, all 332 unit tests and the production Webpack build.

Regression evidence (2026-11-12): the export-scope navigation comparison now serializes both applied query states with `URLSearchParams`, so equivalent `%20` and `+` space encodings (and equivalent percent-escape spellings) retain the export control while different values, routes and scopes still invalidate it. Two new focused lead/property unit cases were red before this change and green after it; the focused suite passed 28 tests. The final frontend gate passed API checks, lint, formatting, types, production build and 348 tests across 54 files. The eight desktop/mobile CSV browser cases passed, including the canonical encoded-query case: property page-1 navigation and the lead List navigation kept export enabled and downloaded the expected CSV. Existing stale-download coverage remained passing; this regression evidence does not extend its navigation-race claims.
