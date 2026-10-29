# Viewing management

Status: Verified — 2026-10-29. Backend, frontend, browser and live-runtime evidence is recorded below.

## Goal

Deliver P1-23–P1-25: staff can arrange a property visit for a lead, see the schedule in a calendar and record feedback after the visit.

## Scope

Include a CRM Viewings destination, a lead-detail Viewings section, schedule/reschedule/cancel/complete controls, a responsive weekly calendar with a mobile daily agenda, and persisted feedback.

Exclude public booking, reminders, external calendar sync, recurring appointments, drag-to-reschedule, overlap prevention, tasks, dashboards and automatic lead-stage changes. No calendar package or new dependency was selected. The defaults below are delivered behavior.

## User flow

1. Open a lead's Viewings section and choose Schedule viewing. Preselect the lead and its inquiry property when eligible; let staff search/select another bookable property. Show the current assigned Agent. An unassigned lead directs Admin/Manager to existing assignment controls; it cannot be booked yet.
2. Enter date/start/end in explicitly labelled Asia/Dubai time; default duration 60 minutes. Show a summary before submission. A successful save opens the appointment detail and refreshes affected results, without changing lead stage.
3. Open /crm/viewings to review a weekly calendar, navigate previous/next week or Today and filter by status. Desktop uses readable day columns; mobile uses a selected-day agenda. Select an appointment to inspect details and reschedule or cancel while scheduled.
4. Once the appointment has started, enter required feedback and mark completed. Completed feedback remains readable and is read-only in this slice. Cancelled appointments remain visible when included by the status filter.
5. The lead's Viewings section uses the same bounded week/date navigation, with leadId applied; it supports past/future navigation rather than pretending to show unlimited history.

Keep headings/filter controls outside query-keyed loading boundaries. Show separate empty-period, no-filter-results, retryable read-error, expired-session and inaccessible-record states. Preserve entered form values on known failures. For uncertain creation, offer an identical explicit retry or explicit lead review and correction, retaining the same submissionId across all attempts in this form. Never automatically submit again. A delayed original and a corrected attempt must share the same unique receipt so they cannot both insert. A same-actor receipt conflict returns an authorized existingViewingId; offer a link to review that saved appointment instead of a new submission. For uncertain versioned updates, GET the appointment and require review before another write. Reassignment refreshes the injected calendar and detail context while preserving dirty/reconciling form values; fresh calendar data resets pagination. Reassignment revokes the old Agent's open detail/actions on refresh; Express remains authoritative throughout.

## Contracts and access

Express owns the canonical contract in the companion backend repository. The local [contract overview](../../docs/contracts/viewings.md) and [OpenAPI snapshot](../../docs/contracts/viewings.openapi.yaml) mirror its `docs/api/viewings.openapi.yaml`; `scripts/generate-api.mjs` generates `src/lib/api/generated/viewings.d.ts`.

- API: GET/POST /api/v1/staff/viewings, GET/PATCH /api/v1/staff/viewings/:id and PATCH /api/v1/staff/viewings/:id/status. List supports required from/to instants (<= 42 days), optional leadId/status, page and pageSize (1–100), returning { items, page, pageSize, total }.
- Create sends { submissionId, leadId, propertyId, startsAt, endsAt, expectedLeadVersion }. Reschedule sends { expectedVersion, expectedLeadVersion, startsAt, endsAt }. Terminal changes send { expectedVersion, status } with feedback required only for completed.
- ViewingDto contains id, safe lead/property/assignedAgent summaries, startsAt, endsAt, status, feedback, version and timestamps. The backend spec owns its exact shape and error behavior.
- Admin/Manager see all appointments; Agents see only appointments for their currently assigned leads. Responsibility follows current lead assignment, with no separate viewing assignee. UI choices do not grant permission.
- Booking/rescheduling needs a future start, 15–240-minute duration, nonterminal lead, active assigned Agent and published/available property. Cancel/complete can still act on a historic or no-longer-bookable property. Completion requires start <= server now and 1–4000 trimmed feedback characters.
- Convert explicit Dubai local input to offset-bearing instants; display Dubai time consistently even on devices in another timezone. Backend validates UTC instants and current eligibility. Do not expose owner contacts or private staff fields.
- Scheduled -> completed/cancelled only; terminal records are read-only. Booking and stage changes remain separate manual operations, with clear copy explaining that scheduling does not move the pipeline.

## Design

The calendar toolbar's date input, status select and Apply button share a 48px control height and aligned bottom edges; labels remain aligned on desktop, and controls stack without overflow on mobile.

