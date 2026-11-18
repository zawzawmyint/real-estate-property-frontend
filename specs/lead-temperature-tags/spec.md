# Lead temperature tags

Status: Verified — 2026-11-18. P2-06 is complete; no deployment or normal-database migration is claimed.

## Goal

Help staff prioritize follow-up using an explicit assessment of a lead's current interest and readiness, independently of sales stage.

## Scope

- One manually selected temperature per lead: `hot`, `warm`, `cold` or `unassessed` (displayed as **Not assessed**).
- Hot: strong interest and ready to act soon. Warm: interested with unresolved decisions. Cold: low current engagement or a distant timeline. These are guidance for staff, not computed rules or conversion promises.
- Display the temperature on CRM lead rows, lead details and pipeline cards. Edit on lead details through an explicit Save temperature action.
- Add a URL-backed Temperature filter to the lead list and existing pipeline filter flow. Filtered CSV export respects the selection while retaining its existing columns.
- Record real changes in the existing activity timeline, including actor, time and previous/new values.
- Exclude automatic scoring, suggestions, bulk changes, custom tags, mandatory assessment, new dashboard metrics, notifications and changes to CSV schemas. Create/edit contact forms do not acquire a temperature control in this slice.

## User flow

1. Historical leads, manually created leads, CSV imports and both public inquiry paths start as Not assessed. Do not infer temperature from stage, budget, duplicate status or source.
2. Staff open an accessible lead and see its saved temperature and a labelled selector with all four choices. Selecting a value does not save it; Save temperature persists it. Returning to Not assessed is supported.
3. A successful save updates the saved badge, current lead version and timeline, with a polite confirmation. Only a real transition creates activity. All stages, including Won/Lost, retain and permit manual assessment.
4. Reassignment preserves temperature. Stage changes, notes, edits, imports, tasks and viewings do not automatically change it. Temperature changes do not change those business fields; normal lead version/updatedAt tracking does advance.
5. List/pipeline filters offer All temperatures, Hot, Warm, Cold and Not assessed. Changing the filter resets pagination, retains other valid filters, and survives reload/back/forward. Both page entries must preserve array-valued/repeated search parameters through validation: `/crm/leads/pipeline?temperature=hot&temperature=cold` and the equivalent list URL show the existing invalid-filter state, never silently remove the filter or fetch all temperatures. Backend filtering applies before counts and pagination. Empty results distinguish no matching leads from a failed request.
6. Prevent duplicate submission and competing temperature, stage, note/call and assignment mutations with parent-owned coordination on lead details. Include AssignmentDialog's trigger and submission, even if the dialog was opened before another operation began. A synchronous acquisition/release guard protects same-tick submissions in either direction; pending state alone is insufficient. While a mutation is pending or its result awaits reconciliation, block the other local mutations. Release the recovery block only after the required authorized reads succeed. Preserve unsaved temperature selection, assignment selection and note drafts; do not claim success before confirmation. Standalone list assignment dialogs keep their existing behavior.
7. On a definite version conflict, refresh the lead/history, show current saved state and preserve the proposed selection for explicit review/resubmission. On timeout/transport/5xx, reconcile through a fresh authorized read before enabling another write; if the current value equals the requested value, explain that it is the current saved value without attributing the change to this request. Never automatically retry a write. If reconciliation fails, require reload/retry of the read.
8. A lost session follows existing login recovery. Lost record access hides private content and disables editing; selection/draft state must never reveal an inaccessible refreshed record. Existing dirty-form navigation protection covers unsaved temperature changes.

## Contracts and access

The backend main OpenAPI entry must semantically resolve imported cookie requirements under `staffCookie` and its `StaffCookie`/`staffSession` aliases. The frontend-local lead snapshot and generated declarations retain their valid standalone `StaffCookie` definition. Backend semantic regression coverage must resolve references and catch every undeclared authentication scheme in the main document rather than relying only on text matching or generated types.

