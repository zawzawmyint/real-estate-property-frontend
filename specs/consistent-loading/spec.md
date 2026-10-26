# Consistent loading feedback

Status: Superseded for loading/control presentation

## Goal

Record the verified original loading feedback baseline across public discovery and the staff CRM.

## Scope

Shared decorative building artwork and accessible status composition; route fallbacks; independent homepage regions; existing action pending states and property image placeholders. No new dependencies, APIs, permissions or write retries. The current presentation rules are defined by the superseding [loading and control clarity specification](../loading-and-control-clarity/spec.md).

## User flow

Keep shared navigation and completed content visible. Show destination-shaped fallbacks while data loads. This historical baseline used compact building feedback during actions; the current delivery replaces it with a shared spinner and operation text, as recorded in the superseding specification. Preserve form values, duplicate guards and photo reconciliation. Errors, empty results and success remain distinct from pending feedback.

## Contracts and access

Existing Express property and native Better Auth contracts remain authoritative. No contract changes. Staff content remains behind requireStaffSession; initial verification uses neutral feedback without identity or protected data.

## Design

Use an original layered Dubai skyline SVG with an especially slender Burj Khalifa-inspired centerpiece. Uneven, overlapping foreground and middle buildings partially conceal one another and the tower base; muted primary-color layers create depth without a symmetrical row, broad pyramid-like tower or heavy platform. The current delivery preserves this geometry only for large route/result regions; it uses one 64px skyline per collection with skeletons and retains the 96px LoadingState form. Buttons now use the shared Spinner for pending feedback. Reserve image dimensions and maintain responsive layouts.

Visual revision verified: the shared skyline preserves its pending-state behavior and reduced-motion treatment while using the layered geometry above.

## Acceptance criteria

- [x] Public and CRM route/result loading originally used shared filled building artwork.
- [x] Homepage search and headline render while featured properties load.
- [x] Existing search, save, sign-in/out and photo operations originally showed consistent pending feedback while preserving entered data and duplicate-request protection.
- [x] Reduced motion disables loading animation; unavailable photos are static.
- [x] Staff verification never renders protected content before authorization.

## Validation

Frontend lint, formatting check and typecheck passed. All 93 unit tests across 16 files passed, and the production Webpack build passed. An exact source-copy check also passed.

The isolated browser full suite recorded 73 passing tests and 3 intentional skips, plus two infrastructure failures: a desktop inventory fixture returned a 500 connection reset and mobile agent authentication timed out after 30 seconds. The final focused run against the current source passed 10 tests with 2 intentional project skips under a 60-second timeout. It covered both prior failure paths and desktop/mobile navigation, homepage and results streaming, and mobile-filter progress/dismissal. The broader run also passed save preservation and duplicate guards, the 5 MiB photo-upload limit, delete-modal pending feedback, image dimensions and color, reduced motion, roles and real public 404 behavior.

Next DevTools reported `configErrors: []` and `sessionErrors: []` with real browser sessions open on CRM routes. Separate 1440px desktop and 390px mobile login checks observed no page errors or horizontal overflow. This evidence covers the delivered loading presentation; the full browser suite did not exit successfully because of the two failures above.

A native-SVG Chromium preview of the revised skyline passed at 1200x800 desktop and 390x844 mobile viewports, and at 20, 24, 36, 96 and 112 pixel sizes. It reported no page errors or horizontal overflow; reduced motion produced zero animations. This focused visual revision check did not rerun the full integration browser suite, so its earlier coverage and limitations remain as recorded above.

## Rollout and risks

Frontend-only delivery; revert loading presentation and boundaries to roll back. Streaming may commit HTTP status before a later not-found result; preserve noindex and existing permission checks. No simulated percentages or minimum loading delays.

## Implementation evidence

This historical record verified the shared primary filled multistory SVG and rising CSS fill, destination-shaped route/result placeholders, independently streamed homepage content, and action feedback coverage. The current [loading and control clarity specification](../loading-and-control-clarity/spec.md) supersedes its action and individual-media presentation: actions use a Spinner with operation text, photos use quiet reserved placeholders, unavailable photos use static iconography, and the skyline is reserved for large regions. The public property-detail route intentionally has no `loading.tsx`, so real public 404 responses remain intact. No API, dependency or permission contract changed.
