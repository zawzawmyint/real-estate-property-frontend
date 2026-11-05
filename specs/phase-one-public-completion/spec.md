# Phase 1 public website completion

Status: In progress — homepage implementation is present. November 5 remediation has verified repository checks, clean serial browser, exact-data dashboard and guarded normal-runtime evidence; broader P1-14/P1-18 acceptance and roadmap closure remain pending.

The [cinematic maroon homepage redesign](../public-homepage-redesign/spec.md) defines the current homepage visual composition, including the approved editorial guidance photo, and supersedes this specification's earlier composition instructions. This specification remains authoritative for its broader P1-14/P1-18 regression, responsiveness and inquiry acceptance; neither checklist item is complete.

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
- Guidance is a local semantic homepage section, with an `h2`, the proposed copy and two native links. Its current composition and approved editorial photo follow the [homepage redesign specification](../public-homepage-redesign/spec.md). Reuse the existing approved asset; do not crop a reference screenshot into production imagery or require a new image to close Phase 1.
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

- The authorized approach retains the existing homepage direction, its approved editorial guidance photo and explicit empty state, and addresses defects demonstrated by the public mobile pass. A full redesign remains outside this delivery.
- The user approved implementation of this specification on 2026-10-30. New sections or a different visual direction still require updating this spec first.
- Global featured-query fault rules and shared authentication caches can interfere under parallel testing. Run those acceptance cases in isolation and require a clean serial regression, rather than increasing timeouts without diagnosis.
- Broader CRM/test failures discovered during the release gate must be diagnosed and resolved or explicitly recorded as blockers; do not expand the public feature silently or claim Phase 1 complete.
- Rollback: revert the homepage/presentation changes and their focused tests together. Existing APIs/data remain compatible; no data rollback is required.
- Implementation plan: [Phase 1 public completion](../../docs/superpowers/plans/2026-10-30-phase-one-public-completion.md).

## Implementation evidence

### November 5 final remediation evidence

- The initial valid serial run reached 183 passes and 10 intentional skips before a two-photo maximum-title dialog autofocus case scrolled Close from view. The minimal initial-focus fix retained dialog trap/return-focus behavior, then passed focused coverage (two passes, two intentional skips).
- The final dirty candidate is frontend HEAD `7a97dbb` plus digest `2d71f35e4b630c5782f6b0c692aaa9b1b89d25627c0f19cfa3420aefe439c28f`, with backend HEAD `3690d3a` plus digest `20f08ac413902b9358ca1e26f470a1d618c6136d4af6455fd2d0d59257813c5c`; neither identifier claims a commit.
- Final frontend `bun run check` passed API validation, lint, formatting, typecheck, 297 unit tests in 47 files and build. The fresh serial run passed 341 cases with 65 intentional skips and no failures (406 registered, 24.0 minutes); the separate exact-data dashboard run passed 16/16 in 1.3 minutes.
- Guarded normal runtime used the actual frontend checkout on port 3100 with normal backend public reads only through a proxy that blocked writes, cookies and authorization. Gallery focus/arrows/Close and empty-inquiry validation passed; browser and DevTools errors were empty. This is not normal-backend mutation evidence. P1-14/P1-18 remain unchecked and F08 remains open pending an authorized scoped commit.

The [Phase 1 release verification plan](../../docs/superpowers/plans/2026-11-04-phase-one-release-verification.md) tracks the remaining acceptance on the merged release candidate. Every subsection through “Regression stabilization evidence” below is a dated November 4 record, not a current status statement. The November 5 remediation specification records the later completed serial-browser, dashboard and guarded-runtime checks; Git delivery remains pending. Keep P1-14 and P1-18 open until their complete acceptance is verified.

### Focused release verification (2026-11-04)

