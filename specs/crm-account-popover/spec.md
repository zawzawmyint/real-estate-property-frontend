# Compact staff account popover

Status: Delivered with a repository-wide formatter limitation — 2026-11-03.

## Goal

Replace the oversized account drawer and inline sign-out block with the approved compact account trigger and anchored popover.

## Scope

Expanded sidebar shows initials, staff name/role and chevron in one row. Collapsed sidebar shows an initials avatar trigger. Both open the same small non-modal popover with identity, divider and Sign out. Mobile uses the compact account row within the existing navigation drawer; its popup stays within the viewport. Do not alter navigation, logo, shell dimensions, page content, public pages or background.

## User flow

Staff activate the account trigger, inspect their identity and sign out using the existing action. Escape/outside click dismiss; keyboard focus returns to the trigger. Errors and session retry remain reachable in the popover. Closing/reopening or changing sidebar state must preserve pending sign-out and failure feedback through the existing provider, without duplicate submissions.

## Contracts and access

Preserve existing Better Auth session/sign-out endpoints, cookies, server session checks, role labels, redirects and mutation guards. No API/schema/permissions/dependency change or backend executable change. This is presentation and popup interaction only.

## Design

References: [expanded trigger](expanded-reference.png) and [collapsed trigger](collapsed-reference.png).

Use the installed Base UI popover through an adapted official shadcn Base Nova primitive. Non-modal, no backdrop or blur; right/end anchored on desktop with collision handling for narrow screens and nested mobile drawer. Approximately264px wide, thin border, rounded corners and restrained shadow. Trigger and Sign out targets at least44px; long identity text wraps in popup and truncates only in trigger. Preserve accessible names and explicit session/sign-out error alerts.

## Acceptance criteria

- [x] Opening and closing the account popup leaves the account trigger and View website footer positions unchanged in expanded and collapsed sidebars. Focus-guard elements remain isolated within one footer item.
- [x] Expanded/collapsed account triggers match the approved concepts and open the same compact popup.
- [x] Escape/outside dismissal, focus return and keyboard activation work without a desktop overlay.
- [x] Mobile popup is reachable within the navigation drawer with no viewport overflow; Escape dismisses nested popup first.
- [x] Sign-out success, duplicate prevention, persistent failure and session retry continue to work.
- [x] Navigation, public pages and backend behavior remain unchanged.

## Validation

Run authentication/navigation browser regressions on the disposable backend, plus focused popup geometry/dismissal checks at desktop and320/390px. Verify long names, pending/reopened sign-out, failure and retry. Run frontend lint, formatting, typecheck, units and production build; inspect live runtime errors and screenshots. Do not sign the user out of the normal demo session during verification.

## Rollout and risks

Main risk is nested drawer focus or popup clipping; use Base UI portal/collision behavior and test actual mobile interactions. Keep the provider above popup mounts. No migration. Roll back account presentation only if necessary.

## Implementation evidence

Added `src/components/ui/popover.tsx`, an adaptation of the installed Base UI official shadcn Base Nova primitive; it introduces no dependency. `StaffAccount` now uses one non-modal popup for compact and expanded triggers. The persistent `StaffAccountProvider` and its session/sign-out logic remain unchanged; a hydration-ready guard prevents a late streamed account boundary from mismatching its ready provider. The old account drawer and inline sign-out block are removed. Popover collision handling keeps the nested mobile-drawer popup in the viewport.

Browser evidence is intentionally split rather than claimed as one clean full run: all 33 runnable authentication cases passed with three intentional desktop-only skips across the final runs. The desktop run passed 17 cases except an immediate resize assertion; the unchanged assertion was corrected to wait for chart resize observers, then its isolated desktop reflow rerun passed. The final mobile run passed 15 cases with the three intentional desktop-only skips; focused mobile interaction was separately exercised at 320px and 390px. Coverage includes long names, failure/retry, pending dismissal/reopen, duplicate prevention, keyboard/outside/Escape dismissal with focus return, nested mobile behavior, and 320/375/768/1024/1440px layouts plus existing CSS enlarged-layout coverage. Earlier hydration and fixture-limiter failures were resolved by fresh fixture runs; a trace archive cleanup issue was bypassed by the passing trace-off mobile rerun.

Frontend API drift, ESLint and TypeScript checks passed, as did 297 unit tests in 47 files and the current-source production build. Scoped formatting passed; the full formatter has 76 inherited CRLF-only differences whose normalized content passes Prettier. Desktop 1440px and mobile 320px actual captures were reviewed. Restored normal runtime used the frontend at port 3100 with `.env.local` and backend port 4311. An authenticated native browser opened `/crm/viewings` with the original DemoAdmin zero appointments; both expanded and collapsed triggers opened the compact popover without overlay or blur, Escape returned focus to the trigger, and the sidebar/menu state was restored without a normal-data sign-out mutation. Next DevTools identified the expected checkout and active page with no configuration or session errors. Final captures are `outputs/crm-workspace/account-expanded-final.png` and `outputs/crm-workspace/account-collapsed-final.png`. Native 200% browser zoom was not part of this scope and is not claimed.

Follow-up footer stability correction: Base UI places fixed focus-guard siblings beside the trigger; the sidebar footer's `space-y-4` treated them as additional children and moved the footer when the popup opened. Wrapping the account slot in one `min-w-0` footer child isolates those focus guards. Native normal-runtime pointer geometry checks on `/crm/properties` found no before/after movement or page scroll in either state: collapsed account Y=660, View website Y=600, footer Y=583.2px; expanded account Y=644, View website Y=584, footer Y=567.2px. Earlier page scrolling came from in-app browser automation focus behavior, not a real-pointer popup open. The focused existing desktop test now opens the long Properties list and asserts trigger/footer positions for both states, but no fresh authentication suite is claimed for this wrapper-only correction. Fresh lint, TypeScript, 297 unit tests in 47 files and the current-source isolated production build passed; runtime configuration/session errors remained empty. See `outputs/crm-workspace/account-footer-fixed.png`.