Use thin src/app/(staff)/crm/viewings routes and feature-owned src/features/viewings/data and crm modules. Reuse PageHeader, FilterPanel, labelled fields, Button, Alert/FieldError, SubmitButton and existing property/lead picker patterns where their interfaces fit. Keep calendar layout feature-local; avoid a generic calendar framework without a current need.

Week/date/status state belongs in the URL. Fetch the first page on the server, with explicit Load more for additional appointments. In the calendar, loaded appointments are grouped by Dubai start day and time; overlaps remain separate readable entries. Display loaded/total counts and a visible Load more control so partial data never appears complete. Do not claim free/busy detection. Cards show start/end, lead, property, current agent and state; no required drag interaction.

Use RHF/Zod and locally owned fields, authenticated server reads and feature-owned Server Actions with live session checks, Origin/cookie allowlists and serializable results. Inspect existing shared transport interfaces before reusing them; do not import lead-specific mutation helpers into Viewings merely to avoid writing a small feature boundary. Preserve hydration guards and duplicate-submit protection.

Support 320, 390, 768 and 1440px with no page overflow, visible focus, labelled date/time inputs, announced results and keyboard-operable appointment links/forms. A mobile agenda is the accessible calendar alternative. Property/lead links open existing CRM details, never an editor by accident.

## Acceptance criteria

- [x] P1-23: staff schedule, inspect, reschedule and cancel a viewing from a lead; property selection does not overwrite the lead inquiry context or change stage.
- [x] Agent and manager UI match backend permissions, including unassigned leads, inactive agents and ownership changes while a form is open.
- [x] P1-24: weekly calendar and daily mobile agenda navigate/filter via URL, display Dubai dates correctly and expose all pages with clear loaded/total counts.
- [x] P1-25: a started viewing can be completed with required feedback; completed feedback survives reload and terminal records expose no edit actions.
- [x] Duplicate submission, stale version, uncertain save, invalid date, session expiry and revoked access have recoverable, honest UI states without blind retries.
- [x] Loading, empty/error and keyboard/touch behavior pass at all specified widths; current leads, pipeline and properties remain usable.
- [x] Local API snapshots/types match the backend-owned contract; no cross-repository imports or new dependency assumptions.

## Validation

The delivered focused unit suites are [tests/unit/viewing-input.test.ts](../../tests/unit/viewing-input.test.ts), [tests/unit/viewing-calendar.test.ts](../../tests/unit/viewing-calendar.test.ts), [tests/unit/viewing-actions.test.ts](../../tests/unit/viewing-actions.test.ts), [tests/unit/viewing-queries.test.ts](../../tests/unit/viewing-queries.test.ts) and [tests/unit/viewing-recovery.test.ts](../../tests/unit/viewing-recovery.test.ts). They cover offset conversion, midnight/week boundaries, pagination, serialization, lifecycle controls and uncertain-save behavior. [tests/e2e/viewings.spec.ts](../../tests/e2e/viewings.spec.ts) and [tests/e2e/viewing-recovery.spec.ts](../../tests/e2e/viewing-recovery.spec.ts) cover manager/Agent scheduling, distinct/repeat properties, reschedule/cancel/feedback, reassignment revocation, stale writes, pagination, keyboard operation, recovery and desktop/mobile layouts with disposable fixtures and deterministic clocks.

API generation/drift validation, lint, formatting, typecheck, 218 unit tests in 39 files and an isolated production build passed. Backend `bun run check` passed with 105 tests in 28 files, alongside the additive migration and database check. The final browser coverage used two final-source runs: the viewing suites passed 34/34 desktop/mobile cases in 3.7 minutes, and the remaining existing suites passed 165 cases with 9 conditional project/viewport skips in 12.9 minutes. Together, the runs cover 199 passing cases, 9 skips and 208 registered cases, with no failures; they are not represented as one combined suite. The viewing coverage asserted Dubai displays in an America/New_York browser at 320/390/768/1440px. Live Next DevTools confirmed the active checkout and `/crm/viewings` with no configuration or session errors.

## Rollout and risks

Deploy the compatible backend migration/API before exposing frontend routes. Retain data when rolling back the frontend. No package or configuration change was introduced. The delivered defaults are fixed Dubai time, assignment-derived responsibility, permitted overlaps, manual stages and immutable completed feedback. Future reminders or richer calendars require their own scope decision.

## Implementation evidence

2026-10-29 alignment follow-up: the date input, status select and Apply button were measured at 48px with identical desktop top/bottom edges. The mobile layout retains 48px controls without horizontal overflow. This is a toolbar styling correction.

The feature is verified on `feat/viewing-management`. Backend quality, migration and contract checks plus frontend API, quality, unit, production-build, targeted browser and live-runtime evidence are recorded above. See the [implementation plan](../../docs/superpowers/plans/2026-10-28-viewing-management.md).
