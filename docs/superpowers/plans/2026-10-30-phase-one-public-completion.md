# 🏡 Phase 1 Public Website Completion Plan

> **Goal:** Complete homepage P1-14 and verify public mobile-layout P1-18 while preserving existing discovery and inquiry contracts.

---

## 🎯 Objective

Phase 1 is 28/30 verified. The homepage already has search and featured results, but lacks the guidance section in the selected reference and complete homepage acceptance. Public responsiveness has partial feature evidence rather than complete P1-18 acceptance.

**Status:** In progress; frontend code and focused test changes are under verification. **Branch:** `feat/phase-one-public-completion` in both repositories. Product work belongs to frontend; backend currently carries only the synchronized roadmap update. Per user direction, prioritize the homepage visual finish and do not repeat passing unrelated checks; release gates remain separate. P1-14 and P1-18 remain unchecked.

---

## 📦 Scope

**In scope**

- Homepage completion, explicit empty-state presentation and navigation to existing agent/contact pages.
- Public mobile/accessibility verification and evidence-backed fixes.
- Clean regression and documentation reconciliation before checklist closure.

**Out of scope**

- Backend/API/schema changes, new dependencies, full redesign, Phase 2 work and new marketing claims.
- Deployment and D-01–D-05 portfolio delivery; these remain separate release work.

---

## ⚙️ Assumptions & Constraints

**Technical**

- Keep separate repositories; Express owns data, permissions and inquiry writes. No cross-repository imports.
- Use existing shared public components and current Webpack workflow; static guidance needs no client state or additional request.
- Read repository implementation skills and relevant local framework guides before coding. Use Context7 for any library-specific decisions that require documentation.

**Product / Business**

- Retain the selected Avenor direction; guidance copy/layout in the feature spec are proposed defaults for review.
- P1-18 covers delivered public screens. Existing CRM responsive behavior remains part of regression, without adding a CRM redesign.
- Keep all acceptance unchecked until verified. Finishing these items alone does not complete the deployment requirement.

**Dependencies**

- Existing published-property fixtures, public agency catalog, inquiry-to-lead flow and isolated browser backend.
- [Feature spec](../../../specs/phase-one-public-completion/spec.md), [visual reference](../../design/homepage-maroon-ivory-charcoal.png), [development workflow](../../development.md) and [runtime inspection](../../agent-tooling.md).

---

## 🧩 Proposed Approach

- **Recommended:** finish the current homepage, then verify/fix public pages. A complete redesign increases scope; checklist-only closure would leave the known homepage gap unresolved.
- Keep existing hero/search/featured composition in [homepage](<../../../src/app/(public)/page.tsx>). Add a local static guidance section with the spec's heading/body and `/agents` and `/contact` links. Add an explicit zero-featured state; keep request failure distinct. Do not require a new image asset.
- Touch [public styles](<../../../src/app/(public)/public.css>), [public layout](<../../../src/app/(public)/layout.tsx>), [header](../../../src/components/layout/public-header.tsx), [filters](../../../src/features/properties/public/property-filters.tsx), [gallery](../../../src/features/properties/public/property-gallery.tsx) and individual public routes only where verification demonstrates a defect. Preserve shared callers and semantic tokens.
- `tests/e2e/public-completion.spec.ts`, `public-long-content.spec.ts`, `public-reduced-motion.spec.ts` and `public-browser-zoom.spec.ts` now provide focused evidence. They do not replace the remaining serial legacy and dedicated-dashboard gates.
- **Contracts:** no changes to existing public property/agency DTOs, inquiry payloads, receipts or permissions. Read the [property](../../contracts/properties.md), [lead](../../contracts/leads.md) and [agency](../../contracts/public-contact-and-agents.md) contracts before implementing.
- **Review focus:** zero versus failed featured reads; shared proxy rule collisions; long content and narrow drawers; inquiry duplicate/reconciliation behavior; enlarged text/focus visibility. Each has an owning check below.

---

## 🚀 Execution Plan

1. **Establish the public acceptance baseline** — _(role: frontend)_ — route/state matrix and reusable fixture strategy.
   - [ ] Review the draft spec and selected reference before product implementation. Read existing tests and record which acceptance each already proves.
   - [ ] Inspect `/`, `/properties`, a seeded `/properties/[id]`, `/contact`, `/agents` and a published `/agents/[slug]` at 320, 375, 390, 768, 1024 and 1440px. Record actual defects and capture the pre-change homepage.
   - [ ] Identify deterministic featured/long-content records from the disposable fixture. Run fault-injection cases sequentially; always clean up rules and created records. Extend fixtures only if current controls cannot express required cases; any backend behavior/config change requires its own backend spec first.

2. **Complete homepage behavior and presentation** — _(role: frontend)_ — P1-14 candidate with independent acceptance.
   - [x] Add focused browser cases in `tests/e2e/public-completion.spec.ts`: guidance links navigate correctly; empty featured collection shows the spec's message/Browse properties link; featured failure shows retry rather than the empty state; pending featured reads do not block search/guidance. The final focused serial run records these cases as passing.
   - [ ] Update `src/app/(public)/page.tsx` with the static guidance section and explicit empty-state behavior. Preserve `HomePage()`, the shared `FeaturedRequest` promise and existing hero/featured loading boundaries; guidance must sit outside awaited result components.
   - [x] Prepare the homepage-only budget-grid adjustment in `property-filters.tsx`: stack below 400px without changing listing filters. Normal-preview smoke evidence shows fitting fields and no document overflow at 1440px, 390px and 320px; full acceptance remains open.
   - [ ] Reuse current components/styles; preserve up-to-three featured cards, eligibility, demo labeling and current View all destination. Add no new data fetch, generic abstraction or dependency for this section.
   - [x] Run the focused public suites serially with `--workers=1`. The final run passed 11 cases with 9 intentional project skips and no failures; it is not a substitute for the remaining release gates.

