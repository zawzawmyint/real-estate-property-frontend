# Phase 1 public website completion

Status: In progress — implementation authorized on 2026-10-30. Homepage completion, long-content wrapping and reduced-motion code changes are prepared and under verification; final acceptance and roadmap closure remain pending.

The [cinematic maroon homepage redesign](../public-homepage-redesign/spec.md) supersedes this specification's homepage visual composition and guidance presentation. This specification remains authoritative for its broader P1-14/P1-18 regression, responsiveness and inquiry acceptance; neither checklist item is complete.

## Goal

Finish the existing Avenor homepage and verify the complete public journey on mobile, closing roadmap P1-14 and P1-18 only after acceptance passes. This is a proposed completion of the existing design, not a new website direction.

## Scope

Included:

- P1-14: retain the working hero, Buy/Rent search and featured collection; complete the agency-guidance section shown in the [selected reference](../../docs/design/homepage-maroon-ivory-charcoal.png), with navigation to the existing agent directory and Contact page.
- P1-18: inspect and resolve concrete responsive/accessibility defects across `/`, `/properties`, `/properties/[id]`, `/contact`, `/agents`, `/agents/[slug]`, shared public navigation/footer, gallery, filters and inquiry forms.
- Explicit homepage loading, empty, request-failure and image-failure acceptance; preserve existing inquiry safeguards and URL-driven filters.
- Focused browser evidence, a clean regression gate, and synchronized roadmap reconciliation.

Excluded: new backend endpoints/schema, staff CRM redesign, new dependencies, a CMS, favorites, testimonials, invented agency statistics, About/Privacy pages, new contact channels, Phase 2 enhancements, hosting/deployment, demo-login changes and portfolio case-study work. Deployment remains a separate requirement before the Phase 1 release can be declared complete.

## User flow

1. A visitor opens `/`, reads the hero and searches for sale/rental properties using the existing fields. Valid search navigates to `/properties` with matching URL filters; invalid budgets retain input and show associated errors.
2. Featured results contain up to three eligible properties from the existing query. A card opens its detail page; the existing View all properties destination remains `/properties?purpose=sale`.
3. Below the featured region, an agency-guidance section introduces the service without unsupported claims. Proposed copy: heading “Good homes. Better guidance.”; body “Explore our property collection and meet the people who can help with your search.”; links “Meet our agents” to `/agents` and “Contact us” to `/contact`.
4. From listings, visitors can refine/reset filters, paginate, reload the URL, inspect a gallery and submit a property inquiry. Contact supports the existing property-independent inquiry. Agent directory/profile navigation remains available through the header/footer and homepage guidance.
5. When featured data is delayed, hero text, search and guidance remain outside its pending boundary. No results produces an explicit “No featured homes right now.” message with “Browse properties” linking to `/properties`; do not manufacture featured inventory. A failed read retains search/guidance and the existing retry feedback. A failed image shows the existing accessible placeholder without hiding navigation or property facts.
6. Inquiry success, validation, pending, unavailable-property, rate-limit and uncertain-save/reconciliation states retain their existing contracts; layout fixes must not add automatic write retries or duplicate submissions.

## Contracts and access

- Frontend-only product changes. Express continues to own publication eligibility, inquiry persistence, validation and staff authorization. No migration or new runtime configuration is proposed.
- Preserve anonymous `GET /api/v1/properties?featured=true&pageSize=3&sort=newest`, `GET /api/v1/properties` with existing filters, and `GET /api/v1/properties/:id`. Responses remain the existing public collection/summary/detail DTOs, including `isDemo`, photo metadata and pagination; see the [property contract](../../docs/contracts/properties.md) and [OpenAPI snapshot](../../docs/contracts/properties.openapi.yaml).
- Preserve property inquiry `POST /api/v1/public/properties/:propertyId/inquiries` and general inquiry `POST /api/v1/public/inquiries`, including submission IDs, relay, rate limiting, validation and safe acknowledgement. See [leads](../../docs/contracts/leads.md) and [public contact/agents](../../docs/contracts/public-contact-and-agents.md).
- Existing agency/agent reads and their DTOs are unchanged. Static homepage guidance does not add another data fetch or expose unpublished catalog records.
- Backend-owned sources remain `backend/docs/api/openapi.yaml` and its referenced domain contracts. Public HTML, client data and error feedback must not reveal owner contacts, staff/private lead fields or relay credentials.
- Retain demo labels and existing catalog noindex behavior. This delivery does not approve fictional content for real-business publication.

