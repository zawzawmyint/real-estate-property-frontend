# Shared CRM workspace presentation

Status: Delivered with verification limitations — 2026-11-03. The four CRM collection/calendar presentations are implemented; native 200% browser zoom and the repository-wide formatter gate remain unverified.

Follow-up note — 2026-11-03: the [Sales pipeline workspace header and toolbar](../crm-pipeline-toolbar/spec.md) separately opts `/crm/leads/pipeline` into the shared `PageHeader`, `CollectionToolbar` and `FilterChip` presentation. This changes Pipeline chrome only; the board, cards, drag/drop and pagination remain outside this specification's delivered scope.

## Goal

Extend the agreed compact Properties visual language across the Properties, Leads and Tasks collections and the Viewings calendar through reusable presentation, while preserving each feature's workflow and authorization.

## Scope

Included:

- `/crm/properties`: refine the table, property cell sizing, badges, icon actions and collection footer. Preserve the delivered compact header/toolbar design while migrating its repeated presentation to shared components.
- `/crm/leads`: compact header, existing List/Pipeline and role-specific scope navigation, search/filter/sort layout, chips, table, result count, refresh, pagination and recovery states.
- `/crm/tasks`: compact header, status/due toolbar, task table, due/state presentation, result freshness, refresh, pagination and recovery states.
- `/crm/viewings`: compact header, existing week/date/status toolbar, day headings, appointment cards, result/load-more and recovery presentation.
- Shared CRM presentation components, responsive/mobile equivalents, accessible interaction and cross-feature regressions.

Excluded: dashboard, pipeline board redesign, detail/create/edit forms, sidebar/navigation/shell redesign, public pages, global token changes, API/schema/permissions changes, search or sorting where unsupported, bulk operations, export, AI, new dependencies, deployment. Shared lead components used by Pipeline or embedded lead task/viewing panels must keep their existing behavior and default appearance unless explicitly opted in.

## User flow

1. Staff open a collection/calendar and see its compact title, retained meaningful description and existing permission-filtered primary action.
2. Properties retains explicit Apply, persistent inline advanced fields, URL-derived chips, focus restoration and pagination from the [delivered toolbar spec](../crm-property-inventory-toolbar/spec.md).
3. Leads retains 300ms debounced search; desktop filters/sort still navigate immediately. Place desktop advanced fields in a compact disclosure; selecting them preserves immediate application. Keep the existing mobile Sheet with draft Apply/Cancel semantics. Preserve list/pipeline links, manager All/Unassigned scopes, Agent My leads, assigned-agent eligibility, refresh and query restoration. Do not add an extra desktop Apply button.
4. Tasks retains only status and due selectors with explicit Apply filters. Keep earliest-due ordering, Dubai display, refresh/dirty-navigation safeguards and record links; do not add a search field, arbitrary sort or inline completion.
5. Viewings retains previous/next week navigation, Week containing date, status and Apply. Scheduling still starts by choosing a lead. Keep Monday–Sunday grouping, Dubai date boundaries, existing narrow-screen selected-day view and load-more behavior; do not add month/time-grid/drag interactions.
6. Navigate through real detail links and pagination; empty, loading, invalid, forbidden, session-expired and read-failure states retain current safe recovery. No presentation component fetches, authorizes or performs mutations.

## Contracts and access

- Frontend-only presentation. Express continues to own authorization, privacy, validation, persistence and resource transitions; no new backend request or migration.
- Preserve existing staff property list contract in [properties](../../docs/contracts/properties.md): `GET /api/v1/staff/properties`, current filter query and `{items,total,page,pageSize}` staff projection.
- Preserve [leads](../../docs/contracts/leads.md): `GET /api/v1/staff/leads`, existing `view/q/stage/source/agentId/sort/page` behavior and list envelope. Do not move client scoping into presentation components or widen Agent visibility.
- Preserve [tasks](../../docs/contracts/tasks.md): `/api/v1/staff/tasks`, `leadId/status/due/page/pageSize`, existing freshness metadata, deterministic due ordering and lifecycle controls.
- Preserve [viewings](../../docs/contracts/viewings.md): `/api/v1/staff/viewings`, existing from/to/status/leadId/page/pageSize and day grouping. Use existing feature date/query helpers, not new shared date logic.
- Backend-owned OpenAPI and feature contracts remain authoritative. Do not replace feature DTOs with a generic CRM record type.
- Properties action visibility remains exact: View details for permitted records; Edit only for existing authorized roles; Public listing only when published and available. Actions remain visible icon-only links with accessible names, titles, focus and at least 44px targets. No row click wrapper, ellipsis replacement or hover-only actions.
- Retain lead assignment/resource checks, task visibility and viewings access. Shared headers accept already-authorized actions; they do not infer permissions.

