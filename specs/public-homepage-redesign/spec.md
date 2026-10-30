# Public homepage redesign — cinematic maroon

Status: Verified frontend presentation delivery on 2026-10-30. The user selected the latest refinement option 3. This verifies this redesign specification only; P1-14/P1-18 remain unchecked because their broader Phase 1 acceptance is separate.

## Goal

Make Avenor's public homepage feel deliberately designed and complete through stronger composition, varied sections and prominent property search, while retaining existing backend contracts and public journeys.

## Scope

Included:

- Redesign `/` to match the [selected visual reference](reference.png): maroon photo-overlay hero, search dock, asymmetric featured homes, property-type links, community tiles, agency guidance and expanded charcoal footer.
- Restyle the existing public header and footer consistently across public routes. Interior page content remains unchanged; login and CRM retain their current presentation.
- Desktop, tablet and mobile layouts, keyboard access, reduced motion, image fallbacks and existing loading/error/empty handling.
- Local optimized decorative photography and source/provenance notes. The reference is a composition target, not a source of production listing data.

Excluded: backend code, endpoints, schema, permissions, environment changes, new dependencies, CMS, saved properties, maps, reviews, statistics, mortgages, new pages, new contact channels and deployment.

This is a new presentation specification following the earlier [Phase 1 public completion](../phase-one-public-completion/spec.md). On implementation it supersedes that spec's homepage visual composition only. Its outstanding public responsiveness, inquiry and regression acceptance remains required. Existing uncommitted work must be preserved and reconciled, not overwritten. P1-14/P1-18 remain unchecked until their complete acceptance is verified.

## User flow

1. Arrive at `/`; identify the agency and select Buy or Rent in the visible hero search.
2. Enter optional location, property type and budget; submit to existing URL-driven `/properties` results. Default purpose is Buy (`sale`). Budget retains independently editable minimum and maximum AED amounts, grouped visually under Budget; do not replace this capability with an undefined preset.
3. Open a featured property at `/properties/[id]`, browse all sale properties, or follow a type/community shortcut into existing filtered results.
4. Follow agency guidance to `/agents`, or the closing footer CTA to `/contact`. Footer navigation retains Staff sign-in at `/login`.
5. Search remains usable when featured data fails. Zero, one or two featured records reflow naturally without duplicated or fabricated listings. Loading reserves meaningful space; errors offer the existing retry/browse recovery. Broken decorative images retain readable text and links; listing image failures use existing PropertyImage handling.

## Contracts and access

- Anonymous public access only. Express continues to own eligibility, data validation, permissions and persistence.
- Preserve `getPublicProperties("featured=true&pageSize=3&sort=newest")` in `src/lib/api/server.ts`; share the request rather than adding reads for decorative sections.
- Consume `PropertyList<PublicPropertySummary> = {items,total,page,pageSize}`. Summary fields are `id,title,purpose,type,priceFils,city,community,bedrooms,bathrooms,areaSqft,coverPhoto,isDemo`; photos are `{id,url,width,height}`. Use existing generated types and price/area/bedroom formatters.
- Existing backend-owned contract: `backend/docs/api/openapi.yaml` in the companion checkout; repository-local [contract snapshot](../../docs/contracts/properties.md). No contract changes are proposed.
- Search keeps existing `purpose`, `location`, `type`, `minPriceFils`, `maxPriceFils`, `sort`, `page` and `pageSize` query semantics, validation and AED-to-fils conversion. Omit empty values; reset page on filter changes. Preserve hydration readiness and pending feedback.
- Property-type links target `/properties?purpose=sale&type=apartment`, `villa`, `townhouse` or `penthouse` respectively. Community links use `/properties?purpose=sale&location=Dubai%20Marina`, `Downtown%20Dubai` and `Palm%20Jumeirah`. These are fixed browsing shortcuts, not live counts or availability claims. The UI must make the sale scope clear.
- No community API, autocomplete API, agent API or new write is required. Community/type copy and decorative imagery are frontend-owned. Guidance links to the existing directory instead of inventing agent assignments.
- Public output must not expose owners, staff-only fields or credentials. Preserve demo badges and illustrative-imagery disclosures for sample inventory; do not publish reference prices as inventory.

## Design

### Visual authority and section order

The [reference](reference.png) is the third image in the latest three-image refinement set, not the third original concept. Retain its proportions and rhythm, adapting generated text artifacts to real accessible controls. Use the existing architectural A logo, self-hosted Lora display and Poppins UI; maroon `#701f35`, ivory `#faf8f5` and charcoal `#252329`.

