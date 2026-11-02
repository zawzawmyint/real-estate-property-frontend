# Public property listings and details redesign

Status: Delivered with a verification limitation — the frontend-only presentation redesign was implemented on 2026-11-02. All recorded acceptance except canonical native-browser 200% zoom has supporting evidence; that zoom check remains blocked by browser-control capability and is not claimed as passed.

## Goal

Bring `/properties` and `/properties/[id]` to the homepage's professional Avenor design standard while making search results visually distinct from the homepage and preserving discovery and inquiry behavior.

## Scope

Included:

- Listings: compact architectural heading treatment, existing search controls in the selected two-row presentation, a single column of horizontal photo/details cards, outlined View property links and existing result count, sort, pagination and recovery states.
- Details: option 1's photo-first composition, prominent title/location/price, property facts, description and existing inquiry form in a desktop sidebar.
- Responsive, keyboard, image, loading/error/empty/not-found and inquiry-state verification.
- Frontend presentation only, using existing contracts, components, fonts and dependencies.

Excluded: homepage redesign, public header/footer redesign, agents/contact/login/CRM interiors, backend implementation, schema/API/configuration/dependency changes, deployment, maps, saved properties, comparison, reviews, mortgage tools, direct WhatsApp/call actions and new booking workflows.

The previous homepage delivery remains authoritative for `/` and the shared shell. This slice does not complete broader P1-14/P1-18 release acceptance or change the roadmap's 28/30 verified count.

## User flow

1. Follow Buy/Rent or homepage search into `/properties`; preserve URL-driven filters and current purpose.
2. Edit location, type, independent minimum/maximum AED budget and minimum bedrooms, then submit. Sort and paginate results without dropping active filters; filter/sort changes reset the page as existing behavior requires.
3. Scan a horizontal result's photograph, price, title, location and facts; follow View property to its details with the current query encoded in `from`.
4. Browse the gallery, read property facts and About this home, then send an inquiry using the existing form and receipt flow.
5. Back to results restores the validated filter query. Invalid/tampered `from` values retain the existing safe fallback.
6. Empty matches, out-of-range pages, invalid filters, slow/failed API reads, failed photos and unavailable properties retain meaningful feedback and recovery. Search remains available while results load or fail.

## Contracts and access

- Backend owns persistence, public eligibility, authorization, validation and inquiries. Anonymous visitors receive published, available properties only; do not expose owner details or staff fields.
- Authority: companion repository `backend/docs/api/openapi.yaml` and `backend/specs/property-management/contract.md`; frontend-local [property contract](../../docs/contracts/properties.md) and [lead contract](../../docs/contracts/leads.md). No changes to those contracts are planned.
- `GET /api/v1/properties` returns `{items,total,page,pageSize}` with `PublicPropertySummary = {id,title,purpose,type,priceFils,city,community,bedrooms,bathrooms,areaSqft,coverPhoto,isDemo}`.
- `GET /api/v1/properties/:id` returns `PublicPropertyDetail = PublicPropertySummary + {description,photos}`. `Photo = {id,url,width,height}`; array order defines cover/gallery order.
- Preserve filters `purpose`, `location`, `type`, `minPriceFils`, `maxPriceFils`, `minBedrooms`, `sort`, `page`, `pageSize`; public sorts are `newest`, `price_asc`, `price_desc`. Keep existing validation, empty-value omission and exact AED-to-fils conversion. Rent is annual; sale is total price. Bedrooms means minimum bedrooms, with Studio represented by zero.
- The selected listings mockup contains paragraph previews, but summaries have no description. **Omit previews and rebalance the information area; do not fetch each detail to populate cards, fabricate copy or expand the backend DTO.**
- Property facts use existing fields only. Omit mockup furnishing and unsupported amenity/agent/license facts. Do not add previous/next-property navigation from the detail mockup.
- Keep the existing feature-owned Server Action and `POST /api/v1/public/properties/:propertyId/inquiries` contract. Preserve name, phone/email contact rules, message rules, submission IDs, validation, duplicate guard, 404/429 handling and uncertain-response receipt recovery. Never automatically retry writes or expose lead IDs.
- Continue server-only reads through existing transport and generated contract types. No cross-repository imports or new API requests for artwork.