## Design

### Visual authority and safe adaptation

- References: [Properties](properties-reference.png), [Leads](leads-reference.png), [Tasks](tasks-reference.png), [Viewings](viewings-reference.png).
- Retain current warm ivory background, maroon accents, typography and the exact implemented sidebar. Generated sidebar icon substitutions are not approved source assets.
- Reuse the actual compact Properties header/toolbar from the [toolbar spec](../crm-property-inventory-toolbar/spec.md), including its visual correction. No regression of the search icon, funnel icon, white field surfaces, balanced desktop widths or soft chips.
- Generated names, counts, contacts, dates and page sizes are examples only. Render API data, accurate filtered rows, actual totals/page sizes and current Dubai dates. Do not reproduce inconsistent mockup counts or mixed stages under a single-stage filter.
- Prefer alignment, typography, quiet separators and light header tint. No nested card structure, decorative dashboard metrics or new toolbar functions.

### Reusable presentation boundaries

- Extend existing `PageHeader` with opt-in `variant="workspace"`, preserving default rendering. Replace local Properties compact classes and opt in only the four collection/calendar entries.
- Create `src/components/crm/collection-toolbar.tsx`: layout slots `children`, optional `navigation`, `filters`, `chips`, and `className`; render a presentation container only. Feature-owned form, disclosure/Sheet state, labels, submission and busy behavior stay with each feature. Do not impose search/sort/Apply controls through a schema/configuration engine.
- Create `src/components/crm/filter-chip.tsx`: `children`, `onRemove`, `removeLabel`, optional `disabled`. Own the pill/button appearance and accessible remove action; feature handlers own query transformation and focus restoration. Use it in Properties and Leads.
- Extend `DataTable` with opt-in `variant="workspace"`. Retain `DataColumn<T>` and `renderMobile` boundaries; shared table owns the white surface, tinted header, separators and consistent base padding, while columns own appropriate alignment/width and cells. Default variant remains unchanged for unconverted consumers. Do not pass server-owned cell functions through a Client Component boundary.
- Create `src/components/crm/status-badge.tsx`: `children` and a small fixed `tone` set (`neutral`, `success`, `info`, `warning`). Require visible text. Domain mappings stay in property/lead/task/viewing feature modules; color alone never conveys state. Reuse existing Badge foundation rather than a parallel primitive.
- Extend `CollectionPagination` with opt-in `variant="workspace"`: accurate visible range/total, bounded numbered page links (first/last/current and immediate neighbors, at most seven page/ellipsis items), previous/next and visible current page. Preserve each caller's `href(page)` and safe zero/single/out-of-range handling. Default remains compatible. Calendar retains load-more, not numbered pagination.
- Empty/loading/retry text and transitions stay feature-owned; align only confirmed repeated presentation. No generic result-state state machine.

### Page details

- Properties: make the property column readable, with thumbnail, two-line title and wrapping location. Preserve the Demo property label, real price semantics and missing-photo fallback. Align prices numerically; give badges and Updated/actions enough room. Icon actions stay in a stable horizontal group when space permits. Use actual pageSize, not the seven mock rows as a new default.
- Leads: retain contact/preference/source/stage/assignee/received content and assignment controls. Treat compact List/Pipeline navigation separately from All/Unassigned/My leads scope. Never show manager scope/assignment controls to Agents. Search/filters retain existing pending-typing behavior; extracting presentation must not remount a live debounced input.
- Tasks: task/lead/due/state cells use the same table shell; overdue information remains accurately derived from existing data, rather than inferred from mockup color. Keep existing action/navigation placement and refresh behavior.
- Viewings: shared header/toolbar and status treatment, feature-owned calendar grid and appointments. Preserve end-day annotation for appointments crossing midnight, empty days and current result-loading limits.

### Accessibility and responsiveness

- At 1440px, headers remain compact and ordinary toolbar controls fit one row when feasible. Secondary navigation may use one slim row; no oversized permanent filter cards.
- At 320px, 390px and 768px, preserve reading/tab order, field labels, visible focus, reachable actions and no page-level horizontal overflow. Preserve mobile record renderers and Viewings' day navigation.
- Preserve table semantics, accessible icon names, `aria-current`, pending/hydration disabling, announcements, disclosure/Sheet focus and existing loading boundaries.
- Verify real native 200% browser zoom separately; do not substitute CSS zoom or viewport tests. Record tool limitations explicitly.

## Acceptance criteria