1. **Header:** maroon surface, inverse logo, visible Buy/Rent/Our agents/Contact links; existing mobile drawer and route-current state remain functional.
2. **Hero:** wide architectural photograph with maroon overlay strongest on the left; ivory headline “Find your place in Dubai.” and short supporting text. Desktop header/hero/search together fit within a 1440 × 900 first viewport. Keep body text at least 14px. Avoid an autoplay carousel or video.
3. **Search dock:** light panel straddling the hero base, with Buy/Rent on its own top row and grouped labelled fields below. At desktop, location, type, Budget group and search action share a 48px control baseline. Keep the Budget (AED) group visibly named; preserve accessible independent minimum/maximum labels and their visible Min. price/Max. price placeholders. Retain existing search behavior and the annual-rent/total-sale clarification.
4. **Featured homes:** “Homes worth discovering.”; one large lead property on the left, two smaller stacked properties on the right at desktop. Display live title, formatted price, community/city, beds, baths and area. Supporting-card titles and prices occupy separate rows. With three records, the lead photograph grows to the paired-card stack so their detail bottoms align; do not impose a fixed lead height. One- and two-record states retain explicit independent rows. Reuse property presentation/formatters, with a homepage-specific layout treatment that does not alter CRM or results cards. “View all properties” retains its explicit sale destination.
5. **Property types:** quiet four-column text row titled “A home for every way of living”; Apartments, Villas, Townhouses and Penthouses with brief descriptors and working sale-filter links. No additional photo grid here.
6. **Communities:** “Explore Dubai, neighbourhood by neighbourhood.”; three equal rectangular photographic tiles, Dubai Marina, Downtown Dubai, Palm Jumeirah, readable labels and descriptive links. Any trailing browse link goes to `/properties?purpose=sale`; do not invent an area-directory route.
7. **Guidance:** light ivory split section, agency-advice image left and “Good homes. Better guidance.” right with “Meet our agents”. Keep a Contact route reachable in this section as well to preserve the existing guidance journey.
8. **Footer:** charcoal closing band “Let’s find your next chapter.” with Contact us; inverse brand, Buy/Rent/Our agents/Contact plus quiet Staff sign-in, divider and current-year copyright. Do not create nonworking legal/social links or invented contact details from the mockup.

### Reuse, responsive behavior and accessibility

- Keep App Router entries thin. Coordinate homepage-only sections in a focused module under `src/features/properties/public/`; fixed community/type content may live alongside that composition. No CMS or generalized page builder.
- Reuse PublicSectionHeader, PublicSearchPanel, PropertyFilters, PropertyImage, existing Button/link styling, labelled fields, NavigationPending and image/loading/error primitives. Add a scoped homepage card layout only where the existing card cannot represent the selected composition.
- Add explicit inverse Brand styling usable by public header/footer; default brand behavior in login/CRM must remain unchanged. Scope dark surface tokens to public components rather than changing global primary/foreground values.
- Mobile: stacked hero copy/photo and search controls in normal document flow, single-column property sequence, wrapping type links, stacked community tiles and guidance, wrapping footer. No horizontal carousel or hidden required controls. Tablet can use two columns where space permits.
- Verify 320, 390, 768, 1024 and 1440px widths. Preserve reading order, one H1, sequential headings, main/section/navigation landmarks, skip link, visible labels, 44px action targets and visible focus against both light/dark surfaces.
- Check WCAG AA text contrast, including overlay text and subdued links; generated mockup colors are not proof of contrast. Support 200% zoom and reduced motion. Decorative images have empty alt text; listing images and links retain useful accessible names.
- Reserve image dimensions, optimize image sizes, prioritize only the hero/LCP image and lazy-load below-fold imagery. Use an independent local hero so featured-data failure does not remove the banner. Source/generate individual assets; never ship a crop of the reference screenshot as interactive UI or photo assets.

## Acceptance criteria

- [x] Homepage matches the selected composition and section order at desktop, with all hero search controls available in the initial 1440 × 900 viewport.
- [x] Buy/Rent, location, type and both price bounds produce valid existing results URLs and correct sale/annual-rent units.
- [x] Featured layouts handle 0/1/2/3 records, request errors, loading, broken media and long content without fabricated cards or lost recovery.
- [x] Property-type/community shortcuts, featured cards, header, guidance and footer links reach existing routes with the specified filters.
- [x] Demo disclosures and server-only transport/permissions remain intact; no backend or dependency change is needed.
- [x] Public header/footer are consistent across public pages; login/CRM branding and interior content retain existing behavior.
- [x] Layouts have no horizontal overflow at specified widths or 200% zoom; keyboard, mobile menu, labels, focus, contrast and reduced-motion checks pass.
- [x] Optimized assets, source notes and image sizing/loading policy are present; the hero survives featured API failure.
- [x] Required frontend gates, focused browser checks, public regressions and runtime inspection pass with recorded evidence; specs and tracker status are reconciled accurately.

## Validation

Extend existing public browser cases for search, guidance, image failure and viewport coverage. Add redesign-specific checks for shortcut destinations, featured counts and inverse header/footer. Prefer browser/visual checks over tests that merely assert CSS class names. Compare accepted reference and implementation captures together at matching desktop dimensions, then inspect mobile captures separately.

