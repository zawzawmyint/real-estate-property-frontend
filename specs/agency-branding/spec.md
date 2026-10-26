# Agency branding

Status: Agency name and architectural A logo update delivered and verified (2026-10-22).

## Goal

Use the user-selected name **Avenor Properties** throughout the current website.

## Scope

Use the shared wordmark, accessible home-link label, public footer and default/template page titles. The user approved an architectural A monogram with wordmark on 2026-10-22. Replace the placeholder house glyph across public pages, login and CRM and add the matching browser icon. Preserve the maroon, ivory and charcoal palette. No package/repository rename, backend configuration or authentication changes.

## User flow

Visitors see Avenor Properties on the public site and staff login; staff see the same shared wordmark in the CRM.

## Contracts and access

Display copy only. No API, data, permissions or session changes.

## Design

Reuse the existing Brand component and semantic colour tokens. The logo is a native editable SVG: a maroon geometric A with a roof-like apex and open doorway, paired with an uppercase serif AVENOR wordmark and a small tracked PROPERTIES subtitle. Keep it legible at small sizes and preserve the native home link and its accessible name. The decorative symbol has empty alt text because the visible wordmark and link label provide the name.

Store the standalone transparent mark and horizontal logo in `public/brand/`; use the mark with live HTML wordmark text in the shared component. A maroon-tile/ivory-mark `src/app/icon.svg` uses Next's file-based icon convention. Do not add image-generation, font-service or icon-package dependencies for vector-native branding. The existing homepage mockup remains historical design reference, not an asset to overwrite.

## Acceptance criteria

- [x] Current rendered branding and browser titles use Avenor Properties.
- [x] Existing layout, navigation and authentication behavior remain intact.
- [x] Current logo lint, typecheck, unit and production-build checks pass.
- [x] Project documentation records the chosen name.
- [x] Shared public, login and CRM branding shows the approved architectural A and wordmark without overflow at 360px/desktop widths.
- [x] Editable SVG mark/logo and matching browser icon load successfully; existing public/login home-link labels remain accessible.

## Validation

Run frontend lint, formatting, typecheck, unit tests and build. Check live public/login and authenticated CRM branding, titles and horizontal overflow at desktop/mobile widths. Confirm the public SVG assets and the file-based icon return successfully. Static copy changes do not require new implementation-mirroring tests.

## Rollout and risks

No migration or configuration changes. The historical homepage mockup remains illustrative. Revert the shared `Brand` component and the mark, horizontal-logo and icon assets together to undo this change.

## Implementation evidence

Previous name-change evidence: `bun run check` passed linting, formatting, TypeScript checking, 39 unit tests and the production build. Chromium smoke checks passed at 1440px and 390px for `/` and `/login`: each page exposed the Avenor Properties home-link label and browser title without horizontal overflow.

Architectural A logo evidence: the shared `Brand` source imports `/brand/avenor-mark.svg` and is rendered by the public header/footer, login and CRM layouts. The delivered native SVG files are `public/brand/avenor-mark.svg`, `public/brand/avenor-logo.svg`, and `src/app/icon.svg`; no branding package or external font service was added. Frontend lint, typecheck and 51 unit tests passed. Browser checks at 360px, 390px, 1280px and 1440px covered `/` and `/login`, including loading mark/favicon, home-link access, visible wordmark and no horizontal overflow (eight route/viewport checks). Authenticated CRM checks at 360px and 1440px used an isolated disposable backend and confirmed the loaded A logo, preserved home link and no horizontal overflow (two checks). The three SVG resources returned HTTP 200. `bun run build` passed and included the file-based `icon.svg`; a root-level visual review inspected the rendered logo preview. The normal development backend and frontend were restored after the fixture closed. The historical homepage mockup remains illustrative.