The [contract snapshot](../../docs/contracts/lead-temperature-tags.md) mirrors the authoritative backend `specs/lead-temperature-tags/contract.md`. The implemented contract is represented in backend OpenAPI, the frontend OpenAPI snapshot and generated frontend declarations.

The implemented mutation is `PATCH /api/v1/staff/leads/{id}/temperature` with `{ expectedVersion: positive integer, temperature: "hot" | "warm" | "cold" | "unassessed" }`, returning the existing LeadDetail envelope with additive temperature. LeadSummary/LeadDetail and activity shapes, filter syntax, errors and no-op semantics are defined in the contract.

Admin/Manager can read/update all agency leads; Agents can read/update only their currently assigned leads. Express rechecks live staff and ownership inside the write transaction. Hidden or nonexistent leads use existing 404 behavior. Temperature is staff-only; public inquiry inputs/responses and chatbot/public property responses do not accept or reveal it.

Follow existing auth distinctions: 401 for missing/expired/invalidated sessions and disabled/banned staff, 403 for an authenticated staff role forbidden from an operation, and 404 for inaccessible/nonexistent leads. On 401 use sign-in recovery; do not turn disabled-session failures into a new 403 contract.

Use a feature-owned `changeTemperature` Server Action through the existing lead mutation boundary, runtime validation and allowlisted session/Origin forwarding. No browser database access or cross-repository source import.

## Design

Reuse lead presentation helpers for a `TemperatureBadge`, existing Badge/semantic tokens, labelled native select/field controls, Button, Alert/AlertDescription, FilterPanel, DataTable and CollectionPagination. Use restrained red/amber/blue treatments for Hot/Warm/Cold and neutral treatment for Not assessed, subject to existing token contrast. Text always conveys meaning without color. Reuse one feature-local badge across list, detail and pipeline; avoid a generic tagging framework or new package.

Keep editing on detail to avoid conflicting with pipeline drag/keyboard controls. Place the saved badge separately from the draft selection. Labels, field descriptions, visible focus, pending state and error announcements must work with keyboard/screen readers. Fit 320/390/768/1440px and actual native 200% browser zoom without hiding the save/recovery controls or introducing page overflow. Preserve existing supported table/board scrolling.

## Acceptance criteria

- [x] The backend main OpenAPI authentication declarations pass document-wide semantic regression coverage for `staffCookie`, `StaffCookie` and `staffSession`, while the frontend snapshot and generated types remain synchronized.

- [x] Every staff lead summary/detail displays exactly one correctly labelled temperature; historical/new/manual/import/public-created leads start Not assessed.
- [x] Admin/Manager and the currently assigned Agent can change/reset it; other Agents, disabled staff and unauthenticated users cannot read or write inaccessible data.
- [x] A real save persists once, increments version once and adds one actor/time/from/to timeline event atomically; current-version same-value saves produce no write/event.
- [x] Stage, assignment and related workflows preserve temperature; temperature changes preserve their business state.
- [x] List/pipeline filter URLs, counts, pagination, return navigation and filtered exports agree across combined filters and Agent ownership; CSV columns/import versions remain compatible.
- [x] Repeated temperature parameters reach validation at both page entries and show invalid-filter recovery; they never silently broaden results. Valid single-value filters still reach every pipeline stage page.
- [x] Conflicts, response loss, failed reconciliation, reassignment/session loss and rapid clicks do not cause silent overwrite, automatic retry, duplicate events or lost unrelated drafts.
- [x] Assignment cannot start/submit during a pending temperature save or failed reconciliation, including an already-open dialog; temperature cannot submit during an assignment mutation. Recovery preserves drafts and permits a fresh explicit save only after successful reads. Disabled/invalidated sessions follow 401 sign-in recovery.
- [x] Badge, selector, filters and feedback pass keyboard, responsive and native-zoom checks, and pipeline movement still works.
- [x] Contract parity, both repositories' quality checks, disposable migration/database checks, focused and existing integration regression, and active-page runtime inspection have recorded evidence before P2-06 is checked.

