# Follow-up tasks

Status: Verified 2026-10-29 on `feat/follow-up-tasks`.

## Goal

Let staff record the next action for a lead with a due date/time and quickly find overdue follow-ups.

## Scope

Include a Tasks CRM destination, a paginated Tasks section on lead details, lead-linked creation, open-task editing, completion/cancellation, due/status filters and overdue highlighting. Responsibility follows current lead assignment.

Exclude personal/standalone tasks, independent assignment, reminders/notifications, recurring tasks, priorities, task calendars, dashboards, automatic stage/viewing changes and lead activity API extensions. No new dependency or runtime configuration was introduced. The formatter ignores backend-owned task/viewing snapshot files so their verbatim generated contract source is preserved. The user approved these defaults and implementation on 2026-10-29.

## User flow

1. Open `/crm/leads/[id]` and its Tasks section; choose Add follow-up. `/crm/tasks/new?leadId=<uuid>` preselects that lead. Global `/crm/tasks` also offers New task with a role-scoped lead picker, reusing the existing lead read API. Leads that are unassigned, assigned to an inactive Agent or won/lost cannot receive new tasks; show the reason and a link to existing lead assignment/details as appropriate.
2. Enter a required title (trimmed 1–160 characters), optional notes (trimmed <= 2000, blank -> null) and explicit Asia/Dubai date/time. Start with no due date rather than silently choosing one. Show lead/current Agent and due time before saving. A successful save opens `/crm/tasks/[id]` and refreshes relevant task results.
3. `/crm/tasks` defaults to open tasks ordered earliest due first, including overdue ones. URL filters are status=open/completed/cancelled/all and due=all/overdue/today/upcoming; page is URL-owned, pageSize is 20. Selecting Overdue selects open status; invalid direct URL combinations show a useful validation state and reset link rather than silently changing their meaning. Today includes earlier tasks today as well as future ones.
4. Rows show title, lead link, current Agent (or Unassigned), due date/time, state and a text Overdue badge when appropriate. Use CollectionPagination and total results; never imply a first page is the whole list. The lead Tasks section applies leadId and its own URL keys (`taskStatus`, `taskDue`, `taskPage`) to avoid collisions with the existing Viewings filters. Add follow-up remains available independently of empty results when eligibility permits.
5. Task detail shows plain-text notes, lead/current Agent, due time and lifecycle timestamps. Open tasks expose Edit, Mark complete and Cancel task; cancellation requires confirmation. Complete is allowed before the due date. Terminal tasks have no edit/transition controls. No reopen/delete controls.
6. Editing happens on task detail, with shared task fields also used by the create form. Keep lead fixed. A changed due date must be future; title/notes may change while keeping an existing overdue instant unchanged. If lead eligibility changes, disable editing but retain authorized completion/cancellation. Lead closure never silently finishes outstanding tasks.

Show loading, no-tasks, no-filter-results, retryable read failure, expired-session and inaccessible-record states. Keep toolbar/headings outside query-keyed Suspense. Prevent submission before hydration and same-tick duplicates. Preserve entered values on known failures and keep dirty/uncertain forms intact during background data refresh.

For uncertain creation, retain one submissionId across explicit same-payload retries and corrections; do not automatically write again. A TASK_RECEIPT_CONFLICT offers the authorized existing task link. An uncertain update fetches current detail and requires review before another mutation; do not silently repeat, overwrite or declare success. Revoked access removes private task context and offers return navigation; server authorization remains definitive.

## Contracts and access

The backend owns the implemented contract at companion path `backend/specs/follow-up-tasks/contract.md`; the backend spec defines persistence and eligibility. This repository contains `docs/contracts/tasks.md`, a verbatim OpenAPI snapshot, generated `src/lib/api/generated/tasks.d.ts`, and task registration in `scripts/generate-api.mjs`. No sibling-source imports.

- GET/POST `/api/v1/staff/tasks`, GET/PATCH `/api/v1/staff/tasks/:id`, PATCH `/api/v1/staff/tasks/:id/status`. List supports leadId/status/due/page/pageSize; detail/write envelope is `{ task, asOf }`, list is `{ items, page, pageSize, total, asOf }`.
- Create sends `{ submissionId, leadId, expectedLeadVersion, title, notes, dueAt }`. Edit sends `{ expectedVersion, expectedLeadVersion, title, notes, dueAt }`. Transition sends `{ expectedVersion, status: completed | cancelled }`.
- Admin/Manager access all; Agents only tasks on currently assigned leads. No separate assignee field. Reassignment immediately changes backend access and current Agent presentation; refresh open context without discarding dirty edits. Before an edit, read the current lead to obtain its version/eligibility; never invent a lead version from TaskDto.
- TaskDto exposes only safe lead/Agent id/name summaries, editable content, dueAt/status/isOverdue, version and timestamps. No lead contacts, staff email, property owner details or receipt material.
- Convert explicitly labelled Dubai input to offset-bearing instants and display Asia/Dubai consistently. Keep the exact original UTC dueAt when date/time fields were untouched so editing text cannot round seconds away or reschedule an overdue task.
- isOverdue and filter membership are backend-derived using one asOf per response. Show an Updated time and Refresh control. Revalidate visible task result regions every 60 seconds and on window focus, resetting to the first page on filters or explicit refresh. Periodic/focus refresh retains the selected page; if that page becomes empty/out of range, replace it with the last valid page. Skip overlapping reads and pause while hidden; no write retry or full-form reset. Refresh detail read context too, preserving dirty forms and requiring version review when it changes. Overdue is therefore refreshed on a bounded cadence, not promised to change at the exact instant a deadline passes.

