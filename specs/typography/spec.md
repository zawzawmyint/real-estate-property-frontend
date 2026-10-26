# Poppins and Lora typography

Status: Verified
Date: 2026-10-23

## Goal

Use a small, self-hosted type system that keeps the public site and CRM legible while giving public display text and the Avenor wordmark a distinct face.

## Scope

- Poppins 400, 500 and 600 supplies UI, body, form, navigation and CRM typography.
- Lora variable 400–700 supplies public display text and the Avenor wordmark; the current wordmark uses 400.
- `next/font/local` loads both local families and exports the CSS variables consumed by the shared type tokens.
- Font sources, license copies and provenance are kept in [`src/app/fonts/README.md`](../../src/app/fonts/README.md).

Excluded: a runtime font provider, a font package, a third authored family, route/content changes and API, authorization or configuration changes.

## Contracts and access

Typography is presentation-only. It changes no API, data, cookie, permission, persistence or environment contract. Browser font requests remain same-origin and require no Google Fonts request.

## Acceptance criteria

- [x] Public, login and CRM UI/body text uses self-hosted Poppins at only the supplied 400/500/600 weights.
- [x] Public display text and the shared wordmark use self-hosted Lora.
- [x] The project uses two authored font families, within the requested three-family maximum, and retains readable fallback behavior during loading.
- [x] Original assets, SIL Open Font License 1.1 copies and pinned source provenance are documented.
- [x] Existing responsive navigation, forms and display hierarchy remain usable in the verified Chromium coverage.
- [x] Browser evidence confirms the updated large-screen public-hero text gutter at 1024px and 1440px.

## Validation

On 2026-10-23, API generation validation, ESLint, Prettier, Next route type generation plus `tsc`, 90 unit tests and isolated production Webpack builds passed. Browser computed-style assertions confirmed Poppins on homepage body, login and CRM, and Lora on the homepage display heading. Desktop/mobile Chromium validation covered layout at the delivery widths and a 200% CSS layout-scale check. A focused public-header/hero-gutter test passed at 1024px and 1440px with at least a 24px glyph-to-image gap; its duplicate mobile sweep was skipped.

## Limits and rollback

Native browser zoom and Safari were not tested; this does not claim a complete accessibility audit. Remove the `next/font/local` imports and corresponding font-token mappings together to roll back the change.
