# Sales pipeline Kanban

Status: Verified (2026-10-27)

## Goal

Deliver the sales pipeline described below, including the approved review remediation.

## Review remediation — 2026-10-27

- [x] Drag completion announces cancellation, unchanged stage, immediate saving, or Won/Lost confirmation according to the actual action; no-op drops never imply a pending confirmation.
- [x] Direct announcement regression tests cover these distinct outcomes, and pointer/keyboard behavior stays compatible.
- [x] Pipeline browser tests use one local unique-name helper instead of eleven duplicated UUID transformations.

## Feature goal

Let authorized CRM staff scan leads by sales stage and move a lead to its next stage from a clear, responsive board.

## Scope

Included: a CRM pipeline route/view for the existing six stages; search/source/agent filters supported by lead listing; per-column pagination; moving leads between columns with `@dnd-kit/react`; a direct keyboard and touch-friendly stage control; responsive and accessible loading, empty and error states.

Admin/Manager can view all leads and use the existing assignment controls where already available. Agents see only leads currently assigned to them. Every move uses the existing stage mutation and activity history. This feature adds no new business rule, backend endpoint, database field, in-column ordering, automation, notifications, analytics, viewings or task scheduling. The leads table remains available.

## User flow

Open the Pipeline view from Leads. Show leads in New, Contacted, Viewing Scheduled, Offer, Won and Lost columns. Search and supported filters apply across columns. Each column shows its authorized total and first page, with an explicit Load more action when additional results exist.

A staff member can drag a lead card to another stage, or use its labelled Move to stage control. Confirm before moving to Won or Lost. On success, move the card, update source and destination counts, and announce the change. On conflict or uncertain response, reload the affected lead and column data; do not blindly repeat a write. If access is revoked, remove the lead from the board and show the existing unavailable/session behavior.

Empty columns say “No leads in [stage]”. A board with no matching leads offers Clear filters. Loading preserves the board heading and filters; read failures offer a retry that preserves filters. A rejected or canceled drag leaves the lead in its original column.

## Contracts and access

Use the existing lead list read contract for each stage with the current search/source/agent filters and pagination. Preserve URL-owned search/filter state. If implementing those reads requires a new response shape or endpoint, pause implementation at that boundary and update the repository-local snapshot of the backend-owned [lead management contract snapshot](../../docs/contracts/leads.md) and matching OpenAPI snapshots before coding.

Use the existing `changeStage(leadId, { expectedVersion, stage })` Server Action and Express `PATCH staff/leads/:id/stage` contract. A successful response supplies the updated authorized lead; conflicts require an explicit refresh/review. No new API, persistence, event, or stage transition rule is introduced.

Express remains authoritative: Admin/Manager can access all leads; Agents can access only currently assigned leads. The board and its controls do not grant access. Keep server reads and mutations within existing authenticated API boundaries and never expose private fields beyond the existing lead DTO.

## Design

Use the established CRM tokens and shared PageHeader and FilterPanel for title, view navigation and filters. The board itself is a feature component rather than a DataTable: its cards are not tabular rows.

Feature component contracts:

- `PipelineBoard({ columns, onMove, pendingLeadId })` owns the responsive board composition and drag provider. `columns` are ordered stage-column models; `onMove(leadId, destinationStage)` delegates the authorized mutation to the existing lead action.
- `PipelineColumn({ stage, label, leads, total, hasMore, onLoadMore, busy })` owns stage heading/count, drop target, cards, empty/loading/error presentation and per-column pagination.
- `PipelineLeadCard({ lead, onMove })` owns compact lead identity, property/preference, received date, stage badge, detail link and accessible Move to stage control; it must not duplicate the lead detail or assignment workflow.

Keep data fetching, filter serialization, permissions and mutation conflict handling in the Leads feature. Reuse existing lead presentation (stage/source badges and dates), Button, Badge, Sheet/Dialog and shared CRM layout components. Do not generalize the board into a cross-feature component with no second consumer.

Desktop: six ordered columns in a horizontally scrollable board; each column has a stable readable width, restrained border/card treatment, stage label and count. Keep the page itself free of horizontal overflow. Highlight a valid drop target and the active card without relying on color alone. Tablet: retain the same board with clear horizontal scroll affordance. Mobile: present one selected stage at a time with a labelled stage switcher and accessible stage-move control; avoid a six-column squeeze or page-level horizontal scrolling.

