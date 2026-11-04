# Compact Overview header and metric cards

Status: Delivered with a repository-wide formatter limitation — 2026-11-03.

## Goal

Match the approved revised Overview mockup: compact shared header and shorter four metric cards, retaining existing graphs.

## Scope

Only Overview header and metric-card presentation, including matching loading placeholders. Preserve title/description/Refresh, metric definitions, labels, icons, counts, scope, timestamps, chart types and chart layout. Sidebar, warm ivory background, public pages, API and backend runtime remain unchanged. No new charts, links, search, filters or shared abstractions.

## User flow

Staff open `/crm`, see their existing authorized agency/personal overview and use the existing Refresh action. Loading, empty, error and retry behavior remain unchanged.

## Contracts and access

Existing dashboard read and role scoping remain authoritative under the [agency dashboard spec](../agency-dashboard/spec.md). No endpoint, data shape, permission, calculation, dependency or configuration change.

## Design

Use existing `PageHeader variant="workspace"` in all dashboard header states. Reduce metric cards to 16px padding with smaller numbers and tighter internal gaps. Reuse the existing mapped card renderer. Keep graphs and their implementation untouched; they naturally move upward into the space saved by shorter cards. Preserve responsive one/two/four-column layout, wrapping text and visible focus.

## Acceptance criteria

- [x] Loaded, loading and error headers use the existing compact workspace variant and preserve their content/actions.
- [x] All four cards are visibly shorter, with readable unchanged values and explanations.
- [x] Existing graph source, data/calculations, sidebar, background and public source remain unchanged.
- [x] Overview fits 320/390/768/1440px without page overflow and Refresh remains usable.

## Validation

Run required lint, formatting, typecheck, unit and production-build checks. Inspect real authenticated Overview at desktop/mobile sizes, compare card geometry with the approved mockup, verify Refresh and runtime errors. No new tests for static classes or mutations against demo data. Document inherited formatting limitations.

## Rollout and risks

Presentation-only, no migration. Long descriptions may increase individual card height; allow wrapping instead of truncation. Rollback only the dashboard-specific classes/header opt-in.

## Implementation evidence

`dashboard-results.tsx` now opts loaded, loading and error headers into the existing workspace `PageHeader`; its loading metric placeholders match the compact card geometry. `dashboard-view.tsx` retains the existing mapped metric renderer and only changes card spacing: 16px card/content padding, 28px icon container, a `text-3xl` value and tight margins. Measured metric cards are 119.6px tall. Chart components, metric calculations, DTOs, role scoping, refresh logic, routes, sidebar, background, public pages and backend runtime were not changed.

Full ESLint and TypeScript checks passed, as did 297 unit tests in 47 files and a current-source isolated Webpack production build. The full formatter has 77 inherited CRLF-only differences whose normalized content passes Prettier; the two changed files and this spec pass scoped formatting. An authenticated native browser verified four correct metrics, both unchanged graphs, usable controls and a Refresh click that advances the updated timestamp. Responsive checks at 1440px, 768px, 390px and 320px found no page overflow and confirmed all four cards at 119.6px. Next DevTools identified the expected checkout and active `/crm` session with no configuration or session errors. Visual review used `outputs/crm-workspace/overview-compact-final.png`, `overview-compact-1440.png` and `overview-compact-320.png`. Native 200% browser zoom was not part of this scope and is not claimed.
