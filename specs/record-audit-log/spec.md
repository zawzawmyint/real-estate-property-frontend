# Record activity log — P3-04

Status: Locally verified — 2026-11-26. The delivered screen, local contract snapshot and declared acceptance evidence are complete; no production deployment is claimed.

## Goal

Give Admins and Managers an agency-wide investigation screen showing who changed business records, what changed and when, including actions performed by Admins. Agents retain their existing authorized lead timelines but cannot access this new log.

## Scope

- New `/crm/activity-log` destination, role-aware navigation, bounded URL-owned filters, paginated event list, expandable change details and links to available business records.
- Sources are properties, leads, viewings, tasks and committed CSV imports. Source labels distinguish staff, Website and System. Actual captured event coverage is defined by the backend companion specification.
- Exclude staff account administration, login monitoring, failed requests, reads/exports, email delivery logs, historical backfill, CSV export of the log, real-time updates, mutations to history and record-specific embedded audit panels. Existing lead timeline APIs/UI stay intact.
- Admin/Manager-only investigation includes all agency actions, including Admin actions. Deployment and production retention/backup decisions remain separate from local verification.

## User flow

1. Admin/Manager opens Activity log from desktop or mobile CRM navigation. Agent navigation omits it; a direct URL request is denied without fetching or serializing audit data. Backend authorization remains authoritative after demotion/session invalidation.
2. Default date range is the latest seven Dubai calendar dates, including today: from 00:00 six dates ago to 00:00 tomorrow in Asia/Dubai. UI accepts inclusive start/end dates, converts to offset-aware `[from,to)` instants and labels the timezone. Maximum 93 calendar dates. Valid direct links retain exact supplied instants.
3. Filter by date, historical staff actor or source (All/Staff/Website/System), record type, record UUID, action and optional import UUID. Selecting an actor clears source and selecting a source clears actor. Entity ID requires a type; changing type clears incompatible action/ID. Apply is explicit; changed filters reset page to 1. Refresh retains the applied filters. No free-text search of event content.
4. Historical actor picker uses the audit actor endpoint, searchable/paginated and retaining disabled/deleted staff. Do not use the active-assignee directory. Actor labels describe latest recorded identity; event rows retain their event-time identity/role. A linked actorId absent from the current choices stays selected/displayed as its ID rather than silently removing the filter.
5. Rows show Dubai date/time, actor/source, action, safe record label and an accessible Show changes control. Expand readable before/after values, format AED from integer fils without precision loss, distinguish no value/false/zero and show `Value hidden` for redacted field changes. No raw JSON or edit/delete controls.
6. Existing targets link to current property/lead/viewing/task detail routes. Deleted/unavailable targets remain plain text with `Record unavailable`; import summaries offer a filter-by-import link instead of an invented receipt detail page. Current record values are separate from historical event snapshots.
7. Always show `Changes recorded from <Dubai date/time>` and a concise coverage explanation: supported application writes only; no earlier backfill, login history or direct database/script edits. Empty results say no recorded changes match the filters, not that no changes ever occurred.

## Contracts and access

Backend-owned contract: companion repository `backend/specs/record-audit-log/contract.md`, mirrored verbatim in `docs/contracts/record-audit-log.md` with its OpenAPI snapshot. API generation and parity checks verify the local snapshot.

- Read `GET /api/v1/staff/audit-log` and `GET /api/v1/staff/audit-log/actors` using feature-owned server-only transport with the existing server origin/cookie allowlist. Use a narrow authenticated same-origin GET handler for actor searches if the interactive picker needs client reads. Never expose the backend origin or credentials.
- Query keys: from, to, actorId OR actorKind, entityType, entityId, action, importId, page, pageSize. Default pageSize 20; max 100. Results contain items/page/pageSize/total and coverage. Event DTO has id/schemaVersion/occurredAt/actor/entity/action/changes/import; contract.md owns exact shapes and validation.
- Initial records render server-side. Query-keyed Suspense loads result regions independently of headers/filter controls; controls remain inert before hydration. Never cache private results across sessions or roles.
- Unauthenticated users follow existing login recovery; authenticated Agents receive an access-denied state. When the session provider reports lost session or a role outside Admin/Manager, or a protected request returns 401/403, clear protected results/options and use existing session/access recovery. Revalidate on window focus using the existing session client and refresh the protected result boundary; do not promise immediate detection on an idle unfocused page or add continuous polling. Invalid direct URL filters show an accessible explanation/reset action rather than issuing a malformed request. Server outage preserves applied filters and offers explicit retry.