## Design

### Visual authority

- Listings: [selected latest refinement](listings-reference.png). This is the single-column horizontal layout with outlined actions and fine architectural linework. Earlier three-column cards, photographic hero, circles and ellipses are superseded.
- Details: **right-hand page only** of [original option 1](detail-reference-pair.png). Its left-hand listings page is explicitly superseded by the listings reference above.
- These images define composition, not inventory, field availability or production artwork. Use live API values, existing demo disclosures and contract-safe adaptations documented here.
- Retain maroon `#701f35`, warm ivory `#faf8f5`, charcoal `#252329`, self-hosted Lora display and Poppins UI. Shared header/footer remain as delivered, including existing navigation and Staff sign-in.

### Listings

- Compact breadcrumb, one H1 and practical supporting copy; heading reflects Buy/Rent rather than always claiming sale. No photo hero or homepage-like overlay.
- A restrained blush-colored banner spans the viewport directly beneath the public header and fades into the page background at its base. Use the locally optimized decorative facade illustration as a large, intentionally cropped architectural backdrop on its right side, with readable text aligned to the existing content container. No circles/ellipses or UI-screenshot background. At desktop, the art fills the banner height at 70% width with 360px intrinsic height (300px on mobile), reduced opacity and intersecting horizontal/vertical masks that fade its left and bottom edges; it must not show a floating baseline or hard clipped bottom. Preserve the 28px-overlapping search dock and keep decoration out of accessibility/navigation.
- Preserve the chosen search panel's two-row desktop rhythm, Buy/Rent emphasis and uniform 48px input/action baseline. Location remains free text rather than introducing autocomplete. Price bounds remain editable numeric AED fields, not undefined preset dropdowns from generated imagery.
- Use **one sort control** in the results toolbar, reusing existing `PropertySort`; the selected image's duplicate sort in the search dock is not a requirement. Keep the remaining dock arrangement and an accessible Budget (AED) group with independent visible minimum/maximum labels and annual-rent/total-sale clarification. Hide the redundant group heading visually on listings; explain that Buy/Rent choices update results after Apply filters.
- Desktop results use one full-width horizontal card per row with photograph on the left and information on the right. Price and title occupy separate rows; then community/city, type/purpose and beds/baths/area, with the outlined maroon View property link aligned near the lower edge. Keep meaningful space without reserving an empty paragraph block.
- Reuse property presentation and formatters. Avoid nested interactive links/buttons: View property is navigation, not a form button. Preserve accessible names, visible focus and existing pending feedback.
- Reserve photo space; use actual cover images and current unavailable-image treatment. Keep visible demo/illustrative labels wherever `isDemo` is true; never label ordinary inventory as demo.

### Property details

- Back to results above a dominant photo mosaic: large cover on the left, supporting photos on the right and a dark, camera-labelled View all photos action. The sale/rent badge sits on the cover. For 1/2/3/4/5+ photos, reflow available photos without duplicate/fabricated tiles or empty decorative slots. Missing/broken images retain safe feedback.
- Below gallery: type and demo labels, large Lora title, community/city, prominent maroon AED price and readable beds/baths/size strip with icons. About this home is followed by a semantic Property details definition list containing only supported type, location, bedrooms, bathrooms and property size. It uses two columns from 640px and one column below that breakpoint.
- Reuse `PropertyInquiryCard` on the right at desktop and after property content on mobile. Remove repeated property title/location from the card and let its complete form flow with the page; do not constrain it to a viewport-height internal scrollbar.
- Preserve existing gallery dialog keyboard operation, selected-photo navigation, Escape, focus trap/return and photo count. Never inject descriptions as HTML.

