# 🧭 Public Agency Pages Redesign Plan

> **Goal:** Implement selected images 1, 5 and 9 for the directory, profile and Contact page while preserving enquiry safety and adding real directory languages through one additive API change.

---

## 🎯 Objective

Bring the remaining public pages into the updated site design. This delivery implements the [frontend specification](../../../specs/public-agency-pages-redesign/spec.md); existing verified contact/inquiry behavior remains the baseline. Canonical native 200% browser zoom remains an explicit verification gap.

---

## 📦 Scope

**In scope**

- Image **1**: equal portrait cards, real languages, outlined profile links and the compact directory enquiry form.
- Image **5**: full-width identity heading; specialties/languages, biography and right-hand portrait in an editorial layout.
- Image **9**: full-width maroon/ivory Contact split, standalone illustrative interior and the shared enquiry form.
- Responsive/state/accessibility work and additive directory `languages` projection, with synchronized API documentation/types.

**Out of scope**

- CRM, homepage/property redesign, real-business content publication, agent assignment, ratings/metrics, new delivery channels, database migrations, dependencies and deployment.

---

## ⚙️ Assumptions & Constraints

**Technical**

- Keep Next.js/React, existing Base UI primitives, Express ownership and the installed Webpack workflow. Read the installed Next guides before code changes; use current library documentation when API-specific work requires it.
- Reuse `AgencyInquiryCard` state/validation/actions/receipts; presentation changes must not fork submission logic or remount a completed/uncertain form during catalog recovery.
- The list API currently omits languages. Add this public field once; never fetch every profile or hardcode language data. Backend-first delivery is additive, with defensive frontend omission during rollout.
- Preserve all current uncommitted property/button work. Arrange the implementation branch/worktree from the reviewed workspace state without discarding it. Do not stop the user-owned development server for builds.

**Product / Business**