## Design

- Reuse PageHeader, FilterPanel, DataTable, CollectionPagination, labelled fields, Button, Alert and FieldError. Match existing compact CRM workspace presentation; add feature components under `src/features/activity-log/`. Do not build new generic infrastructure or add dependencies.
- Thread authorized role/capability through WorkspaceNavigation and its desktop/mobile callers; do not hide links solely with CSS or trust cookie presence as authorization.
- Use native record links and a keyboard-operable button with aria-expanded/aria-controls for details. Do not rely on color alone. Escape every label/value and keep identifiers readable with wrapping/copy selection.
- Verify 320/390/768/1440px layouts, native 200% browser zoom, keyboard operation, focus retention on filter/pagination changes and screen-reader labels. Wider details may stack; the page must not overflow horizontally.

## Acceptance criteria

- [x] F01: Admin and Manager can read full agency events, including Admin actions; Agent/public/direct URL/client requests cannot obtain log data or actor options. Existing Agent lead timelines remain functional.
- [x] F02: Default Dubai range, explicit filters, historical actor selection, Apply/Refresh/reset, pagination and direct links match the backend contract and preserve query state.
- [x] F03: All event types render readable actor/source/time/target and before/after or redacted change details, including money, null/false/zero and HTML-like text.
- [x] F04: Deleted records, renamed/deleted staff and import correlations remain understandable without broken/invented links or sensitive copied contents.
- [x] F05: Loading/empty/invalid-filter/outage/401/403 states are accessible; protected results/options are cleared on observed session/role loss or protected 401/403, with focus revalidation; start-of-coverage/exclusions remain visible.
- [x] F06: Desktop/mobile navigation and the screen pass responsive, keyboard and native-zoom checks using existing CRM primitives.
- [x] F07: Local API snapshots/generated types match backend-owned contracts; frontend/backend and cross-repository checks pass with recorded evidence before P3-04 is marked complete.

## Validation

- Unit tests: date boundary conversion, query rules, incompatible filters, amount formatting, redaction/escaping, safe target links, role-aware navigation and response parsing.
- Disposable backend browser fixture: Admin/Manager see identical events including an Admin write; Agent is denied both navigation and direct fetch; roles are revoked during open-page use; records are deleted/renamed; imports link to per-record creations; filtering spans multiple pages and same-time events. Exercise existing lead timeline compatibility.
- Run `bun run check`, targeted `bun run test:e2e` with the disposable backend on 4311, impacted existing browser suites and normal-preview runtime inspection only after verifying checkout identity on port 3100. Record any full-matrix limitations separately. Do not migrate normal data to obtain evidence.

## Rollout and risks

Deploy only after backend schema/producers/API are ready and earlier release gates are satisfied. Preserve log data/producers when rolling back the presentation. Event values are historical snapshots, not assertions of current record state; this distinction must remain visible in change details.

No staff-administration logging, historical backfill or application purge is delivered. Production retention/backup policy and any future coverage extension need a separate decision.

## Implementation evidence

Frontend `bun run check` passed on 2026-11-26 (API parity, lint, format, Next type generation/TypeScript, 63 files/457 tests, and the production build). The dedicated browser suite registered 10 tests: 9 passed and one intentional duplicate mobile native-zoom check skipped. It exercised 320/390/768/1440px, native 200% zoom, keyboard/filter/pagination interactions, import/view links, log-read 503 retry, actor-response 403 clearing and focus-based sign-out recovery. Next DevTools identified this checkout on port 3100 with the activity-log page active and no errors at that inspection. Full browser-matrix and native Safari verification were not run; no production deployment occurred.

## Development skill conformance review — 2026-11-26

Status: Verified after the 2026-11-26 development-skill conformance review. The review changed no feature scope, permissions or HTTP contracts. The delivered feature uses the thin activity-log route, feature-owned page and controls, React Hook Form with the canonical filter schema, shared submit/error/alert controls, and explicit provider-error recovery.

- [x] Final frontend `bun run check` passed after the maintenance corrections (65 files, 473 tests; API parity, lint, format, Next type generation/TypeScript and production build included).
- [x] Focused validation, streamed-result/focus and provider-503 conceal/retry coverage passed; the clean dedicated browser matrix registered 14 cases, with 13 passing and one intentional duplicate native-zoom mobile skip.
- [x] Changed code has readable logical grouping; meaningful regression checks and required quality checks pass.

The original local delivery evidence remains historical; fresh maintenance verification is recorded above.
