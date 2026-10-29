# Agency dashboard

Status: Verified (2026-10-29) — P1-28, P1-29 and P1-30 are delivered with automated, browser and visual-QA evidence.

## Goal

Give staff a trustworthy overview of lead acquisition and current pipeline outcomes at `/crm`, using existing lead data and server-enforced visibility.

## Scope

- Replace the existing Overview placeholder with four metric cards, a leads-by-source bar chart and a horizontal pipeline-by-stage bar chart.
- P1-28: New leads this week, deals won and conversion rate, plus a Total leads context card. P1-29: leads by source. P1-30: pipeline by stage.
- Approved defaults: one fixed current-week acquisition metric and otherwise all-time/current-state summaries. No date picker, agent selector, historical comparisons, revenue, performance ranking, task/viewing widgets, export or notifications.
- Do not complete P1-14 or P1-18 through this delivery. Dashboard mobile acceptance is required independently of the public mobile checklist.

## User flow

1. Signed-in staff open the existing Overview destination `/crm`.
2. The heading states Agency overview for Admin/Manager or My overview for Agent. Show the returned scope and generated timestamp in Dubai time.
3. Four cards show Total leads, New leads this week, Deals won and Conversion rate. Total leads is all time. Labels explain their different periods; Deals won is explicitly Current Won leads, all time and conversion is Won / all leads, all time.
4. Charts show counts for every supported source/stage, including zero categories. Existing Properties navigation remains available; no chart drill-down is introduced.
5. A loading region reserves space while results load; errors show an accessible Alert and explicit retry. A failure must never display fabricated zero totals. A zero-lead response shows zero counts, conversion as an em dash with No leads yet, and useful links to the lead workflow.
6. Reopening or explicitly refreshing fetches fresh data. No polling, shared cache or live-update subscription is added. Expired sessions return through existing authentication handling.

## Contracts and access

- Express owns all aggregation and access decisions. The companion backend's authoritative contract is implemented as a local [OpenAPI snapshot](../../docs/contracts/dashboard.openapi.yaml) and generated declarations; no cross-repository source imports are used.
- Read: `GET /api/v1/staff/dashboard`, with no query parameters. Unknown parameters return 400 rather than implying unsupported filters.
- Admin/Manager scope is `agency`, including unassigned leads; Agent scope is `mine`, constrained to current `assignedAgentId` on every aggregate. Agents cannot request agency totals. Current assignment determines visibility even for old leads.
- Use live staff authorization and session-cookie allowlisting through the existing server-only API transport. Responses and fetches use no-store; include no lead IDs, names, contacts, notes, assignee IDs or property-owner details.
- Response: `generatedAt`, `scope`, `timezone`, `weekStart`, `weekEndExclusive`, `totalLeads`, `newLeadsThisWeek`, `wonLeads`, `conversionRatePercent`, `leadsBySource`, `pipelineByStage`. Exact types, category order and invariants are defined by the backend-owned contract.
- Week starts Monday 00:00 Asia/Dubai, ending the next Monday. Count created leads from week start through generatedAt, excluding future timestamps. Other counts include visible leads created through generatedAt, grouped by current source/stage.
- Conversion is current Won leads / total visible leads × 100, rounded to one decimal by the backend; null when total is zero. Display one decimal consistently. This is a current-state ratio, not a historical close rate. Reopening a Won lead reduces the Won count; duplicate win events do not inflate it.
- Example: 10 visible leads, 2 currently Won, 3 created this week yields total 10, Won 2, new this week 3 and conversion 20.0%. Lead creation age does not limit Won or chart counts.

## Design

- Reuse PageHeader, Card, Alert, Button, Icon and semantic tokens. Keep the App Router entry thin; own dashboard coordination under `src/features/dashboard/`.
- Use the local shadcn/ui Base Nova Chart primitive with installed `recharts` 3.8.0. The chart client component disables animation and supplies an accessible HTML count list alongside each chart.
- Keep headings, explanatory periods, scope and timestamp visible outside the loading result region where practical; timestamp/scope from the response belong to the returned results and must not be guessed from stale client data.
- Four cards use a responsive 1/2/4-column grid and stack on narrow screens; charts stack below and can use two columns on wide screens. Use explicit responsive chart dimensions, readable category labels, reduced-motion behavior and no horizontal page overflow at 360px.
- Source order: Website, Call, Walk-in. Pipeline order: New, Contacted, Viewing Scheduled, Offer, Won, Lost. Use semantic chart colors with maroon emphasis; color alone conveys no information.
- Provide chart titles and an accessible HTML count list/table for each chart; tooltips are supplementary. All-zero charts show an empty-state explanation and their zero counts rather than misleading bars. Retry and navigation work by keyboard with visible focus.

