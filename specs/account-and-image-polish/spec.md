# Staff account and property image polish

Status: Verified

## Goal

Make staff identity controls compact and finished, and show a branded building illustration while property photos load.

## Scope

- Use the same compact identity row in the expanded CRM sidebar, mobile sidebar and account drawer: initials avatar, staff name, role and trailing icon-only sign-out.
- Give the account drawer a relevant description instead of generic navigation copy.
- Show a lightweight inline building SVG in property image slots while photos load; replace it with the photo on success and a static unavailable state on failure.
- Reuse the building illustration for public property-card image skeletons. Keep other content skeletons and existing route loading behavior.
- No new account settings, uploads, profile APIs, authentication changes, image delivery changes or artificial loading delays.

## User flow

Staff open the existing account control or expand the sidebar to see their identity and sign-out action in one row. Existing session retries, pending/error feedback and duplicate protection persist across closing/reopening drawers.

Public visitors see a gently animated building in unloaded image slots. Successful images replace the placeholder, including cached images; failed images show a static building and Photo unavailable. Changing an image URL starts the appropriate new loading state. Layout dimensions remain stable.

## Contracts and access

Keep the existing StaffAccountProvider and native Better Auth sign-out/session contract. Express owns authorization. PropertyPhoto URLs, dimensions, alt text, eager/lazy loading and fetch priority remain unchanged; no backend changes. The image lifecycle is keyed by the photo URL so a replacement URL does not inherit the prior URL's settled state.

## Design

Reuse semantic maroon/ivory tokens, Poppins, existing Button/Alert primitives and a locally authored inline SVG. Account names truncate with full text available through a title. Avatar is decorative. Sign-out keeps its accessible label and 44px target. Loading SVGs are decorative and animation is disabled by prefers-reduced-motion; avoid per-thumbnail live-region announcements.

## Acceptance criteria

- [x] Sidebar and drawer show readable identity and trailing accessible sign-out without a separate loose action row.
- [x] Pending, session failure, retry and sign-out failure behavior remain intact.
- [x] Slow property photos show the building animation until load; successful photos clear it and failures stop animation with an accessible `${alt}. Photo unavailable` name.
- [x] Cached-image completion and replacement-URL lifecycle clear or restart the placeholder correctly.
- [x] Public property-card skeletons reuse the building image placeholder.
- [x] Reduced motion keeps a static illustration; original alt text, responsive fit and loading priorities are preserved.

## Validation

Run frontend lint, formatting, typecheck, unit tests and isolated production build. Exercise account pending/failure drawer behavior and delayed, successful, cached, failed and changed photo URLs in Chromium; inspect desktop/mobile screenshots and reduced-motion styles.

## Rollout and risks

No deployment configuration or migration required. Roll back presentation changes to the existing account and image components if needed. Scope is image-slot loading, not a blocking full-page splash screen.

## Implementation evidence

Frontend lint, full formatting, typecheck, 90 unit tests and an isolated production Webpack build passed on 2026-10-23. Targeted Chromium checks passed 8/8 account cases across desktop/mobile navigation, long identity/error rendering, session-check retry, and pending/error close-reopen behavior. Image checks passed 4/4 across desktop/mobile slow-success dimensions and document position, failure accessible naming, and reduced motion. A separate Chromium harness using the real `PropertyImage` in a snapshot-only route confirmed replacement URL transitions after both a loaded and a failed image, a warmed same-origin cached image completing without a placeholder, and no page errors. It used native cache without request interception; this is Chromium-only evidence.