### Reuse and responsive behavior

- Keep route entries thin. Reuse `PublicSectionHeader`, `PublicSearchPanel`, `PropertyFilters`, `PropertySort`, `PropertyPagination`, `PropertyImage`, `PropertyGallery`, existing Button variants, labelled fields and inquiry state logic.
- Scope layout changes to listings/details. `PropertyCard`/`PropertyGrid` are also used by the homepage; preserve `home` behavior and verify all actual callers before adding an explicit listings treatment. Avoid generic page builders or unused abstractions.
- Keep query-keyed results Suspense; headings/search render independently. Loading skeletons must fit the new rows, keep meaningful reserved photo height and preserve the single collection-level loading indicator.
- At mobile widths, stack each card's photo then content and outlined action; reflow search fields without hiding required controls. Avoid carousels and horizontal scrolling.
- Verify 320, 390, 768, 1024 and 1440px, 200% zoom, reduced motion, long titles/locations/prices, visible focus and WCAG AA contrast. Use one H1, ordered headings, semantic lists/landmarks, explicit form labels and at least 44px action targets.

## Acceptance criteria

- [x] Listings matches the selected horizontal-card composition and architectural heading treatment without a photo banner or circular art.
- [x] View property actions are outlined; Search and inquiry submit retain their solid primary treatment.
- [x] Search includes both independently editable AED bounds, minimum bedrooms and Buy/Rent with correct price-period labels; exactly one sort control is available.
- [x] Filter, sort, pagination and Back to results preserve validated URL behavior and browser history; no per-card detail fetch or API contract change is introduced.
- [x] Details matches the selected right-hand reference using supported facts, actual photos and the existing inquiry form.
- [x] Gallery and listing/image states work for short collections, 1/2/3/4/5+ photos, empty results, out-of-range pages, loading, API/image failures and 404s.
- [x] Inquiry success, invalid input, duplicate submit, unavailable listing, rate limit and uncertain-response recovery remain functional with the same contract.
- [ ] Desktop/mobile/zoom/keyboard/reduced-motion and long-content checks pass without overflow, clipped actions or inaccessible fields. Desktop/mobile, keyboard, reduced-motion and long-content evidence passed, but native browser 200% zoom remains blocked and cannot be inferred from equivalent viewport checks.
- [x] Homepage, shared shell, agents/contact and CRM property presentation regressions are checked; demo labels remain accurate.
- [x] Required quality checks, selected integrated browser tests, runtime inspection and visual comparison are recorded with limitations before delivery status changes.

## Validation

- Add focused browser coverage for horizontal card geometry, outline actions, heading art/overflow, single sort, price-bound submissions, list/detail/back navigation and gallery photo counts. Use existing fixture infrastructure and backend on port 4311.
- Extend existing properties, loading/image, public long-content, reduced-motion and zoom coverage where it owns behavior. Cover inquiry safety through existing property-inquiry tests; avoid duplicate implementation-shaped unit tests.
- Run `bun run api:check`, `bun run lint`, `bun run format:check`, `bun run typecheck`, `bun run test`, `bun run build`, then selected `bun run test:e2e` suites against the real integration setup. Stop an owned dev server before production build or build an isolated source snapshot; never disturb unrelated processes or delete a running `.next`.
- Confirm Next DevTools on port 3100 identifies this checkout; open both routes in the browser and inspect errors/page metadata. Compare rendered desktop/mobile captures against the two specific references and record contract-safe differences.
- Backend runtime is unchanged; no backend migration/build is required solely for synchronized roadmap documentation. Integration tests still exercise its existing inquiry/search endpoints.

## Rollout and risks