## Acceptance criteria

- [x] `/crm` shows all four cards and both charts from the authenticated dashboard endpoint, replacing the placeholder.
- [x] Admin/Manager see agency totals including unassigned leads; Agent sees only currently assigned leads, with no agency totals in HTML, network results or accessible chart data.
- [x] Cards match the 10/2/3 fixture and explicitly label week/current-state/all-time semantics.
- [x] Monday Dubai boundary, zero denominator, current-stage changes and reassignment agree with the backend contract.
- [x] Both charts include all categories in contract order, and chart sums each equal totalLeads.
- [x] Zero-data, loading, expired-session and server-failure/retry states behave as specified; failures do not appear as zeros.
- [x] Desktop/mobile, keyboard, accessible text alternatives, reduced motion and chart hydration pass browser verification.
- [x] OpenAPI snapshot/generated types, dependency inventory and documentation agree with verified code before roadmap items are checked.

## Validation

- Unit: response transport/error mapping and percent/null presentation; source/stage mapping preserves zeros and order.
- Browser with real backend fixtures: Admin, Manager, two Agents and unassigned leads; exact metric/chart counts, reassignment then refresh, no-data, failure/retry, revoked session, and mobile/keyboard/text alternatives.
- Run frontend quality gates including API drift checks and backend integration smoke checks. Confirm port 3100 project identity with configured next-devtools, open `/crm`, inspect runtime errors/page metadata and check browser console/chart sizing.

## Rollout and risks

- The approved metric, scope and design defaults are implemented. This additive delivery introduced no database migration or production runtime configuration; its dedicated browser fixture uses documented test-only environment variables.
- No breaking changes to existing lead APIs. Disable/revert the new Overview composition and dashboard mount if required; existing workflows continue independently.
- Current assignment and current-stage reporting intentionally change after reassignment/reopening. Historical performance/cohort reporting is deferred to a separately specified feature.
- Implementation plan: [agency dashboard](../../docs/superpowers/plans/2026-10-29-agency-dashboard.md).

## Implementation evidence

- Backend: 126 tests across 35 files, lint, type checks, build and disposable-database verification passed. The focused dashboard tests include a real SQLite WAL snapshot assertion; an aggregate performance fixture with 10,000 fictional leads completed the five reads in 22 ms, 16.4 ms, 17.5 ms, 7.8 ms and 11 ms while preserving total/distribution invariants.
- Frontend: 271 tests across 46 files, lint, API drift checks, type checks and production build passed. The focused dashboard tests cover malformed DTO rejection as well as transport and presentation behavior.
- The final dedicated dashboard Playwright suite passed all 16 cases (8 desktop and 8 mobile), with no skips or failures, in 1.9 minutes on isolated port 14311. Its open-browser runtime inspection reported the expected project path, no configuration/session errors and `/crm` page metadata. Final 1440×1024 desktop and 390px mobile captures are at `outputs/dashboard/desktop.png` and `outputs/dashboard/mobile.png`; [design QA](../../design-qa.md) found no P0/P1/P2 findings. Dedicated dashboard acceptance uses `STAFF_E2E_DASHBOARD_ONLY=1`; the default fixture remains separate for legacy coverage.

Legacy browser coverage is the union of two parallel full runs: 233 passed/26 skipped/1 failed, then 226 passed/26 skipped/8 failed. Every one of the 234 active legacy cases passed in at least one logged run, but neither run was clean; timing and sign-in-cache instability affected the failed cases. The trace classification found no dashboard endpoint involvement. The revised pipeline expired-session case then passed six focused desktop/mobile repetitions. This limitation does not apply to the final clean dashboard acceptance run.

Approved design update (2026-10-29): implement the selected maroon/ivory dashboard mockup with four metric cards, adding Total leads (all time). Preserve the existing CRM shell and deliver the complete professional responsive design. The fixed-period and role-scope defaults are approved for implementation.