3. **Close public mobile and accessibility gaps** — _(role: frontend)_ — P1-18 evidence across the complete public journey.
   - [ ] Add missing route-matrix assertions to the owning browser suites. Check document overflow plus visible/operable content; use long property titles/locations and the spec's width matrix. Reuse existing directory/profile width tests rather than repeating them in a second suite.
   - [ ] Verify sale/rent search criteria survive navigation/reload; invalid budgets retain input and associated errors. Exercise mobile filters/reset/pagination, header/footer links, gallery keyboard/Escape/focus restoration and inquiry error/success/recovery presentation.
   - [x] Verify 200% actual browser zoom at a 1280px desktop viewport with the automated native-zoom case in an isolated temporary Chrome profile: CSS viewport halves, device-pixel ratio doubles and CSS zoom remains 1. This replaces the planned manual zoom step; reduced-motion focused cases also passed. Remaining focus, touch-height and complete visual-review acceptance is unchecked.
   - [ ] For each defect, add a meaningful regression assertion, reproduce it, make the smallest fix in its owning route/component and rerun that case. Do not mask overflow globally.
   - [ ] Run `bun run test:e2e -- tests/e2e/public-completion.spec.ts tests/e2e/foundation.spec.ts tests/e2e/properties.spec.ts tests/e2e/public-agency.spec.ts tests/e2e/public-component-reuse.spec.ts tests/e2e/loading-states.spec.ts tests/e2e/property-image-loading.spec.ts --workers=1`. Visually review all public routes at 320/390px and homepage at 1440px, including failure/loading screenshots.

4. **Verify integration and release readiness** — _(role: fullstack)_ — clean, attributable acceptance evidence.
   - [x] Run frontend `bun run check`: API drift, lint, formatting, typecheck, 271 unit tests in 46 files and the production build passed.
   - [ ] Start the normal disposable backend fixture per development docs, with the dedicated dashboard flag unset. Run `bun run test:e2e -- --workers=1`; require zero unexpected failures and classify every skip. Verify property/general inquiry each persist one expected lead and preserve staff role boundaries through existing integration cases.
   - [ ] Restart the disposable backend with `STAFF_E2E_DASHBOARD_ONLY=1`; set the same flag in the test terminal and run `bun run test:e2e -- tests/e2e/dashboard.spec.ts --workers=1`. Keep this exact-data run separate from legacy tests. Clear the flag afterward.
   - [ ] Diagnose failures rather than combining passing results from non-clean runs. If backend source or fixtures changed, run its required `bun run check` and `bun run db:check` as well.
   - [x] Use configured Next DevTools on port 3100 after restoring the normal preview. The checkout matched, `/#guidance-heading` was open, and configuration/session errors were empty.

5. **Reconcile verified documentation** — _(role: fullstack)_ — feature evidence and accurate tracker status.
   - [x] Delegate documentation reconciliation to `spec-updater`, with ownership of this feature spec, spec index, root spec, development guidance and roadmap copies. Preserve incomplete acceptance and unresolved gates.
   - [x] Record executed commands, counts, intentional skips, capture locations and runtime inspection in the feature spec. P1-14/P1-18 remain unchecked and the count remains 28/30.
   - [ ] Edit frontend ROADMAP first and synchronize backend ROADMAP. Keep deployment and portfolio items unchecked; update root spec to reflect only verified public completion. No TECH_STACK update is needed unless tools actually change.
   - [ ] Run formatting on changed Markdown, `git diff --check` in both repositories, and review final diffs for implementation/spec consistency. Prepare reviewable changes; publishing or merging is a separate action.

---

## ✅ Acceptance Criteria

**Functional**

- [ ] Homepage search, featured results, empty/failure states and guidance meet the feature spec.
- [ ] Public search → listing → detail → inquiry and agent/contact journeys work on mobile and desktop.
- [ ] Existing public DTO privacy, inquiry persistence/reconciliation and staff permissions remain intact.

**Non-functional** (performance, security, accessibility, reliability)

- [ ] Width matrix, actual 200% browser zoom, keyboard, focus, reduced motion and visual inspection pass.
- [ ] No extra homepage request/client dependency for guidance; image behavior and streaming search usability are preserved.
- [ ] Quality gates and separate clean legacy/dashboard browser runs pass; documentation records their practical limits.

---

## 🧪 Validation Plan

**Manual tests**

- The automated native-zoom check and open-page runtime inspection have run. Complete visual review of the route/state matrix, keyboard/touch journey and remaining acceptance screenshots is still required.

**Automated tests**

- Frontend `bun run check` and the focused public suite have passed. A clean serial legacy suite and separate dashboard fixture run remain required; backend gates apply if backend executable code changes.

**Rollback / mitigation**

- Revert the homepage/public-layout change and associated tests together. Existing APIs and persisted data require no migration rollback. Keep incomplete acceptance unchecked.

---

## ⚠️ Risks & Open Questions

**Risks**

- **Scope inflation:** a mobile pass becomes a redesign — _Mitigation:_ limit fixes to the accepted matrix and concrete usability defects.
- **Unapproved content/assets:** the mockup contains illustrative content — _Mitigation:_ use the spec's conservative text-led guidance and preserve demo labeling.
- **Test interference:** global featured rules or shared sessions cause false failures — _Mitigation:_ isolate fixture ownership, clean up rules and require a clean serial run.
- **Release overclaim:** 30/30 features is confused with a live release — _Mitigation:_ keep deployment/demo-delivery acceptance separate.

**Open questions** _(blockers for implementation)_

- Review the proposed text-led guidance section and copy in the spec before implementation. No new API, infrastructure or imagery decision is required under that proposal.