- No new dependency, environment variable, migration or backend deployment. Revert the scoped frontend presentation changes to restore previous layouts.
- Shared-card/filter/loading changes may affect the homepage or other routes: scope presentation explicitly and verify callers. Tall/long content must flow rather than rely on fixed card heights.
- Mockup fields and duplicate controls are not authoritative contracts. The explicit omissions above prevent fabricated data, N+1 reads and accidental scope expansion.
- No implementation blocker remains for the documented frontend-only scope. Native 200% zoom verification is blocked by browser automation and remains unchecked; description previews or additional facts still require a separate scope decision and backend-owned contract update.

## Implementation evidence

### Remaining detail-page refinements — 2026-11-02

Status: Verified. The approved refinements use only the existing public detail DTO and inquiry contract; no backend work was required.

- `PropertyDetails` follows About this home with type, location, bedrooms, bathrooms and property size from the existing DTO. Furnishing and previous/next-property navigation remain excluded.
- The shared icon catalog supplies decorative bed, bath, area, location and camera icons. The text labels retain Studio handling and accessible fact names.
- The sale/rent badge now sits on the gallery cover. View all photos has a dark inverse treatment, camera icon and actual count while retaining existing photo-count, keyboard and dialog behavior.
- The inquiry card no longer repeats the property title/location. Its concise introduction, three-row message field and natural page flow keep all fields and submission reachable without an internal scrollbar; contact guidance, privacy wording, error associations, duplicate guards and receipt recovery remain unchanged.

Verified acceptance:

- [x] Supported details match the API and use two columns at wider widths, with narrow-content reflow and no fabricated facts.
- [x] Sale and rent galleries expose the correct badge, readable camera action and working keyboard/dialog interactions.
- [x] The complete inquiry form and submit action can be reached by normal page scrolling at desktop and narrow widths, without a nested card scrollbar, including validation/error content.
- [x] Inquiry safety and gallery/long-content regressions, required frontend checks, runtime inspection and visual review are recorded. The separate native 200% zoom limitation remains unresolved.

API drift, lint, formatting, type generation plus TypeScript, 271 unit tests in 46 files and an isolated production build passed. The final selected browser run passed 24 cases with 8 intentional viewport skips and no failures. It covered desktop and mobile inquiry safety/recovery, public filtering and gallery behavior, one-to-five-photo layouts, long content, the new sale/rent fact and overlay states, and shared actions. The new detail assertions verified supported fact values and responsive layout at 1480px, 640px and 390px, a naturally scrolling inquiry card and reachable submit action. The gallery focus assertion now waits for Base UI's animation-frame focus guard to settle; production dialog behavior was unchanged. Normal port 3100 runtime inspection identified this checkout and the active detail page, reporting no configuration or session errors. Visual review used `outputs/property-pages-redesign/detail-refinement-desktop.png` and `detail-refinement-mobile.png` against the selected right-hand reference. The canonical native-browser 200% zoom limitation remains unresolved.

### Browser annotation refinement — 2026-11-02

Sliding-hover correction: changing only a gradient's background position was not visibly sliding the listing action fill. Keep the existing dark diagonal colors, but move an actual clipped decorative gradient layer from outside the button's left edge to its resting position on hover/focus. Apply the same behavior to public primary actions, preserve outlined rest state and normal navigation, and make the change immediate under reduced motion. Verify intermediate movement, not only the final computed background position.

Latest visual correction: the user rejected the small, fully contained facade as visually off. Supersede the earlier complete-facade/above-dock presentation: scale the illustration into a large, intentionally cropped architectural backdrop like the selected mockup, with the building continuing beyond the banner rather than a visible floating ground line. Preserve the full-width header connection, soft banner fade, search overlap, readable title and current button treatments. Earlier geometry passes do not establish acceptance of this corrected visual composition; capture and compare the revised 1480px banner and narrow states before recording it verified.

Requested follow-up: make the architectural heading illustration clearer with restrained blush/maroon color, hide the redundant visible Budget (AED) group heading while retaining its accessible group name and both visible price labels, and add a left-to-right gradient hover/focus treatment to listing navigation and public primary buttons. Keep outline actions outlined at rest, maintain text contrast throughout the effect, and disable animation for reduced motion. Add a brief listing-filter hint explaining that Buy/Rent changes apply after submission; the heading and results continue to reflect the applied URL. No backend or query behavior changes.

