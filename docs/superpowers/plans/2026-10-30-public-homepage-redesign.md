# 🏡 Cinematic Maroon Homepage Plan

> **Goal:** Implement the selected homepage refinement with its maroon photographic hero, editorial sections and charcoal footer using existing public APIs.

---

## 🎯 Objective

Replace the current sparse homepage composition with the selected [visual reference](../../../specs/public-homepage-redesign/reference.png), preserving property discovery and inquiry journeys. **Status: verified frontend presentation delivery; the broader Phase 1 P1-14/P1-18 release acceptance remains separate.** Authoritative [specification](../../../specs/public-homepage-redesign/spec.md).

---

## 📦 Scope

**In scope**

- Homepage sections, optimized decorative assets, shared public header/footer and responsive/accessibility verification.
- Existing search, featured properties, type/community shortcuts and agent/contact navigation.

**Out of scope**

- Backend changes, new APIs/data, dependencies, new pages, CRM/login redesign and deployment.

**Annotation follow-up (2026-10-30)**

- Repair the reported desktop dock baseline and featured-card alignment without changing contracts, routes, permissions or the broader Phase 1 checklist status. Targeted alignment/state validation is recorded in the authoritative feature specification.

---

## ⚙️ Assumptions & Constraints

**Technical**

- Keep current Next/React architecture, strict TypeScript, existing fonts, semantic tokens and UI/form primitives. Before coding, read frontend AGENTS/SKILL, relevant local Next guides and current framework docs where required.
- Preserve current uncommitted public-completion work. The redesign supersedes only its homepage composition; pending acceptance remains outstanding.
- Existing `PropertyFilters` owns search validation/conversion/pending behavior; default purpose is `sale`, rental prices are annual, minimum and maximum AED inputs remain available.

**Product / Business**

- Latest refinement option 3 is selected; use the repository-local reference, not an earlier option 3. Sample inventory stays disclosed.
- Share the maroon header and charcoal footer across public routes; do not redesign their interior content or login/CRM.

**Dependencies**

- Existing Express public property endpoint and backend-owned OpenAPI contract; no API change.
- Individual hero/community/guidance assets with provenance, generated or approved before implementation acceptance.

---

## 🧩 Proposed Approach

- Retain one server-side `getPublicProperties("featured=true&pageSize=3&sort=newest")` request. Pass typed summaries to the homepage presentation; fixed type/community links need no extra API reads. No new client-wide state or data layer.
- **Modify:** [homepage](<../../../src/app/(public)/page.tsx>), [public layout](<../../../src/app/(public)/layout.tsx>), [public CSS](<../../../src/app/(public)/public.css>), [public header](../../../src/components/layout/public-header.tsx), [Brand](../../../src/components/layout/brand.tsx) and [PropertyFilters](../../../src/features/properties/public/property-filters.tsx) only for a scoped home presentation.
- **Proposed new files:** `src/features/properties/public/homepage-sections.tsx` owns homepage composition and fixed navigation content; `src/components/layout/public-footer.tsx` owns the repeated public footer; `public/images/homepage/` contains optimized individual images and `README.md` provenance. Split further only for a demonstrated responsibility, not one file per decorative row.
- **Reuse:** [PropertyCard](../../../src/features/properties/public/property-card.tsx), [PropertyImage](../../../src/features/properties/shared/property-image.tsx), [PublicSearchPanel](../../../src/components/layout/public-search-panel.tsx) and [PublicSectionHeader](../../../src/components/layout/public-section-header.tsx). Add a homepage card treatment only if needed; keep normal results/CRM defaults intact.
- **Contract:** unchanged `PropertyList<PublicPropertySummary>` and `/properties` URL filters. Type links use `purpose=sale&type=...`; communities use `purpose=sale&location=...`. Existing detail, agents, contact and staff-login routes remain the destinations.
- **Review focus:** 0/1/2/3 featured records; failed/slow API or images; very long labels/prices; Buy/Rent plus both budget bounds; shared dark header/footer and mobile drawer outside the homepage.

---

## 🚀 Execution Plan

1. **Prepare selected assets and presentation boundaries** — _(role: frontend)_ — stable visual target and scoped resources.
   - [x] Inspect current diffs and relevant feature specs; record which unfinished public-completion changes must survive. Use an isolated execution checkout if needed, carrying authorized dependencies explicitly.
   - [x] Source/generate separate hero, three community and agency-guidance photos; store optimized assets and provenance under `public/images/homepage/`. No UI screenshot crops or fabricated inventory.
   - [x] Establish public-scoped inverse colors/Brand treatment without changing default CRM/login styling. Check the reference against actual component interfaces before introducing variants.
2. **Deliver the maroon hero and working search** — _(role: frontend)_ — compact first viewport with unchanged results semantics.
   - [x] Extend existing search browser coverage to assert Buy/Rent, location, type, both price bounds, unit clarification and resulting URL values; preserve current validation expectations.
   - [x] Compose the independent photo hero/overlay and light dock in the homepage module; reuse PropertyFilters with home-only presentation. Keep min/max controls accessible within Budget if collapsed.
   - [x] Verify valid searches, invalid/inverted bounds, pending behavior, hydration guard and 1440 × 900 first-screen visibility. Stacked mobile fields remain in normal flow without overlap.