- [x] Shared header, toolbar/chip, table/badge and pagination presentation has real consumers; no unused abstractions or duplicate table implementations.
- [x] Properties matches its table reference, retains the corrected toolbar and keeps icon-only View/Edit/Public actions with existing permission rules.
- [x] Leads matches its reference and preserves debounce, scope, desktop immediate filtering, mobile draft filters, assignment and pipeline navigation.
- [x] Tasks matches its reference without new search/sort or changed due/status/refresh behavior.
- [x] Viewings matches its reference while preserving Dubai week boundaries, scheduling entry, selected-day mobile layout and load-more.
- [x] Counts, rows, status text and pagination are derived from actual data; no generated content is introduced as production data.
- [ ] Desktop/mobile/keyboard/native-zoom visual and functional criteria pass with screenshots compared to their references. Desktop/mobile visual review and responsive browser checks passed; native 200% zoom remains unverified because bundled Chromium could not spawn and Edge did not expose `#zoomLevel`.
- [x] Sidebar, public pages, dashboard, unconverted details/forms and pipeline board retain their appearance and behavior.
- [ ] Required frontend checks and targeted cross-repository browser regressions pass; all executable frontend checks below passed, but this aggregate criterion remains open for the native-zoom limitation and the inherited repository-wide formatter baseline.

## Validation

- Add `tests/e2e/crm-workspace-presentation.spec.ts` for shared visual/control geometry, real filtering/count consistency, role-specific controls, long content, missing media, empty/loading/error and keyboard/mobile checks. Reuse existing fixtures and assertions where practical.
- Preserve and run existing Properties/toolbar, Leads, Tasks/task-recovery and Viewings/viewing-recovery suites. Run pipeline/navigation smoke coverage because shared lead components have secondary callers. No mutation tests against the normal demo database.
- If numbered pagination introduces a range helper, add meaningful unit boundaries for 0/1/many pages, first/middle/last pages and retained query construction; avoid static class-name tests.
- Run API drift, lint, format:check, typecheck, unit and production build in frontend. Start the disposable backend fixture for authenticated browser coverage; backend quality gates are needed only if backend executable changes become necessary, which this scope does not authorize.
- Capture 1440px and narrow references for each target page in matching states; inspect screenshots, live runtime metadata/errors and native zoom. Smoke public home/listings/contact/agents, unchanged sidebar collapsed/expanded, dashboard and pipeline. Baseline limitations from prior work do not count as new passing evidence.

## Rollout and risks

Deliver incrementally: shared foundation with Properties, then Leads, Tasks and Viewings. Opt-in variants isolate unconverted consumers and permit rollback by removing the opt-in without reverting unrelated features. No migration/deployment change. Main risks: accidental shared-style spread, lost lead typing/drafts, permission leakage, mobile control-order regressions and stale/time-zone-dependent state. Keep business coordination feature-owned and verify those paths after each migration.

## Implementation evidence

2026-11-03: Delivered `workspace` opt-ins for `PageHeader`, `DataTable` and `CollectionPagination`, plus `CollectionToolbar`, `FilterChip`, `StatusBadge` and bounded range logic. Properties, Leads, Tasks and Viewings explicitly opt in at their collection/calendar routes; embedded lead panels and Pipeline retain default presentation. The range helper preserves an out-of-range requested page as current rather than falsely marking the last valid page.

Frontend API drift, ESLint and type checks passed; the isolated Webpack production build passed; and 297 unit tests in 47 files passed. The full formatter reports 79 inherited CRLF-only differences whose normalized contents pass Prettier; changed files are formatted. Disposable-fixture browser evidence is intentionally split: the final 38-case targeted run passed 34 cases with three intentional mobile drag skips and one Fast Refresh-affected mobile debounce observation; a frozen isolated mobile debounce rerun passed; and the complete mobile Viewings suite passed 10/10, including the delayed lost-response and previously unrun cases. Across those runs, all eight new workspace cases, both corrected thumbnail cases, desktop/mobile pipeline coverage, desktop debounce, Properties actions/pagination, Lead desktop immediate and mobile draft Apply/Cancel filtering, public/dashboard/pipeline separation and existing recovery flows passed. This is not represented as a single clean full-suite run. Visual review used saved 1440px, 390px and 320px captures against the four references; 768px was browser-tested without a saved capture. Normal runtime inspection then confirmed the restored frontend at port 3100 used `.env.local` with backend port 4311 (`/api/v1/health` 200): an authenticated native browser opened `/crm/properties` with 15 real demo properties, enabled controls and icon links; sidebar expand/collapse restored; project/page metadata identified this checkout and the active page; and configuration/session errors were empty. The capture is `outputs/crm-workspace/properties-final.png`. Native 200% zoom remains an explicit tooling limitation, not a passing responsive substitute. No backend executable, API, schema, dependency, configuration, sidebar, public-page or global-token change was delivered.
