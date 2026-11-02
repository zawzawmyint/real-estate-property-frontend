# 🏘️ Public Property Pages Upgrade Plan

> **Goal:** Upgrade property listings and details to the selected Avenor designs using existing APIs and inquiry behavior.

---

## 🎯 Objective

Give `/properties` a distinct, professional browsing layout and `/properties/[id]` the selected photo-first detail experience. **Status: delivered with one open verification limitation:** native-browser 200% zoom was not established; the authoritative [specification](../../../specs/public-property-pages-redesign/spec.md) records the evidence and limitation.

---

## 📦 Scope

**In scope**

- Architectural heading, preserved search controls, horizontal listing cards and outlined navigation actions.
- Selected detail gallery, facts, price/description hierarchy and existing inquiry sidebar.
- Responsive, accessibility, state, integration and regression verification.

**Out of scope**

- Backend/API/schema changes, homepage redesign, other page interiors, dependencies, deployment and new business features.
- Listing-description previews and furnishing/agent facts absent from existing contracts.

---

## ⚙️ Assumptions & Constraints

**Technical**

- Use current Next.js/React/TypeScript, existing UI/form components and self-hosted Lora/Poppins. Read repository AGENTS/SKILL and relevant local Next documentation before implementation; fetch current library documentation when library-specific guidance is needed.
- Frontend branch: `feat/public-property-pages-redesign`, based on `0b85f9d`. Backend uses the matching branch from `b8c4c25` for synchronized roadmap documentation only.
- Public summary has no description. Omit card previews, make no per-card detail requests, and preserve current DTOs and privacy boundaries.
- Keep existing URL filters, three supported sorts, exact AED/fils conversion, annual rental pricing, hydration guards, keyed Suspense and inquiry receipt/duplicate handling.

**Product / Business**

- Listings uses the [latest architectural-linework refinement](../../../specs/public-property-pages-redesign/listings-reference.png); details uses only the **right-hand page** of [original option 1](../../../specs/public-property-pages-redesign/detail-reference-pair.png).
- Keep outlined View property actions and solid Search/Send inquiry. Use one results-toolbar sort, editable price bounds and only supported property facts, adapting generated mockup artifacts accordingly.
- Preserve homepage, shared shell and current demo disclosures. Do not complete P1-14/P1-18 or alter the 28/30 verified count from this planning work.

**Dependencies**

- Existing public list/detail and property-inquiry endpoints, backend-owned OpenAPI and local [property](../../contracts/properties.md)/[lead](../../contracts/leads.md) contract snapshots.
- Existing integration fixtures, backend port 4311 and frontend runtime port 3100.

---

## 🧩 Proposed Approach

- Existing server reads → typed summaries/details → route-specific presentation. Search/pagination stay URL-driven; inquiry continues through its existing Server Action to Express. No API/data-contract changes.
- **Listings coordination:** [list route](<../../../src/app/(public)/properties/page.tsx>), [PropertyFilters](../../../src/features/properties/public/property-filters.tsx), [PropertyResults](../../../src/features/properties/public/property-results.tsx), [PropertyGrid](../../../src/features/properties/public/property-grid.tsx), [PropertyCard](../../../src/features/properties/public/property-card.tsx), and [public CSS](<../../../src/app/(public)/public.css>). Preserve homepage callers; add an explicit listings treatment only where required.
- **Details:** [detail route](<../../../src/app/(public)/properties/[id]/page.tsx>), [PropertyGallery](../../../src/features/properties/public/property-gallery.tsx) and [PropertyInquiryCard](../../../src/features/leads/public/property-inquiry-card.tsx). Preserve their current input interfaces and submission logic.
- **Loading:** [property-loading.tsx](../../../src/features/properties/shared/property-loading.tsx); preserve other consumers while fitting horizontal result geometry.
- **Tests:** `tests/e2e/public-property-pages-redesign.spec.ts` and `tests/e2e/public-property-details-redesign.spec.ts` exercise the delivered geometry and states; existing properties/loading/image/long-content/zoom/reduced-motion coverage was extended where it owns behavior.
- Use a separately generated local facade illustration as non-interactive decoration, with provenance in `public/images/properties/README.md`; it is not a rasterized UI screenshot or listing image. Reuse current formatters, fields and controls; avoid a new page framework.

---

## 🚀 Execution Plan

1. **Pin route-specific regression coverage** — _(role: frontend)_ — completed focused observable acceptance before presentation changes.
   - [x] Inspected card/grid/filter/gallery callers and inquiry browser cases; homepage behavior remains separately scoped.
   - [x] Added and exercised focused listing assertions for horizontal/stacked geometry, outline actions, clipped decorative art and one sort control; the baseline failed for the expected original-heading mismatch.
   - [x] Covered Buy/Rent, both price bounds, minimum bedrooms, sorting, pagination, validated `from`, empty/out-of-range/error results using existing fixtures.
2. **Deliver listings presentation** — _(role: frontend)_ — completed with existing data and navigation.
   - [x] Added a purpose-aware full-width blush banner that fades to the page background, with a container-aligned locally generated facade illustration as a large, intentionally cropped backdrop and a 28px-overlapping search dock; styled two-row filters with 48px controls and retained results-toolbar sorting.
   - [x] Applied scoped horizontal cards using `PublicPropertySummary`, `resultsQuery` and existing formatters; descriptions remain omitted and demo labels remain accurate.
   - [x] Fitted loading/photo placeholders, empty/error recovery and pagination without altering homepage defaults; focused listings integration passed 3/3 with three intentional mobile skips.