3. **Deliver the editorial homepage body** — _(role: frontend)_ — live featured homes and purposeful discovery sections.
   - [x] Add `tests/e2e/homepage-redesign.spec.ts` for type/community destinations and featured counts 0/1/2/3, using existing route fixtures where possible. Assert no duplicated cards, correct prices/links and usable empty/error recovery.
   - [x] Implement one-large/two-stacked featured composition, then the four text type links, three rectangular community tiles and light guidance split, in the exact reference order. Use live property values and existing formatting/media handling.
   - [x] Keep generic property cards unchanged unless a small explicit homepage treatment is necessary. Retain demo badges/disclosures and both agents/contact guidance paths.
   - [x] Verify request failures, broken photos, delayed responses and long content with current public-completion fixtures. Hero and shortcut navigation must remain usable without featured data.
4. **Deliver consistent public navigation and footer** — _(role: frontend)_ — maroon header and charcoal closing band across public routes.
   - [x] Extract the current inline footer into PublicFooter; add Contact us closing CTA, Buy/Rent links, inverse Brand and current-year copyright. Retain quiet Staff sign-in and avoid nonexistent legal/social pages.
   - [x] Restyle PublicHeader without changing route-current behavior or mobile drawer semantics. Keep default Brand presentation unchanged elsewhere.
   - [x] Exercise home, results, detail, agents, profile and contact header/footer, mobile menu, keyboard traversal and login/CRM default branding. Update obsolete visual-copy assertions while retaining navigation/behavior coverage.
5. **Verify visual fidelity and regressions** — _(role: frontend)_ — attributable desktop/mobile evidence.
   - [x] Capture `/` at 1440 × 900 and a full page, then 320/390/768/1024px widths. Compare the reference and implementation together; fix spacing, crops, typography and section proportions. Test 200% zoom, contrast, 44px actions, focus, reduced motion and overflow.
   - [x] Run the constituent API drift, lint, formatting, type, unit and production-build gates. These passed, with build performed in an isolated snapshot to preserve the existing dev server; the literal aggregate command is not claimed.
   - [x] Run `bun run test:e2e -- tests/e2e/homepage-redesign.spec.ts tests/e2e/public-completion.spec.ts tests/e2e/properties.spec.ts tests/e2e/public-agency.spec.ts tests/e2e/public-component-reuse.spec.ts tests/e2e/foundation.spec.ts tests/e2e/property-image-loading.spec.ts tests/e2e/public-long-content.spec.ts tests/e2e/public-reduced-motion.spec.ts tests/e2e/public-browser-zoom.spec.ts --workers=1` with the documented disposable backend. Require zero unexpected failures; explain fixture-specific skips.
   - [x] Verify Next DevTools project identity on 3100 and inspect errors/page metadata while affected pages are open. Broaden to the remaining established Phase 1 acceptance gates before claiming P1-14/P1-18 completion; do not infer completion from this focused suite.
6. **Reconcile delivered specifications and tracker** — _(role: frontend)_ — accurate implementation status after tests settle.
   - [x] Delegate final documentation reconciliation to `spec-updater`, owning this spec/plan, root spec, spec index, earlier public-completion references and roadmap copies; wait and review its diff. Perform directly only if delegation is unavailable.
   - [x] Record actual checks/captures and unresolved limitations. Update frontend ROADMAP first and synchronize backend ROADMAP; leave incomplete checklist items unchecked. No TECH_STACK edit unless tools actually change.
   - [x] Format changed Markdown, run `git diff --check` in both repositories and review that the patch preserves existing work and contains no unintended backend/product changes. Prepare for review; do not deploy or merge implicitly.

---

## ✅ Acceptance Criteria

**Functional**

- [x] All eight specified sections match the selected reference's hierarchy and have working existing destinations.
- [x] Search conversion, validation and Buy/Rent behavior remain correct; featured states and demo disclosures remain honest.
- [x] Public navigation/footer work across all public routes, with Staff sign-in retained and login/CRM unchanged.

**Non-functional** (performance, security, accessibility, reliability)

- [x] Responsive, contrast, keyboard, reduced-motion and 200% zoom checks pass; images reserve space and load appropriately.
- [x] No API, dependency, permission or configuration change; frontend checks, focused regressions and runtime inspection pass.

---

## 🧪 Validation Plan

**Manual tests**

- Side-by-side reference comparison, desktop first viewport and full-page review, mobile menu, dark-surface focus/contrast, 200% zoom and media failure checks.

**Automated tests**

- `bun run check`, focused suite in step 5 and meaningful existing public/inquiry regressions. Add URL/state coverage, not tests of decorative class names.

**Rollback / mitigation**

- Revert only this frontend delivery and its assets. No data migration. Preserve earlier unfinished changes and their evidence; no automatic writes/retries or backend rollback needed.

---

## ⚠️ Risks & Open Questions

**Risks**

- **Risk:** Heavy imagery or weak overlay contrast — _Mitigation:_ optimized individual assets, reserved dimensions, hero-only priority and measured contrast.
- **Risk:** Shared styling alters CRM/results or pending public work — _Mitigation:_ scoped variants, default Brand preservation, explicit diff review and cross-route regression checks.
- **Risk:** Generated reference suggests unsupported links/data — _Mitigation:_ existing routes, fixed sale shortcuts, real API listing values and preserved demo disclosures.

**Open questions** _(blockers for implementation)_

- _None._ Exact responsive spacing and asset choices follow the specification; implementation itself is a subsequent user request.