Subsequent artwork/layout clarification: use a separately generated, locally optimized facade illustration matching the selected reference, rather than the first wireframe approximation. The colored banner spans the viewport directly below the public header; its text stays aligned to the existing content container, and the search dock overlaps the banner's base. Preserve mobile stacking.

**Follow-up verified:** `public/images/properties/architecture.webp` (63,822 bytes) is a separately generated facade illustration with provenance in its colocated README; it is decorative artwork, not a cropped mockup or listing image. The earlier complete-facade/above-dock presentation is superseded. Read-only browser checks at 1480×810 confirmed a header/banner gap of at most 1px, the 28px dock overlap, a fading banner base, and the large cropped backdrop filling the banner height without a floating baseline or hard clipped bottom. The earlier background-position/background-size hover treatment is also superseded: public-primary and listing-outline actions now use a clipped decorative `::before` layer that translates from `-101%` to `0` over 360ms on hover/focus, with white text over the dark diagonal `#4e1625` to `#701f35` gradient; the outline remains unfilled at rest. Frame checks observed outline `-169.4 → -155.2 → 0` and primary `-178.1 → -163.2 → 0`, while reduced-motion transition duration was zero. The checks also confirmed the visually hidden redundant budget heading, that the sale heading remains until Rent is applied, then updates without overflow at 320/390/768px. The focused listings suite passed 3/3 in 15.4s. Earlier API drift, lint, formatting, TypeScript, 271-test/46-file unit and isolated-build evidence remains recorded above; no new full-suite/unit claim is made for this CSS correction. Normal port 3100 runtime inspection reported no errors. Reviewed follow-up captures are `outputs/property-pages-redesign/refined-header.png`, `refined-hover.png`, and `sliding-hover.png`. This refinement does not replace the canonical native-browser 200% zoom limitation below.

**Shared-action supersession (2026-11-02):** The public-only hover selectors are now superseded by the shared `Button`/`buttonVariants` action system documented in [shared button consistency](../button-consistency/spec.md). The same actual pseudo-element slide, reduced-motion behavior and primary/secondary hierarchy now apply to ordinary CRM and authentication actions. Listing actions retain their outlined resting state, and the gallery View all control remains absolutely positioned over imagery. This frontend-only maintenance does not alter this feature's API contract or its separate native-browser 200% zoom limitation.

- API drift, lint, formatting and TypeScript checks passed; `vitest` passed 271 tests in 46 files; an isolated production build passed. The implementation reports and delivery ledger are retained under `.delivery-work/public-property-pages-redesign/` (ignored verification artifacts).
- Isolated integration coverage passed: listings 3/3 with three intentional mobile skips; details 8/8 with two intentional skips for already-covered fixture paths. The inquiry success/uncertain-recovery follow-up passed 4/4 with one intentional skip. The serial legacy/public regression covered 70 passing cases and 19 intentional skips; its sole failure was the native-zoom browser spawn, not a product assertion.
- Normal port 3100 inspection opened both affected routes in the identified checkout. Next DevTools reported no errors and confirmed page metadata. Visual QA passed for the feature scope using reviewed desktop/mobile captures and comparisons under `outputs/property-pages-redesign/`; real demo content, photo counts and the existing footer are intentional reference differences.
- No API, schema, configuration, dependency, backend runtime or contract change was delivered. Test-only isolated origins changed from 13100 to fixture 3100 while the source production configuration remained unchanged.
- **Remaining limitation:** the canonical 200% native-browser zoom check is blocked. The bundled native-zoom browser could not spawn (`UNKNOWN`), and the later Edge attempt could not read `#zoomLevel`; a fallback did not establish 200%. Do not treat this specification as fully verified until a browser control path can set and prove native 200% zoom.