3. **Deliver property detail presentation** — _(role: frontend)_ — completed selected mosaic/details/inquiry composition.
   - [x] Added gallery coverage for 1/2/3/4/5+ photos, count, navigation, Escape/focus return, validation and error paths; integrated details coverage passed 8/8 with two intentional skips.
   - [x] Adapted gallery and detail hierarchy with existing `PropertyPhoto[]` and `PublicPropertyDetail`; unsupported fields and previous/next navigation remain omitted.
   - [x] Styled the existing inquiry sidebar without changing submission logic. Success/uncertain recovery passed 4/4 with one intentional skip; validation, 404 and 429 paths were exercised.
4. **Verify the full public journey** — _(role: frontend)_ — completed except canonical native 200% zoom.
   - [ ] Native-browser 200% zoom remains blocked: the bundled browser spawn was `UNKNOWN`, Edge did not expose `#zoomLevel`, and fallback controls did not prove 200%. Width/keyboard/reduced-motion/long-content evidence otherwise passed.
   - [x] API drift, lint, formatting, TypeScript, 271 unit tests in 46 files and an isolated production build passed.
   - [x] Ran selected integration and legacy/public coverage against the disposable backend/proxy setup; the serial 90-case run had 70 passes, 19 intentional skips and one native-zoom-only failure. Source configuration was unchanged; test-only origins used 13100/14312/14311 with fixture adaptation to 3100.
   - [x] Confirmed the normal 3100 checkout identity and inspected both routes with no Next runtime errors; reviewed desktop/mobile reference comparisons with no P0/P1/P2 visual finding. The final annotation correction also passed 1480px gap/overlap/banner-fade and cropped-art-height checks, actual clipped-layer hover/focus motion from `-101%` to `0` over 360ms, reduced-motion checks, and 320/390/768px overflow checks; focused listings passed 3/3 in 15.4s.
5. **Reconcile delivery documentation** — _(role: frontend)_ — record only supported acceptance and tracker state.
   - [x] Reconciled the authoritative feature specification, project/index pointers and scoped visual-QA pointer after implementation and review.
   - [x] Synchronized the frontend-first ROADMAP entry into backend. P1-14/P1-18 remain unchecked and Phase 1 remains 28/30; no commit, push or deployment is claimed.

---

## ✅ Acceptance Criteria

**Functional**

- [x] Horizontal listings, outlined actions and architectural heading match the selected reference using live summary data.
- [x] Detail gallery/information/inquiry matches the selected right-hand reference with supported fields only.
- [x] Search, sort, pagination, gallery and Back to results work with unchanged contracts.
- [x] Inquiry validation, duplicate protection, success and failure/recovery states remain intact.

**Non-functional** (performance, security, accessibility, reliability)

- [x] No per-card detail fetch, new dependency, private-field exposure or backend change.
- [ ] Required widths, keyboard, native 200% zoom, reduced motion and image/data failures pass review. Native zoom is the sole open item.
- [x] Homepage/shared-shell/CRM regressions are checked, and quality/runtime/visual evidence is recorded.

---

## 🧪 Validation Plan

**Manual tests**

- Desktop/mobile comparisons, gallery/form feedback, heading art, long content, focus and contrast were reviewed. Native 200% browser zoom remains a follow-up.
- The Buy/Rent → search → sort/page → property → gallery/inquiry → back flow and recovery states are covered by the recorded focused integration suites.

**Automated tests**

- Focused listings/details/inquiry coverage, targeted public regressions, API drift/lint/format/type checks, 271 unit tests and isolated production build passed; exact results and skips are in the specification.
- Check documentation links, Markdown formatting, diff whitespace and synchronized ROADMAP copies during final reconciliation.

**Rollback / mitigation**

- Revert scoped frontend presentation changes; keep existing backend untouched. Preserve old homepage treatment and all original contract/state behavior throughout implementation.

---

## ⚠️ Risks & Open Questions

**Risks**

- **Risk:** Shared card/filter/gallery work affects unrelated screens — _Mitigation:_ inspect callers, scope presentation and run homepage/CRM/public regression checks.
- **Risk:** Generated mockup data or controls silently expand the API scope — _Mitigation:_ omit descriptions/furnishing/extra navigation, retain numeric bounds and one supported sort.
- **Risk:** Fixed card/gallery dimensions clip long or short collections — _Mitigation:_ let content flow and cover photo counts, long content and narrow/zoomed layouts explicitly.
- **Risk:** Inquiry styling hides or changes safety states — _Mitigation:_ retain existing logic and exercise real success/error/receipt recovery paths.
- **Risk:** Equivalent-width checks are mistaken for native browser zoom — _Mitigation:_ keep the native 200% acceptance unchecked until browser automation can set and prove it.

**Open questions** _(blockers for implementation)_

- Native browser automation must be able to set and prove 200% zoom before the remaining non-functional acceptance can be marked passed. Description previews or additional business facts still require a separate backend scope decision.
