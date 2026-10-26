# Loading and control clarity

Status: Verified

## Goal

Make public discovery and CRM controls easier to recognize, with proportionate loading feedback and aligned select arrows.

## Scope

Replace font-based select arrows with centered SVG chevrons; reserve the Dubai skyline for larger route/result loading regions; use shared decorative spinners with explicit action text; quiet photo placeholders and a static photo-unavailable icon; visible Buy/Rent, Add property, Search and Clear filter labels. Keep familiar compact table, menu and gallery controls accessible.

## User flow

Headings, navigation and entered values stay visible during pending operations. One 64px skyline represents a loading collection; individual cards and photos use quiet reserved shapes. An initiating control shows a small spinner with the actual operation label, or grouped photo/lifecycle controls are locked while one adjacent operation status shows that spinner and label. Errors, success and unavailable media remain distinct from pending.

## Contracts and access

No Express API, data, permission, cookie, mutation or validation contract changes. Existing authorization, hydration readiness, duplicate guards and reconciliation remain intact.

## Design

Reuse semantic tokens, Button, Icon and NativeSelect. Add one shared SVG Spinner primitive with motion-safe rotation. NativeSelect keeps native keyboard behavior and a decorative chevron centered at the logical end, including small/default sizes. Public Buy/Rent navigation and the CRM Add property link have visible text. Keep the existing skyline geometry and reduced-motion treatment unchanged; use it once per large pending region. LoadingState keeps only the large 96px skyline presentation.

## Acceptance criteria

- [x] Public and CRM selects have aligned SVG chevrons with adequate text space.
- [x] Large route/result loaders retain one skyline per collection; small controls and photos do not repeat it.
- [x] Pending actions show operation-specific spinner feedback in their initiating control or a grouped adjacent status while preserving safeguards and values.
- [x] Buy/Rent, Add property, Search and Clear filters have visible labels; compact familiar controls retain accessible names.
- [x] Desktop/mobile navigation, filters, save/upload, media failure and reduced motion remain usable without horizontal overflow.

## Validation

Lint, formatting and typecheck passed; 95 unit tests across 16 files passed. The final isolated Webpack production build passed (all routes compiled), and its complete production-source snapshot hash matched the current source. The isolated focused desktop/mobile browser suite passed 35 tests with three intentional project skips (38 total); it exercised navigation, search, save, upload at the 5 MiB limit, delete, authentication/session feedback, reduced motion, one skyline per collection, quiet photo dimensions, native select keyboard behavior and SVG-chevron geometry. The final targeted native-link/control-clarity desktop/mobile checks passed 2 tests, confirming visible Add property link text, its `/crm/properties/new` destination and native-link semantics. Screenshot review passed at desktop and mobile widths, including a 320px public viewport sweep, 200% zoom and the narrow CRM account row. Next DevTools identified this checkout on port 3100 and reported `configErrors: []` and `sessionErrors: []` with `/properties` and `/` sessions open.

## Rollout and risks

Frontend presentation only. Watch narrow header/account rows and CRM action wrapping. Revert presentation components to roll back; no migration or configuration change.

## Implementation evidence

The delivered source uses the shared decorative motion-safe Spinner with operation text for submit, authentication, search, upload, delete, retry and navigation feedback. Grouped photo reorder/remove and lifecycle controls remain locked during work and expose one adjacent spinner/status with the current operation text. The original Dubai skyline geometry remains reserved for large route/result regions: each property collection has one 64px skyline with skeletons, and LoadingState has only its 96px form. Individual photo loading uses a neutral reserved shape; failed media uses a static image icon and optional `Photo unavailable` label. NativeSelect now uses a logical-end, centered SVG chevron while retaining native select semantics and keyboard behavior. Buy/Rent navigation and the CRM Add property native link expose visible text. There are no API, dependency, authentication, data, permission, configuration or operational-workflow changes.