Use `@dnd-kit/react` and its `/sortable` subpath for grouped lists. Follow the official [multi-list sortable state pattern](https://dndkit.com/react/guides/sortable-state-management) and [sensors guidance](https://dndkit.com/react/guides/sensors/). Keep persisted stage changes in the existing action, not in local drag state. Keyboard users can operate drag-and-drop and every card has a non-drag Move to stage control. Provide visible focus, announced drag/move results, 44px touch targets, reduced-motion support and confirmation before terminal-stage writes. Make all six columns and actions usable at 320, 390, 768 and 1440px.

## Acceptance criteria

- [x] Authorized users can open a Pipeline view and see all six stages in order, with leads, authorized totals, empty/loading/error states and per-column pagination.
- [x] Search and supported source/agent filters remain shareable in the URL and consistently filter every column; Clear filters restores the unfiltered board.
- [x] A valid drag between columns calls the existing versioned stage mutation once, updates the board and activity, and refreshes counts.
- [x] Keyboard users can move a lead without a pointer; touch users have an explicit stage control; Won/Lost moves require confirmation.
- [x] Canceled/invalid moves preserve the original stage; conflict, outage and uncertain results reload current authorized data and never issue an automatic duplicate mutation.
- [x] Admin/Manager and Agent visibility matches existing Express authorization, including removal of leads after reassignment; hidden controls are also protected by the API.
- [x] Board remains usable at 320, 390, 768 and 1440px with visible focus, screen-reader labels/announcements and reduced-motion support; no page-level horizontal overflow.
- [x] Existing Leads list and detail behavior remain available and unchanged; no new API, database schema, or stage policy is introduced.
- [x] `@dnd-kit/react` and `@dnd-kit/dom` 0.5.1 are installed in the frontend only; both roadmaps and tech-stack copies agree with this delivery.

## Validation

Add focused tests for stage grouping, empty and paginated columns, filter serialization, one-call move behavior, cancellation, terminal-stage confirmation, conflict refresh and role-aware UI. Run frontend lint, format check, typecheck, unit suite and production build. Run lead browser tests for all stages, desktop/mobile layouts, pointer drag, keyboard movement, non-drag controls, confirmation, read errors, conflicts, assignment revocation and existing list/detail regressions. Inspect the live CRM board at 1440, 768, 390 and 320px.

## Rollout and risks

The delivered board reuses the existing paginated lead list and stage mutation. Backend production behavior is unchanged; its disposable browser fixture only adds independent pipeline test identities. No migration or deployment configuration change is needed. Main risks are excessive initial requests from six columns, count drift during concurrent edits, drag/keyboard accessibility gaps and stale lead ownership. Load only the first page per stage, use returned totals, refresh after writes/conflicts, and rely on Express ownership checks.

## Brief implementation plan

1. **Confirm existing list query coverage** — map stage/source/search/agent/page filters and response totals to the board; update the backend contract only if existing API coverage is insufficient.
2. **Adopt the drag library** — add `@dnd-kit/react`; import sortable helpers from its `/sortable` subpath; update the frontend and backend tech-stack copies to distinguish installed from deferred tools.
3. **Build the feature UI** — add PipelineBoard, PipelineColumn and PipelineLeadCard; reuse shared CRM header/filter primitives and lead presentation.
4. **Connect stage moves** — use the existing versioned stage action, terminal confirmation, conflict refresh and activity feedback; retain the explicit move control.
5. **Verify and reconcile** — run targeted and full frontend checks plus browser/accessibility/responsive review; update the specs, both roadmaps and implementation evidence only after acceptance passes.

## Implementation evidence

Verified 2026-10-27. The route is `/crm/leads/pipeline`, reachable through the List/Pipeline switch in Leads. Admin/Manager default to All leads and Agents to My leads. Initial server reads stream inside a query-keyed Suspense boundary; six stage requests load the first 20 records each. Same-origin reads handle Load more, refresh and reconciliation. Page overlap is deduplicated by lead ID/version. Refresh and stage saves reset columns to their first pages.

Cards reuse source, budget, assignee and date presentation and link to the existing lead details/assignment workflow. Desktop/tablet uses six readable columns inside a keyboard-focusable horizontal scroll region; mobile shows one selected stage with an explicit move control and hides the drag handle. The existing PageHeader, FilterPanel, fields, buttons, alerts and dialogs retain the CRM palette and focus behavior.

`@dnd-kit/react` and `@dnd-kit/dom` are pinned at 0.5.1. Grouped sortables retain keyboard sensors while disabling optimistic DOM sorting: cards remain in persisted columns until the save succeeds, including when a terminal confirmation is canceled. Card targets resolve their sortable group; empty-column targets resolve their stage data. Custom announcements identify the lead and destination stage. CSS motion is guarded and sortable transitions are disabled.

Review remediation verifies that cancellation, no-op, ordinary saving and terminal-confirmation announcements correspond to the actual outcome; a no-op never announces a pending confirmation. Direct outcome tests cover those cases, and pipeline browser data now uses one local unique-name helper while preserving its existing digit mapping. The full browser run reported 163 passed, 8 intentional skips and one pointer-cancel test synchronization failure. After correcting the test to wait for settled drop-animation geometry and verify an active drag before Escape, that case passed three consecutive isolated reruns. All 164 applicable browser cases are covered across these runs; a single clean full-suite rerun is not claimed.

Every save uses the existing versioned `changeStage` Server Action. A synchronous guard prevents overlapping writes. Conflict or uncertain outcomes read the affected lead and refresh stage data without repeating the mutation. Initial or refreshed partial failures block stage writes while leaving read-recovery controls usable. Session loss clears the board and returns to sign-in; unavailable/reassigned leads are removed on refresh or rejected moves. No new endpoint, DTO, persistence field, stage rule, in-column order, notification, task or viewing scheduler was introduced.

Frontend API drift, lint, formatting and type checks passed with 142 unit tests in 26 files and an isolated production Webpack build. Backend `bun run check` passed with 78 tests in 20 files, including its build. The full isolated desktop/mobile browser regression passed 140 tests with 6 conditional viewport skips (146 total); focused pipeline coverage passed 20 tests with 2 mobile skips for desktop-only dragging. Coverage includes pointer and keyboard drag/cancel, terminal confirmation, conflicts, role ownership/reassignment, pagination/retry, held reads, lost save responses and session loss. Layouts were checked at 320, 390, 768 and 1440px; desktop/mobile screenshots were visually reviewed. Next.js DevTools confirmed an active pipeline browser session with no configuration or session errors.

This is a verified local delivery of P1-10. Production deployment and production HTTPS cookie topology are not claimed.

## Drag stability correction — 2026-10-27

The reported single-card pointer move at 1480×807 reproduces a transient board-height change during save/drop cleanup. Preserve the mounted board until fresh stage reads can replace all columns together; avoid the default return-to-source drop animation competing with a server-persisted cross-column move. Keep focus restoration from scrolling the page, and reserve the existing status message area so repeated saves do not remove/reinsert board space. Retain pointer edge scrolling, keyboard sensors, terminal confirmation, explicit stage control, permissions and existing conflict/uncertain-save recovery.

- [x] A single-card move and return move retain board height, viewport position and horizontal scroll throughout pointer dragging and save reconciliation at the reported viewport.
- [x] Cancellation, keyboard focus/movement, terminal confirmation and versioned single-write behavior remain correct.
- [x] Frontend quality gates, isolated build and affected browser tests pass; evidence is reconciled after verification.

Verified 2026-10-27: the prior persisted columns stay mounted until the refreshed six-stage result replaces them together. The Feedback return-to-source animation is disabled, the board announcement reserves 48px, and pending text reuses the card's timestamp line. Successful-save focus runs after the enabled controls commit, using `preventScroll`. Pointer edge scrolling, keyboard movement, terminal confirmation, versioned writes, authorization and existing error/recovery contracts remain unchanged.

The new 1480×807 single-card geometry regression first failed with a 387.5px height swing. The final test measures board height, viewport position, page scroll and horizontal scroll on every animation frame through forward and return saves, within a 2px tolerance; it also verifies focus and exactly two version increments. Three consecutive final geometry/focus repetitions passed. Frontend API drift, lint, formatting, TypeScript, 199 unit tests in 34 files and the isolated production Webpack build passed. The final complete pipeline suite passed 21 cases with three intentional mobile skips for desktop-only dragging (24 total). A fresh scoped review reported no remaining findings, desktop screenshots were visually reviewed, and the active pipeline reported no configuration or session errors. All writes used disposable fixtures; existing user leads were not changed. No backend code, API, schema, dependency or configuration values changed.