- Candidate frontend `7a97dbb` and backend `3690d3a`. Port 3100 was occupied, so browser checks used an isolated frontend copy on port 13100, the test proxy on 4312 and a disposable backend on 14311. The scratch Playwright configuration pointed at the alternate origin and omitted the standard server startup and warmup. After correcting the fixture's advertised media origin, real property photos loaded. This does not satisfy the normal-runtime port 3100 gate.
- A serial run of `homepage-redesign.spec.ts` and `public-component-reuse.spec.ts` passed 22 cases with eight intentional project skips. It covered Buy and Rent searches and URL criteria, invalid budgets, featured pending/zero/success/failure and retry, decorative photo failure, and public form validation. Injected featured-state cases ran on desktop as designed.
- A separate serial run of `public-completion.spec.ts` and `public-reduced-motion.spec.ts` passed eight cases with six intentional project skips. It covered homepage guidance, featured-state recovery and reduced motion. The combined viewport test was excluded because the independent sweep below covered the full matrix. Maximum-length acceptance was pending at that checkpoint; the later November 4 retry recorded a pass. November 5 adds focused gallery verification, while complete acceptance remains subject to the current serial gate.
- All 36 combinations of six public route shapes and six widths fit without horizontal overflow or offscreen measured controls. Reviewed 13 page and six overlay captures. At 320px and 390px, menu, filter and gallery focus handling passed and gallery arrow navigation loaded the second photo. As observed in this November 4 run, the gallery visually truncated its title at these widths; the November 5 remediation removed that truncation and its focused checks passed. Responsive measurements and captures are under local `.delivery-work/phase-one-release-responsive/`.
- The native zoom suite passed in installed Chrome with one intentional mobile skip. Its isolated profile changed the viewport from 1280 to 640 CSS pixels and device-pixel ratio from 1 to 2, while CSS zoom stayed at 1. All six routes fit, navigation and focus checks passed, and their screenshots were reviewed. Local evidence is under `.delivery-work/phase-one-release-native-zoom/`.
- As of this November 4 focused run, the clean serial legacy regression, separate exact-data dashboard run, full quality gates and normal-runtime inspection remained pending. Later November 4 evidence records a dashboard pass and normal-runtime check; the November 5 remediation records the subsequent clean serial run, fresh dashboard pass and guarded runtime checks. Broader P1-14 and P1-18 acceptance remains open.

### Serial regression and dashboard follow-up (2026-11-04)

- Ran the 388 registered desktop/mobile cases with one worker, stopping at the first failure per attempt. Both runs used fresh disposable fixtures and the existing isolated harness on ports 3170, 4371 and 4372 with test-only origin remapping. Candidate application commits were still frontend `7a97dbb` and backend `3690d3a`.
- The first attempt recorded 50 passes and nine intentional skips before the desktop homepage shortcut test exceeded 60 seconds. The trace shows repeated homepage loads consumed about 54 seconds and all seven destination assertions succeeded. The same test passed in 13.5 seconds on the unchanged full retry.
- The retry recorded 184 passes and ten intentional skips before mobile Admin sign-in timed out on the URL assertion, with 193 cases unrun. Sign-in returned HTTP 200 in about 210 ms, then the CRM navigation request remained pending at the assertion deadline. The retry passed the maximum-length property check, public native zoom, width matrix, inquiry persistence and replay, and staff access checks. These results do not satisfy the clean serial regression gate.
- The separate exact-ten-lead dashboard fixture passed all 16 desktop/mobile cases in 2.6 minutes. It covered agency totals, Agent scope, empty/loading/error states, refresh, keyboard use and revoked sessions.
- The unchanged mobile Admin sign-in, refresh and sign-out case passed three serial repeats with a fresh normal fixture. The navigation timeout did not reproduce in this focused run.
- Local logs and traces are under `.delivery-work/`. The normal-port runtime and full quality gates remain open, and both roadmap items stay unchecked.

### Complete serial run and quality follow-up (2026-11-04)

- The same candidate completed all 388 registered cases in the isolated development harness with one worker and no early stop. Playwright reported 318 passes, 65 intentional skips, and five failures in 37.3 minutes. The prior homepage shortcut and mobile Admin sign-in failures both passed in this run. The dashboard was skipped in the legacy fixture by design, with its separate 16-case pass recorded above.
- The five failures were a missed intermediate hover-animation frame on the public property link, a timeout navigating to CRM Tasks after the public assertions passed, an HTTP 429 during the gallery fixture Manager sign-in, a mobile CRM Properties navigation timeout, and a mobile CRM inventory horizontal-overflow assertion after expanding filters. The 429 included a 141-second retry delay, consistent with the shared fixture account reaching its sign-in limit. The layout assertion remains a reproduction target.
- API contract drift, ESLint and all 297 unit tests passed. Prettier reported 127 files. An in-memory check confirmed that 126 pass after CRLF normalization. The other warning was an untracked review document. The canonical formatting gate remains open.
- Route type generation, TypeScript and the production Webpack build passed in an isolated copy of the candidate. The build generated all 18 static pages.
- The normal runtime check passed on port 3100. The current checkout rendered three featured properties and a hydrated Buy search returned eight sale listing links. With the result page open, Next.js DevTools confirmed the checkout and both routes and reported no configuration or session errors. The browser logged no warnings or errors, and backend health on 4311 returned `status: ok`.

