# Agent performance reporting

Status: Verified — 2026-11-18. P2-07 is complete; local verification does not claim deployment or a normal-database migration.

## Goal

Help managers distribute leads and coach agents using understandable recorded-work metrics, while letting agents inspect their own results. Avoid unsupported claims about customer response, revenue or employee quality.

## Scope

- A read-only `/crm/reports/agents` page, Reports workspace navigation entry, date range, agent selection for Admin/Manager, paginated agent table and metric explanations.
- Leads handled, first-time Won outcomes, average first recorded follow-up with completed sample count, assignment-episode count, Without recorded follow-up, and assignments ended without follow-up.
- Agency comparison for Admin/Manager; own historical aggregates only for Agents. Historical activity can survive reassignment without granting access to former lead details.
- Coverage warnings for incomplete/ambiguous history and clear active/inactive/former identity labels.
- Exclude charts, rankings, targets, conversion percentages, commission/revenue, CSV/PDF export, email/WhatsApp integration, scheduled reports, SLA/business-hours calculations and lead drill-downs.

## User flow

1. Staff open Reports from the existing workspace navigation. Default dates are month-to-date in Dubai; the page explains its timezone and recorded-work basis.
2. Admin/Manager see all eligible agents and may select one. Agents see only self with no other-agent selector or identity data. Current agents with no work get zero counts and an em dash for an unavailable average.
3. Apply validates inclusive dates, a maximum 366-day range and no future end date. Use URL `from`, `to`, `agentId`, `page`, `pageSize`; both dates are supplied together. Filter changes reset page to 1 and persist through reload/back/forward. Preserve invalid/repeated query values until validation; show a corrective error without fetching a broader report.
4. The heading, explanations and filters stay visible while a query-keyed result region loads. Disable pre-hydration filter actions consistently with existing CRM pages. Submitted controls identify pending state and cannot launch duplicate navigation.
5. The table shows counts, formatted elapsed average with sample count and identity availability. Explain that one lead can be handled by multiple agents, one lead earns only its first Won credit, and averages exclude episodes with no known follow-up. Zero seconds displays as zero, not missing.
6. A persistent coverage warning explains omitted uncertain history without exposing raw events. Always explain that call logging records an attempt, generic notes do not qualify, and the average is elapsed time including nights/weekends. Without recorded follow-up includes any stage and does not itself mean a customer needs contact.
7. Distinguish no matching historical agents, zero-work rows, no completed samples, invalid filters, report too large, session loss and request failure. Retry is an explicit read retaining filters. Session/access loss clears private results through existing recovery. Register a report-only history guard before router hydration so Back and Forward conceal results and reauthorize the exact destination URL through a fresh server read.
8. Show generated/as-of time and an explicit Refresh action preserving the URL. There is no polling, push freshness promise or cross-refresh snapshot consistency claim.

## Contracts and access

The backend-owned authority is `backend/specs/agent-performance-reporting/contract.md` (companion path); the repository-local synchronized [contract snapshot](../../docs/contracts/agent-performance-reporting.md) defines the delivered fields and exact calculations. The [implementation plan](../../docs/superpowers/plans/2026-11-18-agent-performance-reporting.md) records delivery.

Initial and refreshed reads use server-only API transport to `GET /api/v1/staff/reports/agent-performance`. Do not expose API_URL or database access. Backend live authorization is authoritative; frontend role presentation is not a permission check. Agents receive own historical aggregates only, including previous assignments, with no lead/customer drill-down. No new browser proxy route or Server Action is necessary for this read-only page.

The backend OpenAPI document, standalone frontend snapshot and generated declarations are delivered. Generated interfaces remain generated rather than hand-authored.

## Design

Reuse `PageHeader`, `FilterPanel`, `DataTable`, `CollectionPagination`, labelled date/select controls, Button, Alert and existing loading patterns. Place feature-specific data, definitions and table coordination in `src/features/reports/agent-performance/`; keep `src/app/(staff)/crm/reports/agents/page.tsx` thin. Add the navigation destination in existing `src/components/layout/workspace-navigation.tsx` using an existing appropriate icon.

Use semantic colors, explicit column headers/caption, visible focus and labelled validation errors. At 320/390px allow an intentionally contained horizontal table scroll with an accessible label while keeping page-level controls usable and no page overflow. Review 768/1440px, native 200% browser zoom, keyboard focus and long agent names. Loading/error announcements must not move focus unexpectedly. Explain metrics using ordinary text or an accessible disclosure, not hover-only tooltips.

## Acceptance criteria

- [x] Date/agent/pagination URL state, validation and default Dubai dates agree with the backend contract, including repeated parameters and month/year boundaries.
- [x] Admin/Manager can compare all/selected agents; Agents get only self, including direct URL attempts, role changes and former assignments without record-level access.
- [x] Table values match the backend fixture exactly; first-win attribution, reassignment, sample counts, zero/null distinction and all three response-cohort outcomes are explained accurately.
- [x] Current zero-work agents, historical inactive/former agents, empty results and coverage warnings render without leaking excluded identities or lead details.
- [x] Loading, refresh, failed reads, oversized reports, expired sessions and rapid filter changes preserve correct scope and prevent mismatched stale display.
- [x] Responsive, native-zoom, keyboard, long-name and accessible validation/retry review passes with visually reviewed screenshots.
- [x] Contract parity, frontend checks/build, cross-repository browser smoke and active-page runtime inspection pass with recorded evidence.
- [x] Backend acceptance passed before P2-07 was checked; both roadmap copies and feature documentation are reconciled.

## Validation

Unit-test date/filter parsing, actual page-entry repeated parameters, duration formatting, zero/null handling and safe error presentation. Browser fixtures cover Manager/Agent scope, date/agent filtering, pagination, known metrics, history limitations, failure/retry, session/role loss, hydration and out-of-order navigation. Use disposable Express/SQLite data and never real CRM mutations.

Final frontend quality checks passed API parity, lint, format, typecheck, 440 tests in 62 files and build. Two complete clean serial projects ran in separate frontend/proxy/backend/SQLite environments: desktop 240 passed/14 configured skips and mobile 192 passed/62 configured skips. The verified matrix accounts for all 508 discovered cases exactly once with zero failures, flaky outcomes, retries, missing or unexpected cases; it is not pooled from interrupted runs. The separate exact-data dashboard run passed 16/16. The active port-3100 checkout was inspected with the report open, read-only demo Manager sign-in/sign-out, Back/Forward document revalidation and no reported browser or Next DevTools errors. Responsive screenshots at 320/390/768/1440px and native 200% browser zoom were reviewed.

## Rollout and risks

Deploy the additive backend first, then frontend. No schema/dependency/configuration changes are planned. Rollback removes the report UI/navigation and route without changing lead history or existing dashboards. Historical ambiguities are surfaced, not backfilled; if the agreed usefulness/performance cannot be achieved, revise the specs before adding reporting persistence. Historical aggregate permissions are intentionally broader than current lead-detail ownership but expose only self metrics to Agents.

## Implementation evidence

Backend quality gates passed with 310 tests in 65 files; frontend quality gates passed with 440 tests in 62 files plus generated API parity. The separate clean browser projects and dashboard result are recorded in `.delivery-work/agent-performance/browser-matrix-verification.json` and `.delivery-work/agent-performance/dashboard-browser.json`. The final scoped re-review passed after fixes for dirty-form history cancellation and balanced future handovers. No deployment, normal-database migration or native Safari verification is claimed.