Run `bun run check` (API drift, lint, formatting, typecheck, unit tests, production build), focused Playwright cases and the public regression suite with the documented disposable backend fixture. Follow `docs/development.md` for the backend on 4311 and test proxy on 4312. Verify Next DevTools project identity on 3100, open the affected routes and inspect runtime errors/page metadata. Do not stop unrelated servers or run a production build over an active owned dev server.

## Rollout and risks

No migration/configuration rollout is required. Deliver as a frontend reviewable change; deployment is separate. Rollback should revert only this delivery's frontend/asset changes while retaining pre-existing public-completion work.

Risks: oversized imagery/LCP, insufficient overlay contrast, accidental changes to shared property cards or default Brand, and loss of pending public-completion work. Mitigate with optimized independent assets, contrast measurements, scoped treatments and explicit diff review. Reference geography/photography is illustrative, not evidence that a depicted home exists.

No blocking product decisions remain for implementation. Exact asset selection, responsive spacing and accessible Budget-control details are implementation decisions constrained above.

## Implementation evidence

### Annotation follow-up — 2026-10-30

The user's browser review identified uneven search-control baselines and unbalanced featured-card geometry, which the earlier visual review had missed. Repair scope: keep Buy/Rent on its own dock row, align all desktop search inputs/actions, retain the visible Budget group and accessible independent bounds, and size the lead featured photo from the paired cards rather than fixed independent heights. Property titles and prices must use separate readable rows on the narrow supporting cards. Preserve all search/data contracts, disclosures, responsive states and unrelated sections. Verify at 1480 × 808, 1196px and mobile widths; add geometric regression coverage before marking the repair complete.

The repair establishes a uniform 48px baseline for all five dock controls at normal-browser 1480 × 808 (previous baseline difference: 21.25px). At the same viewport, the lead card's content bottom equals the third card's bottom within 0.001px. New focused coverage covers dock alignment and featured one/two/three-record states, including the corrected flex-column loading lead. The focused 38-case run passed 26 cases with 12 intentional skips and no failures. After the final one/two-row CSS refinement, all seven dedicated desktop alignment/state cases passed: they cover 1480/1196/1024 control and metadata geometry, a loading skeleton taller than 100px, 0/1/2/3-record content-bottom/no-unused-space states at 320/390/768/1024/1440, and failure retry. API drift, lint, formatting, type checks, 271 unit tests and an isolated production build passed. Normal port 3100 in-app-browser inspection at 1480 × 808 independently confirmed the five equal control positions/heights and the 0.001px featured-card alignment; with the homepage open, runtime configuration and session errors were empty and page metadata confirmed `/`. Reviewed captures include `outputs/homepage-alignment/search-repaired.png` and `outputs/homepage-alignment/repaired-sections.png`. The earlier 122-case browser result remains historical delivery evidence and is not represented as rerun for this correction.

The frontend implementation adds the homepage composition, scoped public shell treatments and five locally optimized WebP editorial assets with provenance at [public/images/homepage/README.md](../../public/images/homepage/README.md). It retains the existing property request, URL filter semantics, server-only transport and backend contract; there is no backend, schema, permission, configuration or dependency change.

The constituent `bun run api:check`, `bun run lint`, `bun run format:check` and `bun run typecheck` checks passed. The unit suite passed 271/271 cases under its loopback-enabled execution; a sandbox-only transport restriction produced four false failures in a separate run. An isolated production build from a source snapshot passed without disturbing the running development server. Next DevTools on normal port 3100 identified the expected checkout; with the homepage open, configuration and session errors were empty and page metadata covered the affected routes.

Implementation review corrected the mobile stacked hero, featured loading treatment, visible Budget group, and image dimensions/provenance. [Visual QA](design-qa.md) passed after comparing the selected reference with desktop/mobile evidence; it found no unresolved P0/P1/P2 visual issue. The final 122-case browser run passed 102 cases with 20 intentional skips and no failures in 7.3 minutes. It covered the selected public and property integration suite at desktop/mobile widths, real 200% zoom, long content/reduced motion, featured 0/1/2/3/loading geometry, and search, navigation and inquiry safeguards. A separate modified `loading-states` regression passed 4 cases with 2 intentional skips and no failures. Final desktop/mobile capture regeneration passed 2 cases with 2 intentional skips; stable captures are in `outputs/homepage-redesign/final-captures/`. The 122-case run used a scratch preview on port 13100: its test-only origin adaptation replaces hard-coded port 3100 expectations in the scratch test copy and maps only the 13100 origin through the scratch proxy to the port 3100 fixture; it does not alter the original server. It is therefore not evidence of a normal-port-3100 integrated browser run. The normal port 3100 runtime evidence above is limited to the clean DevTools inspection. No deployment is claimed. See the [implementation plan](../../docs/superpowers/plans/2026-10-30-public-homepage-redesign.md).