## Design

- Homepage polish (2026-10-30): below 400px, give the minimum and maximum budget fields separate full-width rows so their existing labels and placeholders remain readable. Keep the listing filter layout and desktop homepage composition. Verify the changed homepage widths with fresh screenshots and text-fit measurements; do not rerun unrelated passing suites for this presentation-only change.

- Preserve Avenor branding, maroon/ivory/charcoal tokens, Poppins/Lora typography and the existing public shell. The saved reference guides hierarchy and spacing; illustrative hearts, About/Privacy links and unsupported claims do not become requirements.
- Guidance is a local semantic homepage section, with an `h2`, the proposed copy and two native links. Use a warm neutral surface, generous spacing and existing link/button styles. Default to a text-led layout: the reference's advisory photograph is not a standalone approved asset. Do not crop the screenshot into production imagery or require a new image to close Phase 1.
- Keep the hero/search and featured card composition. Reuse PublicSectionHeader, PublicSearchPanel, PropertyFilters, PropertyGrid, PropertyImage, labelled fields, existing feedback and navigation components. Extract no new generic component unless a second current use exists.
- Verify 320, 375, 390, 768, 1024 and 1440 CSS-pixel widths. No horizontal page overflow, clipped content, overlapping controls or inaccessible offscreen actions. At 320–390px, stack homepage content and keep forms, gallery, filter drawer and navigation usable without horizontal scrolling.
- Primary interactive controls have at least 44px touch height; inline prose links remain readable and keyboard accessible. Focus is visible; drawer/gallery focus trapping, Escape and focus restoration remain correct. Labels and errors stay associated with inputs.
- Verify 200% browser zoom at a 1280px desktop viewport, reduced-motion behavior and readable long titles/locations. Do not hide overflow globally to conceal layout defects. Reserve image/loading space and retain optimized public images; introduce no new client bundle solely for static guidance.

## Acceptance criteria

- [ ] P1-14: homepage hero, working sale/rental search, featured cards, guidance and agent/contact links form one complete public entry page consistent with the selected direction.
- [ ] Search preserves selected criteria in the URL and on reload; invalid min/max budget retains values and identifies the relevant field without navigation.
- [ ] Featured success, delayed, zero-result, request-failure/retry and photo-failure states remain distinct and navigable; search/guidance are usable while data is pending or unavailable.
- [ ] Homepage guidance works without a backend read and introduces no unapproved claims, personal contacts or fabricated imagery.
- [ ] P1-18: all six public route shapes and shared navigation/footer pass the stated width matrix with readable content, operable controls and no horizontal page overflow.
- [ ] Keyboard, drawer/gallery focus behavior, 200% zoom, reduced motion, long-content and form validation/recovery acceptance pass; screenshots are visually reviewed, not merely captured.
- [ ] A public property inquiry and a general inquiry each create exactly one expected CRM lead; existing role/ownership boundaries and sensitive-field exclusions still pass.
- [ ] Frontend quality gates, focused public coverage and one clean serial legacy regression pass. Dedicated dashboard acceptance passes separately under its exact-data fixture. Intentional skips are explained; passes pooled from failing runs do not satisfy the release regression gate.
- [ ] Runtime inspection identifies this checkout on port 3100, with an affected page open and no unexplained runtime/browser errors.
- [ ] Specifications and both roadmaps are reconciled against evidence. P1-14/P1-18 remain unchecked until their respective acceptance is verified; deployment and D-01–D-05 remain independently tracked.

## Validation

