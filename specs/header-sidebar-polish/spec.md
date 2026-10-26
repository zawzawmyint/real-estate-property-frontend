# Public header and CRM navigation polish

Status: Verified
Date: 2026-10-23

## Goal

Make public discovery and staff navigation compact, keyboard-accessible and consistent while preserving existing routes, roles and authentication boundaries.

## Scope

- Public headers expose only icon-only Buy and Rent links, with accessible names and native titles, at their existing purpose-filtered destinations.
- At desktop CRM widths (1024px and above), the left rail starts collapsed at 88px and expands to 240px through an explicit toggle. The expanded rail shows the full wordmark, labels and inline staff identity; its in-memory state survives CRM route navigation only.
- Below 1024px, the normal-flow Menu launcher opens the complete CRM sidebar drawer. The compact desktop account control opens a left account drawer.
- Inventory add, search, clear, details, edit and public-listing controls are icon-only while retaining their existing names, destinations and role restrictions.
- Shared local line icons, local Poppins/Lora typography and the existing Base UI drawer are reused.
- The public footer includes a small, muted Staff sign-in text link to `/login`, with visible keyboard focus and a 44px touch target.

Excluded: a CRM top header, persisted sidebar preferences, new navigation destinations, API/configuration changes, permission changes and a native-browser-zoom or full WCAG audit.

## User flow

- Public visitors open Buy or Rent from the header; there is no staff entry in the public header or menu. Staff use the footer Staff sign-in link to `/login`, or enter directly at `/login` or `/crm`.
- Staff use Overview and Properties from the desktop rail or mobile drawer. Nested property routes keep Properties current. View website returns to `/`.
- The desktop account icon opens a left drawer; on mobile the complete sidebar contains the same account presentation. One `StaffAccountProvider`, mounted by the CRM layout, keeps identity reconciliation, pending state, duplicate submission guard and error feedback alive when either drawer closes and reopens.
- Drawers close on a destination selection, Escape, or the relevant breakpoint change and use the existing focus/scroll-lock behavior.

## Contracts and access

No API, persistence, cookie, environment, command or authorization contract changed. `StaffLayout` still requires a server staff session and Express remains the authorization authority. UI visibility does not grant access.

Existing routes and query contracts are preserved: `/`, `/login`, `/crm`, `/crm/properties`, `/crm/properties/[id]`, `/crm/properties/[id]/edit`, `/properties/[id]`, `/properties?purpose=sale` and `/properties?purpose=rent`. Inventory editing remains restricted to roles that already have edit access; public listing access still requires a published, available property.

The backend-owned fixture-only change is documented in the companion repository at `backend/specs/navigation-test-fixture/spec.md`. It does not change the production authentication API or limiter.

## Design and accessibility

- CRM has no top bar. The desktop sidebar is full viewport height; the content column begins at its top. Branding is mark-only when collapsed and includes the wordmark when expanded.
- Every icon-only interactive control has an `aria-label` and native `title`; SVG icons are decorative. Expanded controls retain readable text where identity or navigation context needs it.
- Public Buy/Rent remain 44px icon links. The matching property-results query has `aria-current="page"`; public routes outside matching results do not imply a current link.
- The mobile CRM drawer is `min(320px, calc(100vw - 32px))`, scrolls its content, retains visible focus behavior and releases scroll lock after close/resize.
- The project uses two authored font families: self-hosted Poppins for UI/body text and Lora for public display text and the wordmark. See [typography](../typography/spec.md).

## Acceptance criteria

- [x] Public desktop and mobile header/menu navigation offer only accessible icon-only Buy/Rent destinations and no staff link.
- [x] Public footer offers Staff sign-in to `/login` on desktop and mobile; anonymous visitors reach the existing staff login form.
- [x] Desktop CRM offers an 88px collapsed rail, an explicit 240px expansion state and route-local in-memory persistence.
- [x] CRM mobile navigation opens the complete sidebar below 1024px, supports Escape/focus restoration and releases scroll lock when it closes or resizes away.
- [x] Account session feedback, pending sign-out and duplicate guards survive account drawer close/reopen across the desktop/mobile presentations.
- [x] Inventory icon controls preserve existing accessible names, URLs and role restrictions.
- [x] Authentication APIs, persistence, limiter and role permissions remain unchanged; disposable navigation accounts support browser coverage only.

## Validation

- `bun run api:check`, ESLint, Prettier, Next route type generation plus `tsc`, and 90 frontend unit tests passed on 2026-10-23.
- A production Webpack build passed in an isolated exact-source copy while the active development server remained untouched.
- The Chromium browser suite passed 62 tests with 2 duplicate width sweeps skipped. It covered desktop widths 320/375/768/1024/1440 and mobile emulation, current links, absence of staff links in the public header/menu, icon names/URLs, native Admin/Manager/Agent flows, account failure/retry state, drawer close/reopen persistence, Escape/focus/resize handling, long identities and protected routes.
- The focused isolated Chromium desktop/mobile footer test passed 2/2 on 2026-10-23. It confirmed the footer link reaches the existing `/login` form and an anonymous direct `/crm` request redirects to that same form.
- Manual screenshots covered expanded CRM, mobile CRM sidebar and public mobile icons. Browser assertions verified Poppins on homepage body/login/CRM and Lora on homepage display text; token contrast measurements were recorded in the delivery verification.

## Rollout and limits

No migration, deployment step or configuration change is required. Native browser zoom and Safari were not exercised; the browser suite used Chromium and a 200% CSS layout-scale check. This scope is not a full WCAG audit.