## Validation

Focused backend and frontend tests cover strict validation, filters, mutation recovery, actual repeated-query route entries, session recovery and detail assignment/temperature coordination. Backend `bun run check` passed lint, format, typecheck, 285 tests in 61 files and production build; the resumed disposable `bun run db:check` passed. Frontend `bun run check` passed API drift, lint, format, typecheck, 416 tests in 61 files and production build with 20 static outputs. Browser evidence is deliberately split: the November 17 environment refresh interrupted a run after 207 completed cases; on November 18 a fresh fixture ran the exact 279 remaining selected cases with 222 passed and 57 expected skips. The matrix verifier accounts for all 486 current cases exactly once: 419 passed, 67 expected skips, and zero failed, missing, unexpected or duplicated cases. This is not represented as one uninterrupted clean run.

## Rollout and risks

Backend migration precedes the coordinated API/UI rollout. No new dependency or configuration is planned. Preserve existing CSV files and pending import receipts. Manual assessment can become stale; use timeline history and follow-up tasks rather than inventing automatic aging. The backend contract describes migration and rollback limitations. Operational deployment and migration of the normal database require their own delivery handling.

## Implementation evidence

- Backend final `bun run check` passed lint, formatting, typecheck, 285 tests in 61 files and production build; the resumed disposable `bun run db:check` passed (`.delivery-work/lead-temperature/backend-final-check.log`, `.delivery-work/lead-temperature/database-resumed-check.log`).
- Frontend final `bun run check` passed API drift, lint, formatting, typecheck, 416 tests in 61 files and production build with 20 static outputs (`.delivery-work/lead-temperature/frontend-final-check.log`). The earlier focused Edge run passed 14/14. The final matrix covers all nine P2-06 desktop cases and eight applicable mobile cases, with one expected skip for the desktop-only native-zoom sweep.
- The interrupted/resumed browser matrix covers all 486 current cases exactly once: 419 passed and 67 expected skips, with no failures, missing, unexpected or duplicated cases (`.delivery-work/lead-temperature/browser-matrix-verification.json`). It is not a single uninterrupted run.
- Responsive review passed at 320/390/768/1440px; native 200% zoom was reviewed at 1280 physical/640 CSS pixels (ratio 2, `scrollWidth` 640). Keyboard Home/ArrowDown/Tab/Enter changed Hot to Warm and recorded history. The November 18 active-page runtime check at the expected checkout/3100 reported empty configuration, session and page-error arrays (`native-zoom-200-reviewed.json`, `keyboard-qa.json`, `runtime-mcp.json`).
- A main-OpenAPI-reference regression was demonstrated red then green and independently resolved with openapi-typescript. Frontend declarations are generated from the frontend-local `docs/contracts/leads.openapi.yaml` snapshot. The assignment/session-expiry review finding was fixed and its regression passed (`review-green.log`).
- The pre-commit OpenAPI authentication repair aliases both `StaffCookie` and `staffSession` to the existing `staffCookie`/`agency.session` definition in the main document. A first RED regression found four unknown `StaffCookie` references; a broader RED then found 14 `staffSession` references across notifications, dashboard, tasks and viewings. The GREEN semantic test resolves all three names, walks every declared/inherited main-document security requirement to reject undeclared names, and validates list/create/export/temperature cookie binding. Backend `@redocly/openapi-core` 1.34.21 is dev-only; no runtime, database or browser behavior changed. Backend final check passed again (`.delivery-work/lead-temperature/openapi-auth-backend-final.log`); the earlier post-repair frontend check remains passing (`.delivery-work/lead-temperature/openapi-auth-frontend-check.log`) and no browser rerun is claimed.
- Independent review findings are fixed with red-to-green regressions. No deployment or normal-database migration is claimed.