### Regression stabilization acceptance

- Keep the desktop and mobile browser assertions intact. Wait for observable navigation, animation, and responsive layout state so timing in the development harness does not determine the result.
- Seed a dedicated disposable Manager for the gallery photo scenarios. Verify real sign-in and gallery behavior with the existing rate limiter enabled.
- Use LF for tracked frontend text on checkout, including on Windows. Prettier must pass for the tracked candidate and the Phase 1 documentation.
- Run the complete serial browser suite with a fresh fixture and no early stop. Record any failure and leave the two roadmap items open unless their acceptance passes.

### Regression stabilization evidence (2026-11-04)

- The isolated fixture now provisions `e2e-gallery-manager@example.com`, so the gallery scenario no longer shares the property worker's rate-limited Manager session. Five sign-ins to the shared Manager reproduced its limiter response; the dedicated Manager signed in with HTTP 200 and created a property with HTTP 201. Backend fixture TypeScript and scoped formatting checks passed.
- The hover assertion now installs its `pointerenter` animation sampler before the pointer moves. The public-route smoke check waits for DOM content to load, then requires one visible `h1`, avoiding the duplicate streamed Contact heading observed when it sampled at response commit. The CRM inventory test covers a maximum-length location at 320px and 390px; inventory cards now wrap an unbroken community/city value instead of widening the document.
- Focused desktop hover and gallery coverage passed 2/2. After the readiness update, the Contact/Tasks smoke coverage passed four serial repetitions, two in each browser project.
- The initial full stabilized serial run completed in 31.2 minutes with 322 passes, 65 intentional skips and one failure: the mobile Contact route temporarily exposed two `h1` elements while streaming. All five original regression failures passed. A clean rerun was still pending at that checkpoint; the later November 5 clean-run evidence supersedes that limitation. This historical attempt does not close P1-14 or P1-18.
- Frontend API drift, lint, all 297 unit tests, TypeScript and the isolated production build passed. The tracked frontend line-ending normalization and `.gitattributes` eliminate the 126 CRLF-only formatter warnings. The current complete formatter command still reports only the separate untracked `docs/reviews/2026-11-04-project-review.md`; that artifact was not changed as part of this delivery.

### Historical 2026-10-30 implementation evidence

The following records the 2026-10-30 candidate state and branch name. It is not a current branch/clean-tree claim. No acceptance checkbox or roadmap completion is claimed from this evidence alone.

- Homepage guidance/empty-state and long-content regressions were observed failing before the relevant code changes. The final focused run used one worker with a fresh disposable fixture: 11 cases passed, 9 intentional project skips and no failures in 3.2 minutes. It covers homepage states, the public width matrix, maximum-length property data and all three reduced-motion cases. This is focused evidence, not a clean serial legacy regression.
- The automated native-zoom case passed in the focused run: an isolated temporary Chrome profile changed the 1280px CSS viewport at DPR 1 to 640px at DPR 2 while CSS zoom remained 1. `PUBLIC_BROWSER_EXECUTABLE` selected installed Chrome for this test-only run because bundled full Chromium could not launch in this environment; the user profile was not used or changed.
- The frontend `bun run check` gate passed API drift, lint, formatting, strict types, 271 unit tests across 46 files and the production build. The final production source includes the sheet-motion fixes.
- Next DevTools identified the expected frontend checkout on port 3100 after the normal preview was restored. With a user-facing browser tab open at `/#guidance-heading`, `get_errors` returned empty configuration and session errors and page metadata included that route and `/`.
- The homepage-only budget grid now stacks below 400px; listing filters are unchanged. A normal-preview visual smoke found field widths of 127px at 1440px, 282px at 390px and 212px at 320px, with all fields fitting and no document overflow. Before the change, the 320px layout had 83px of usable space for 103.55–107.86px required fields and clipped. Review captures are `outputs/phase-one-public-completion/homepage-desktop.png`, `homepage-mobile.png` and `homepage-small-mobile.png`.
- Detailed working logs and review captures are local workspace artifacts under `.delivery-work/public-completion/` and `outputs/phase-one-public-completion/`. The normal serial legacy run was interrupted early to restore the preview, and the dedicated dashboard fixture was not run in this delivery; neither is represented as passing release evidence. Final visual review across every acceptance route/state, clean serial legacy regression and separate dashboard acceptance remain required.
