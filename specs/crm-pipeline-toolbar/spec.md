# Sales pipeline workspace header and toolbar

Status: Delivered with a repository-wide formatter limitation — 2026-11-03.

## Goal

Apply the delivered compact CRM workspace header and search presentation to Sales pipeline.

## Scope

Only `/crm/leads/pipeline` header and search/filter navigation. Keep the description, sidebar, background, board, cards, stage pagination, refresh button and drag-and-drop implementation unchanged. Public pages and backend runtime are outside scope.

## User flow

Staff see the compact header and List/Pipeline and role-specific scope links. Search remains debounced by 300ms. Desktop Source, Sort and assigned-agent filters still apply immediately; advanced fields use the same disclosure as Leads. Mobile retains draft Apply/Cancel filters. Applied chips use existing query helpers. Pipeline does not gain a stage filter or a second refresh button.

## Contracts and access

Reuse existing pipeline query helpers, authorization and [lead contract](../../docs/contracts/leads.md). No endpoint, DTO, permission, database or dependency change. Manager and Agent scopes remain unchanged.

## Design

Reuse `PageHeader variant="workspace"`, `CollectionToolbar` and `FilterChip` through the existing `LeadFilters` component. Share the existing Leads toolbar rather than duplicate it. Preserve the live search input and all feature-owned state. This extends the earlier workspace specification only to Pipeline header/toolbar; the board remains excluded.

## Acceptance criteria

- [x] Pipeline uses the compact workspace heading with its description and existing primary action.
- [x] The shared toolbar shows Pipeline as current, retains valid scope links and supports responsive filter/chip interactions.
- [x] Desktop immediate filtering, 300ms search and mobile draft Apply/Cancel remain intact; no Stage field or duplicate refresh action.
- [x] Existing pointer/keyboard moves, cancellation, authorization, recovery and board pagination continue to pass.
- [x] Leads list, sidebar and public source remain unaffected.

## Validation

Run existing Pipeline desktop/mobile browser coverage, adapting filter interaction to its new disclosure and adding focused shared-toolbar assertions. Run Leads toolbar regression, lint, formatting, typecheck, units and production build; record inherited limitations. Inspect runtime metadata/errors and desktop/mobile screenshots. Use only disposable fixture data for browser mutations.

## Rollout and risks

No migration or configuration change. Main risk is shared LeadFilters altering navigation or remounting search; preserve hooks and query helpers. Rollback is the two presentation callers; do not change the board to compensate for toolbar changes.

## Implementation evidence

The route now opts into `PageHeader variant="workspace"`; `LeadFilters` supplies the same `CollectionToolbar` and `FilterChip` presentation used by the Leads list. The legacy pipeline-specific `FilterPanel` branch was removed without changing the component's hooks or query helpers. The board, cards, stage pagination, drag/drop and backend contract were not changed.

The disposable-fixture browser run passed 31 cases with three intentional mobile pointer/keyboard-drag skips (34 registered), including the Pipeline suite, the new shared-toolbar filter case in both projects, Leads desktop/mobile debounce and filter coverage, and public smoke coverage. Responsive testing covered 320px, 390px, 768px and 1440px; 1440px and 320px captures were visually reviewed. API drift, ESLint, TypeScript and 297 unit tests in 47 files passed, and the current-source isolated Webpack production build passed. Restored normal-runtime inspection confirmed the expected checkout and an authenticated `/crm/leads/pipeline` page with enabled search/filter/sort controls, a drag handle and the existing lead preserved; configuration and session errors were empty. The capture is `outputs/crm-workspace/pipeline-final.png`. The full formatter reports 77 inherited CRLF-only differences whose normalized contents pass Prettier; changed files pass scoped formatting.