- Extend existing browser coverage rather than duplicate established gallery, inquiry and agency tests. Add `tests/e2e/public-completion.spec.ts` for missing homepage/combined-public acceptance. Reuse foundation, properties, loading-states, property-image-loading, public-agency and public-component-reuse suites.
- `tests/e2e/public-long-content.spec.ts` exercises allowed maximum-length unbroken titles and locations against real published disposable properties. `tests/e2e/public-browser-zoom.spec.ts` selects 200% in the full browser's Appearance settings using an isolated temporary profile; it asserts the CSS viewport halves, device-pixel ratio doubles, CSS zoom remains 1 and navigation reflows. It defaults to bundled full Chromium; test-only `PUBLIC_BROWSER_EXECUTABLE` may select an installed Chromium/Chrome binary when the bundled full browser cannot launch. It never uses or changes the user's browser profile. This repeatable check replaces the planned manual zoom step; CSS enlargement remains supplementary coverage.
- Use disposable backend fixtures and deterministic published fictional records, including long content. Scope proxy fault rules to featured reads; release/delete rules in `finally`, and avoid concurrent tests consuming the same global featured rule. Do not test against real CRM data.
- The browser-only proxy may accept `empty: true` exclusively for a featured-property GET rule, incompatible with an injected error status. After release it returns `{ items: [], total: 0, page: 1, pageSize: 3 }` for the homepage query. This deterministic test control does not alter backend data or production behavior.
- Inspect actual page content as well as document width. Capture homepage and representative route/state screenshots using Playwright output paths; review every public route at 320 and 390px plus homepage at 1440px, and inspect other widths for defects.
- Run frontend `bun run check`; focused browser coverage and the normal legacy suite with `--workers=1`; then dedicated dashboard tests with its separately restarted exact-data fixture. Follow [development](../../docs/development.md) and [runtime tooling](../../docs/agent-tooling.md). Run backend checks if backend/test-fixture code changes become necessary.
- Record commands, counts, skips, runtime result and capture locations in Implementation evidence only after execution.

## Rollout and risks

- The authorized approach retains the existing homepage direction, adds the text-led guidance and explicit empty state, and addresses defects demonstrated by the public mobile pass. A full redesign remains outside this delivery.
- The user approved implementation of this specification on 2026-10-30. New sections or a different visual direction still require updating this spec first.
- Global featured-query fault rules and shared authentication caches can interfere under parallel testing. Run those acceptance cases in isolation and require a clean serial regression, rather than increasing timeouts without diagnosis.
- Broader CRM/test failures discovered during the release gate must be diagnosed and resolved or explicitly recorded as blockers; do not expand the public feature silently or claim Phase 1 complete.
- Rollback: revert the homepage/presentation changes and their focused tests together. Existing APIs/data remain compatible; no data rollback is required.
- Implementation plan: [Phase 1 public completion](../../docs/superpowers/plans/2026-10-30-phase-one-public-completion.md).

## Implementation evidence

Code changes are present on `feat/phase-one-public-completion`; verification is in progress. No acceptance checkbox or roadmap completion is claimed yet.

- Homepage guidance/empty-state and long-content regressions were observed failing before the relevant code changes. The final focused run used one worker with a fresh disposable fixture: 11 cases passed, 9 intentional project skips and no failures in 3.2 minutes. It covers homepage states, the public width matrix, maximum-length property data and all three reduced-motion cases. This is focused evidence, not a clean serial legacy regression.
- The automated native-zoom case passed in the focused run: an isolated temporary Chrome profile changed the 1280px CSS viewport at DPR 1 to 640px at DPR 2 while CSS zoom remained 1. `PUBLIC_BROWSER_EXECUTABLE` selected installed Chrome for this test-only run because bundled full Chromium could not launch in this environment; the user profile was not used or changed.
- The frontend `bun run check` gate passed API drift, lint, formatting, strict types, 271 unit tests across 46 files and the production build. The final production source includes the sheet-motion fixes.
- Next DevTools identified the expected frontend checkout on port 3100 after the normal preview was restored. With a user-facing browser tab open at `/#guidance-heading`, `get_errors` returned empty configuration and session errors and page metadata included that route and `/`.
- The homepage-only budget grid now stacks below 400px; listing filters are unchanged. A normal-preview visual smoke found field widths of 127px at 1440px, 282px at 390px and 212px at 320px, with all fields fitting and no document overflow. Before the change, the 320px layout had 83px of usable space for 103.55–107.86px required fields and clipped. Review captures are `outputs/phase-one-public-completion/homepage-desktop.png`, `homepage-mobile.png` and `homepage-small-mobile.png`.
- Detailed working logs and review captures are local workspace artifacts under `.delivery-work/public-completion/` and `outputs/phase-one-public-completion/`. The normal serial legacy run was interrupted early to restore the preview, and the dedicated dashboard fixture was not run in this delivery; neither is represented as passing release evidence. Final visual review across every acceptance route/state, clean serial legacy regression and separate dashboard acceptance remain required.