- Use the three [pinned references](../../../specs/public-agency-pages-redesign/spec.md#pinned-references) from the latest nine-image set. Mockup prose and selected controls do not override authored catalog facts or enquiry validation.
- Keep fictional-demo/noindex behavior and null-contact honesty. Enquiries go to the agency as unassigned Website/New leads; explicit Buy/Rent intent and a message remain required.
- Reuse shared primary/outline/inverse buttons and existing header/footer. Keep the footer once on each page, without extra competing support banners.

**Dependencies**

- Existing public catalog and enquiry endpoints, current portraits and public-agency browser fixtures.
- Backend-owned delivered delta: workspace `backend/specs/public-agency-pages-redesign/contract.md`; the baseline contract remains authoritative for the rest of the API.
- One new contact illustration generated/optimized during implementation; document provenance and never crop it from a UI mockup.

---

## 🧩 Proposed Approach

- **Backend projection:** modify workspace `backend/src/modules/agency/agency.dto.ts` so `publicAgentSummaryDto` returns a copied `languages` array. Preserve the existing detail wire shape; keep service, routes, catalog validation and persistence behavior intact. Update `backend/docs/api/openapi.yaml`, the existing backend contract and `backend/tests/public-agency.test.ts`.
- **Frontend contract:** synchronize [public-agency OpenAPI](../../../docs/contracts/public-agency.openapi.yaml) and [contract snapshot](../../../docs/contracts/public-contact-and-agents.md), then regenerate [public-agency declarations](../../../src/lib/api/generated/public-agency.d.ts). Existing [agency types/reads](../../../src/features/agency/data/types.ts) remain the boundary.
- **Shared form:** extend [AgencyInquiryCard](../../../src/features/leads/public/agency-inquiry-card.tsx) with optional `presentation: "contact" | "directory"`, default `"contact"`. Change markup/intent-control presentation only; reuse [existing actions](../../../src/features/leads/data/actions.ts), schemas and receipt recovery. Directory radios and Contact select both submit `sale`/`rent` through the same schema.
- **Directory:** update [agents route](<../../../src/app/(public)/agents/page.tsx>), [AgentDirectory](../../../src/features/agency/public/agent-directory.tsx), [AgentCard](../../../src/features/agency/public/agent-card.tsx) and relevant [loading states](../../../src/features/agency/public/agency-states.tsx). Add a feature-local `src/features/agency/public/directory-enquiry.tsx` server component for the independent agency-context/form region. Use the existing cached `getPublicAgency()` read and keep the form available on context failure.
- **Profile:** update [AgentProfile](../../../src/features/agency/public/agent-profile.tsx) while preserving [profile route/metadata](<../../../src/app/(public)/agents/[slug]/page.tsx>) and [AgentPortrait fallback](../../../src/features/agency/public/agent-portrait.tsx). Use API biography and a clearly unattributed brand statement; omit the old additional `AgencySupport` block.
- **Contact:** update [Contact route](<../../../src/app/(public)/contact/page.tsx>), [ContactContent](../../../src/features/agency/public/contact-content.tsx) and scoped [public styles](<../../../src/app/(public)/public.css>). Produce `public/images/agency/contact-interior.webp` and its README. Retain configured direct-channel/office conditionals and unknown-mode form continuity.
- **Flow:** server catalog reads → published DTOs → page components; either form → existing Server Action/relay → `POST /api/v1/public/inquiries` → existing receipt/unassigned lead. No new routing or assignment contract.

---

## 🚀 Execution Plan

1. **Expose directory languages** — _(role: backend)_ — Extend `tests/public-agency.test.ts` with exact summary keys, real/empty/max-length language arrays, detached-copy behavior and unchanged detail/publication/order/privacy checks. Implement the minimal DTO/OpenAPI delta and merge the proposed contract into the current contract. Run focused tests and `bun run check`; expect no migration.
2. **Synchronize the consumer contract** — _(role: fullstack)_ — Update frontend-local contract/OpenAPI snapshots; run `bun run api:generate` and `bun run api:check`. Check affected typed fixtures and `public-agency-api` tests. The generated declaration must expose directory languages without changing enquiry inputs or profile-detail output.
3. **Prepare the two form presentations** — _(role: frontend)_ — Add focused presentation/validation tests for Directory radios and Contact select, no default intent, phone/email/message rules and exactly one labelled form per page. Extend the existing component without changing receipt/duplicate/cooldown logic. Verify unknown-mode recovery keeps typed values and the original receipt. Reuse existing inquiry tests rather than duplicating the controller.
4. **Deliver directory image 1** — _(role: frontend)_ — Implement the compact heading, 3/2/1-column cards and independent directory enquiry region. Extend `tests/e2e/public-agency.spec.ts` for languages/no detail fan-out, 0/1/3/24 profiles, long names/languages, empty/outage recovery and inline enquiry success. Prove card actions remain reachable and align without truncating content.
5. **Deliver profile image 5** — _(role: frontend)_ — Implement the identity band and facts/biography/right-portrait layout, responsive reading order, real catalog content and lower brand statement. Verify real 404 versus 503, empty specialty/language lists, configured/null direct channels, long biography, broken portrait and navigation. Do not add image 6's inline form or invented credentials.
6. **Deliver Contact image 9** — _(role: frontend)_ — Generate a standalone warm residence illustration, optimize to WebP with recorded source/dimensions and a target of at most 160KB, then implement the full-width split and open form. Keep the image labelled illustrative, preserve null/configured contact behavior and ensure the form remains reachable on small/short viewports with no internal scrollbar. Exercise Contact unknown-mode, demo success and catalog-recovery receipt retention.
7. **Verify the integrated delivery** — _(role: fullstack)_ — Run backend `bun run check`; frontend API drift, lint, formatting, typecheck, unit tests and isolated production build. Run `public-agency.spec.ts`, shared-button and public/component/long-content regressions serially against a disposable backend; add targeted directory enquiry tests for success, held/double submission, 429, lost-response replay and confirmed edit-as-new. Verify one unassigned lead/receipt, not just UI success. Inspect active pages through Next DevTools on the identified normal checkout.
8. **Reconcile and review** — _(role: fullstack)_ — Compare all three pages side by side with pinned references at desktop/mobile and record actionable differences. Verify keyboard, inverse focus, reduced motion and actual native 200% zoom separately from equivalent-width checks. Delegate final documentation reconciliation to `spec-updater`, review its diff, sync shared ROADMAP copies and record exact evidence/limitations. Tick criteria only after proof; do not automatically commit, push or publish.

---

## ✅ Acceptance Criteria

**Functional**

- [x] Directory, profile and Contact match the selected structures, including image 1's enquiry section and languages.
- [x] Backend summary languages and frontend generated types agree, with no per-card profile reads and no exposed private fields.
- [x] Both forms retain explicit intent, validation, deduplication, success/reset, cooldown and receipt/edit recovery; directory enquiries remain property-independent and unassigned.
- [x] Empty/unavailable catalogs, profile 404s, missing portraits and conditional contact details retain honest recovery/navigation.

**Non-functional** (performance, security, accessibility, reliability)

- [x] Long content and 320/390/640/768/1024/1440/1480px layouts have no horizontal overflow or clipped actions; the complete form scrolls with the page.
- [ ] Keyboard reading/focus order, 44px actions, dark-surface focus contrast and reduced motion are verified. Native 200% browser zoom is unverified because Windows browser control stopped when it could not determine the current URL with enough confidence.
- [x] Shared-shell/button regressions, both repositories' required checks and runtime diagnostics are recorded without claiming unrelated backlog completion. Visual comparison is recorded in the feature QA note.

---

## 🧪 Validation Plan

**Manual tests**

- Compare exact references at 1440/1480px and reviewed narrow layouts; inspect loaded/broken imagery, real array lengths, one/many cards and form controls. Check 810px-height desktop and 320px-width reachability.
- Tab through cards, profile navigation and both forms; test screen-reader labels/error links, inverse focus and native 200% zoom. If browser automation cannot prove native zoom, document the unresolved check.
- Open each affected page in the normal port-3100 checkout, confirm project identity and query active-session errors/page metadata. A missing browser session does not count as a clean result.

**Automated tests**

- Backend projection/publication/privacy tests and existing agency-inquiry tests; backend `bun run check`.
- Frontend API generation/drift plus `bun run lint`, `bun run format:check`, `bun run typecheck`, `bun run test`, `bun run build`.
- `bun run test:e2e -- tests/e2e/public-agency.spec.ts tests/e2e/button-consistency.spec.ts tests/e2e/public-component-reuse.spec.ts tests/e2e/public-long-content.spec.ts --workers=1` with the existing disposable fixture setup. Add any new cases to the owning public-agency suite; use targeted public-property tests if shared CSS changes affect them.

**Delivery evidence**

- `GET /api/v1/public/agents` now returns a detached `languages` array in each summary. Backend OpenAPI, baseline contract, frontend snapshots and generated frontend types agree; no migration, dependency, authentication, inquiry or assignment change was introduced.
- The shared enquiry controller has two presentations: Contact keeps its unselected intent select, while Directory uses explicit unselected Buy/Rent radios. Both preserve validation, duplicate prevention, receipts, cooldowns, uncertain-save retry and edit-as-new recovery.
- Frontend verification passed: API drift, Prettier, lint, Next type generation, TypeScript, 288 unit tests in 46 files, and an isolated Webpack production build. Backend `bun run check` passed with 128 tests in 35 files.
- The final isolated serial browser suite passed with no failed tests across agency, directory-enquiry, shared-button, public completion/component reuse and property-page regression coverage. A focused follow-up passed five cases with three intentional skips; the final source review found no actionable findings and its 29 targeted tests passed.
- Runtime inspection of the normal checkout found no configuration or session errors. Native 200% browser zoom is excluded from the pass claim: Windows browser control stopped because it could not confidently identify the current browser URL. This was a tooling limitation, not an application failure or approval rejection.
- Roadmap checklist counts remain 28/30; P1-14 and P1-18 remain unchecked. No commit, push, deployment or real-business publication is claimed.

**Rollback / mitigation**

- Revert scoped page/form presentation changes while retaining existing inquiry state contracts. The additive backend field may safely remain for old clients.
- If reverting the field too, restore frontend compatibility first and regenerate matching snapshots/types. No database rollback is needed.
- Preserve the running user's `.next`; use an isolated build snapshot and stop only owned verification processes. Keep production settings and credentials out of test artifacts.

## ⚠️ Risks & Open Questions

**Risks**

- **Risk:** Shared form layout changes erase an uncertain or completed receipt when catalog context recovers. — _Mitigation:_ preserve one mounted controller/key and run held/lost-response and recovery tests from both entry points.
- **Risk:** Generated imagery/prose is mistaken for published profile or office facts. — _Mitigation:_ use catalog biography/flags, approved portraits, illustrative caption and an unattributed brand statement; omit fabricated direct channels/statistics.
- **Risk:** Languages trigger detail-request fan-out or a deployment mismatch. — _Mitigation:_ project the existing array in the list endpoint, backend-first rollout, strict DTO tests and safe missing-array rendering.
- **Risk:** Three demo cards hide issues with 24 profiles, eight long languages or missing groups. — _Mitigation:_ exercise bounded real contracts, wrapping and fallback cases rather than hardcoded demo layouts.
- **Risk:** Previous native-zoom automation limits prevent proving a release criterion. — _Mitigation:_ seek a working/manual native control path and leave that criterion unchecked until proven; narrow widths alone are insufficient.

**Open questions** _(blockers for implementation)_

- None. The selected references, directory form inclusion and additive languages contract are specified. Real-business publication and deployment remain separate work.