## Design

Use thin `/crm/tasks`, `/crm/tasks/new` and `/crm/tasks/[id]` entries with feature-local `src/features/tasks/data` and `crm` modules. Add Tasks to workspace navigation and a tasks slot to LeadDetail, following the existing Viewings integration.

Collection pagination must expose native navigation links, with the shared button styling and pending feedback. Correct the existing pagination primitive's button-role override as part of integration so keyboard and assistive-technology users receive link semantics on task and existing collection pages.

Reuse PageHeader, FilterPanel, DataTable, CollectionPagination, labelled fields, Button, Alert/FieldError and SubmitButton. Use RHF/Zod, server reads and feature-owned validated Server Actions with live sessions and existing allowlisted Origin/cookie forwarding. Keep task recovery feature-owned; do not import viewing-specific mutation boundaries. Reuse a date helper only if its existing public interface fits; do not create a generic scheduling framework.

Support 320/390/768/1440px, keyboard navigation, labelled date/time inputs and visible focus. Overdue must be conveyed in text as well as color. Use a compact responsive task list/table with no page overflow, readable long titles/notes, accessible confirmation and announced save/error feedback.

## Acceptance criteria

- [x] P1-26: staff create a dated follow-up from a lead or global Tasks, read/edit it while eligible/open and complete/cancel it with persisted results.
- [x] P1-27: open overdue tasks are highlighted with text and filterable; completed/cancelled tasks never show overdue, with coherent updated-time/refresh behavior.
- [x] Current lead assignment and eligibility control all entry points; stale/reassigned/unassigned/inactive/terminal cases match Express without exposing other leads.
- [x] Dubai date/time remains correct on a device in another timezone; untouched overdue timestamps survive text-only edits exactly.
- [x] Global and lead-specific pagination/filters remain distinct, bounded and URL-owned; all authorized tasks are reachable.
- [x] Duplicate clicks, delayed/lost responses, changed receipt payloads, stale versions, session expiry and ownership revocation have honest recovery without automatic writes.
- [x] Loading/empty/error, dirty-refresh, keyboard and 320/390/768/1440px behavior pass; existing lead, viewing and pipeline workflows remain intact.
- [x] API snapshots/generated types and feature docs agree with backend contract; no new dependency, notification service or cross-repository import is introduced.

## Validation

Implemented unit suites are `tests/unit/task-input.test.ts` (validation/Dubai conversion/exact timestamp retention), `task-queries.test.ts` (filters/pagination/independent lead keys), `task-actions.test.ts` (auth/serialization/invalidation), `task-recovery.test.ts` (receipts/version review/dirty refresh), `task-edit-reconciliation.test.ts` (saved/draft merge and explicit conflict resolution) and `pagination-semantics.test.ts` (native link semantics). Browser suites `tests/e2e/tasks.spec.ts` and `task-recovery.spec.ts` cover Manager/Agent flows, pagination, closure/reassignment, expired sessions, overdue boundaries, manual/periodic/focus refresh and held responses, using `tests/fixtures/task-helpers.ts` with isolated desktop/mobile accounts.

Frontend API validation, lint, formatting, typecheck and 241 tests in 45 files passed; the isolated task build passed. Runtime inspection confirmed the expected checkout at port 3100 with an active `/crm/tasks` session and empty configuration/session errors. Current task-browser and final legacy serial-regression evidence is recorded below.

## Rollout and risks

Deploy the additive backend before exposing frontend routes/navigation. Revert frontend exposure/application code to roll back while retaining task records. Existing leads gain no inferred task. Delivery checkboxes are verified; no deployment is claimed.

Alternative considered: independent personal tasks with a separate assignee. Defer it because it adds assignment/privacy rules beyond P1-26–27; the recommended lead-linked approach reuses the delivered ownership model. Reminder automation is a separate feature, not necessary for due dates and overdue highlighting.

No product decision or verification gap remains for this slice. Ownership, lifecycle and Dubai-date defaults were approved on 2026-10-29.

## Implementation evidence

- Backend task routes, additive migration and API contract are implemented; backend `bun run check` passed (119 tests in 33 files, with lint, formatting, typecheck and build).
- Frontend API validation, lint, formatting, typecheck and 241 tests in 45 files passed. The isolated task production build passed; runtime inspection on port 3100 found the expected checkout at `/crm/tasks` with no configuration or session errors.
- All 36 task cases have passing final-source evidence across a 35/36 worker run plus unchanged exact-timestamp and repeated responsive serial reruns (2/2); this is deliberately not represented as one clean 36/36 run. Desktop/mobile visual QA and 320/390/768/1440px checks passed.
- `src/features/tasks/crm/edit-reconciliation.ts` is the implemented draft-reconciliation helper: it merges untouched saved fields, preserves dirty text and atomic date/time drafts, and requires an explicit saved-versus-draft choice for conflicts.
- The final legacy serial browser regression passed unchanged source: 199 passed with 9 conditional viewport/project skips and no failures in 16.8 minutes. Earlier high-concurrency worker load/router initialization failures are not represented as product failures; every affected case passed the serial run.
