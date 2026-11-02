# Public agency pages redesign

Status: Delivered with one validation limitation on 2026-11-02. Approved references 1, 5 and 9 are implemented; native 200% browser zoom remains unverified.

## Goal

Upgrade `/agents`, `/agents/[slug]` and `/contact` to the selected designs while retaining the existing public catalog, agency enquiry safeguards and shared public-site identity.

## Scope

- `/agents`: image 1's three-column portrait cards, languages, outlined profile links and compact agency enquiry form below the directory.
- `/agents/[slug]`: image 5's full-width identity heading, specialties/languages column, central biography and right-hand portrait, followed by a brand statement.
- `/contact`: image 9's maroon introduction/illustration panel and open ivory enquiry area, connected directly to the header and existing footer.
- Responsive layouts, loading/empty/outage states, portrait fallbacks, meaningful demo disclosures, keyboard access and shared button states.
- An additive backend directory projection of already-public catalog languages; see Contracts and access. No migration or new endpoint.
- Reuse existing portraits. Produce one standalone optimized contact-interior illustration during implementation, with provenance; never crop a UI mockup into a live asset.

Excluded: CRM redesign, homepage/property-page redesign, new ratings/credentials/statistics, agent-owned listings, direct enquiry assignment, search/pagination for the bounded directory, booking, WhatsApp/email delivery, real-business publication, deployment and new dependencies.

## User flow

1. Browse published advisors and follow a name or View profile link to its real slug. The directory remains useful with 0–24 published profiles rather than assuming the three demo records.
2. Read a profile's authored biography, specialties and languages. Meet the team returns to `/agents`; Send a property enquiry opens `/contact`. Profile image 5 has no inline form.
3. Submit an agency enquiry from either the directory or Contact using full name, explicit Buy/Rent intent, at least one contact method and a message. Both entry points use the same existing submission controller and endpoint.
4. Preserve pending/disabled controls, validation-summary focus, success/Send another, cooldown, uncertain-response retry and confirmed edit-as-new behavior. Catalog failure must not make enquiry submission disappear or erase a saved receipt.
5. Unknown/unpublished/malformed profiles remain real 404s; content outages retain recovery instead of posing as missing profiles. Missing/broken portraits show the existing accessible fallback.

## Contracts and access

The backend remains responsible for validation, publication, persistence, permissions and unassigned Website/New lead creation. Catalog profiles remain independent of staff accounts.

- Current authority: backend `specs/public-contact-and-agents/contract.md`; frontend-local [current contract snapshot](../../docs/contracts/public-contact-and-agents.md).
- Delivered additive change authority: backend `specs/public-agency-pages-redesign/contract.md`; its baseline contract and frontend snapshots/generated declarations are synchronized.
- `GET /api/v1/public/agency`: unchanged `PublicAgency`, including nullable approved contact/office fields and `isDemo`.
- `GET /api/v1/public/agents`: retain `{ items, total }` and add required `languages: string[]` to each `PublicAgentSummary`. The array contains 0–8 catalog strings of 1–80 trimmed characters, in authored order. Existing public name/slug order and 24-profile bound remain unchanged.
- `GET /api/v1/public/agents/:slug`: unchanged detail response, which already includes languages, introduction, biography and nullable public phone/email.
- No per-card detail reads, hardcoded language lists or imports from the sibling repository. Deploy the additive backend response before the new frontend; during rollout, a missing/empty languages value should omit the row safely.
- `POST /api/v1/public/inquiries`: unchanged `{ submissionId, name, purpose, phone?, email?, message }`, with `purpose: "sale" | "rent"`, name 1–120, required message 1–2000 and phone-or-email validation/normalization as defined in the existing contract. Buy maps to `sale`; neither page silently defaults intent.
- Preserve 201/200 receipt success, conflict handling, rate limiting/Retry-After, public relay/Origin rules and uncertain-save recovery. Do not add property, agent, assignment, budget or staff identifiers to the payload, or expose lead IDs.
- Preserve demo-aware/unknown-mode messages and current noindex rules. Only render direct contact/office/map values when the public catalog actually supplies them, using existing safe link helpers.

During implementation update backend OpenAPI, the existing backend contract, frontend-local contract/OpenAPI snapshots and generated `public-agency.d.ts` together. Never edit generated declarations by hand.

## Design

### Pinned references

These are the exact selections from the latest nine displayed images, not the earlier three-page set:

- Image **1**, directory: [agent-directory-reference.png](agent-directory-reference.png), generated result `exec-bf30ee81-654d-46f1-9f40-d318b4d20d5a`.
- Image **5**, profile: [agent-profile-reference.png](agent-profile-reference.png), generated result `exec-d87b8258-c8c6-4503-9716-4f3c294c5edf`.
- Image **9**, Contact: [contact-reference.png](contact-reference.png), generated result `exec-d427a9ba-2bae-4775-8689-76856851769a`.

Reference files are design evidence, not page backgrounds or production image assets. Existing header/footer, Lora/Poppins typography and maroon/ivory/charcoal tokens remain shared. Scope page-specific CSS so property pages, homepage, authentication and CRM retain their delivered treatments.

### Directory — image 1

- Compact blush heading connected to the header, breadcrumb, “People behind your next move.” and readable demo-team disclosure.
- Three equal cards at desktop, two at medium widths and one at narrow widths. Consistent portrait crops, restrained borders/radii, names, roles, up to two existing specialty tags and a wrapping Languages row when available. Cards stretch so profile actions align without clipping long names or reserving fixed text heights.
- Use shared outlined View profile links with distinct accessible names that include the visible words and advisor name.
- Below the cards, place the selected compact horizontal enquiry section: introduction on the left, fields on the right. Stack naturally on narrow screens. Buy/Rent radios have a visible group label, no implicit selection and the same schema as Contact.
- Load the directory and the agency enquiry context independently, with scoped placeholders/recovery. A list outage or valid empty result must not remove the enquiry entry point. Preserve one form instance and unique label/control IDs per page.

### Profile — image 5

- Identity heading across the page; facts at left, authored introduction/biography and primary enquiry navigation centrally, portrait on the right at wide widths. Reflow to a readable single column with a logical DOM/tab order on mobile; no 3-column compression on small screens.
- Render all supplied specialties/languages, wrapping long entries. Hide empty groups. Existing published direct channels remain conditional supporting actions, never fabricated values.
- Use catalog biography/introduction rather than the generated mockup's claims. The lower pull quote may use the selected aspirational line, “A home is more than a place — it’s the foundation for the life you want to build in Dubai.” Treat it as unattributed brand copy, not an agent quotation, credential or testimonial.
- Remove the extra `AgencySupport` CTA from this composition; retain the existing closing footer once. Do not embed image 6's enquiry rail.

### Contact — image 9

- Full-width split surface directly under the header: approximately 40% maroon introduction/illustration and 60% ivory form at desktop. Shared content alignment and comfortable padding replace the current enclosing contact card.
- Intro headline “Tell us what home means to you.”, concise buying/renting guidance, standalone illustrative interior with caption and an inverse outlined Meet our agents link. The image depicts a home, never a claimed agency office.
- Ivory area contains breadcrumb, Send a property enquiry heading, accurate demo/unknown-mode notice and the existing fields. Name/intent and phone/email pair at wide widths; Message spans the form. Contact keeps its select with an unselected intent prompt.
- Keep phone-or-email help, privacy copy, safe feedback and the primary Send enquiry action visible in normal page flow. No fixed card height or internal form scrollbar.
- On mobile prioritize the introduction and reachable form; keep decorative media/supporting content subordinate. Maintain logical reading and focus order. Approved direct contact/office details, if later configured, remain supported in the introduction/support region without inventing placeholders or loading a map script.

### Reuse and accessibility

- Keep `AgentCard`, `AgentPortrait`, `AgencyInquiryCard`, shared labelled fields, `Alert`, `SubmitButton`, `Button` and `buttonVariants`. Add only a feature-local directory enquiry wrapper for its server-read composition.
- Extend the existing `AgencyInquiryCard` with a small optional presentation choice (`"contact" | "directory"`, default `"contact"`) to change layout/intent-control presentation. Retain one validation/submission/receipt implementation; keep it mounted through catalog recovery.
- Primary/secondary/inverse actions follow the [shared button specification](../button-consistency/spec.md), including the sliding dark gradient, disabled states, light focus on maroon and reduced motion.
- Use semantic headings, lists and labels, descriptive portrait alt/fallbacks, readable contrast, minimum 44px actions and no horizontal page overflow. Test long content and genuine browser zoom separately from narrow viewport reflow.

## Acceptance criteria

- [x] The three routes visibly match pinned images 1/5/9 at desktop and have reviewed mobile compositions.
- [x] Directory cards expose real languages from one list response; empty languages are omitted and no N+1 detail fetches occur. Published sorting/privacy/empty/error behavior is preserved.
- [x] Directory includes the selected compact enquiry form; directory and Contact share one existing submission implementation with explicit Buy/Rent intent and valid, unique accessible labels.
- [x] Both enquiry entry points pass validation, phone-only/email-only, pending duplicate prevention, success/reset, cooldown, lost-response replay and edit-as-new recovery checks without erasing state during catalog recovery.
- [x] Profile 404/outage distinction, biographies, optional facts/channels, portrait fallback, demo disclosures and noindex rules remain correct. No fabricated metrics or profile assignment is introduced.
- [x] Contact has the selected maroon/ivory split, real standalone illustrative asset/provenance, reachable submission and safe conditional catalog details; no nested scrollbar.
- [ ] Keyboard, inverse focus, reduced motion, long text, 320/390/640/768/1024/1440/1480px widths and native 200% browser zoom are checked without clipped fields/actions. Native 200% zoom is explicitly unverified: Windows browser automation stopped because it could not determine the current page URL with enough confidence to continue.
- [x] Backend contract/projection tests, frontend API drift, required quality/build checks, integrated public-agency/CRM enquiry smoke tests and unaffected public/CRM button regressions pass.
- [x] Runtime inspection and side-by-side reference comparisons are recorded; specs, contract snapshots and shared roadmap copies are reconciled without changing unrelated completion counts.

## Validation

Extend backend `tests/public-agency.test.ts` for the new summary whitelist, detached array projection, bounds, empty languages, publication/order and unchanged detail shape. Reuse existing inquiry tests; no persistence change is planned.

Extend frontend `tests/e2e/public-agency.spec.ts` for both enquiry entry points, list languages, selected layouts, null/empty/long catalogs, no N+1, keyboard navigation, portrait/illustration failure, loading/outage recovery and demo/noindex behavior. Use existing unit suites `public-agency-api`, `public-agency-presentation`, `agency-inquiry` and `agency-inquiry-presentation` where they own changed contracts or state. Exercise shared button and public-page regressions without duplicating implementation-shaped tests.

Run backend `bun run check`; frontend `bun run api:generate`, `bun run api:check`, lint, formatting, typecheck, unit tests and production build; then integrated browser checks against the disposable backend fixture. Use an isolated source snapshot/build if the user-owned development server is running. Confirm normal port 3100 project identity and active-page errors/metadata through Next DevTools, and compare all three pages with their selected references. Do not count equivalent-width checks as native zoom evidence.

## Rollout and risks

Backend-first additive deployment; old frontends ignore the additional language field. No database migration, catalog rewrite, new dependency, environment variable or business permission. Existing contact content publication gates remain in effect. A frontend rollback can retain the additive backend projection safely; rollback of the projection can follow after frontend compatibility is restored.

Shared enquiry presentation is the main regression risk: preserve stable state, receipt IDs and contact-mode messages while changing only markup/layout. The directory can contain up to 24 profiles and long arrays, so do not hardcode demo counts or narrow text widths. A generated mockup is not authority for new payload fields, real credentials or new contact channels.

No unanswered product blocker: selected visuals and the small languages projection are specified. The earlier native browser zoom automation limitation is a validation risk, not evidence of acceptance. Preserve all existing uncommitted property/button work; implementation isolation must be arranged without discarding it.

## Delivery evidence

- The public directory, profile and Contact routes implement references 1, 5 and 9 respectively. The directory retains independent enquiry submission during catalog empty/error states; profile content uses authored catalog biography/languages; Contact uses a full-height maroon/ivory split with conditional, honest office/contact content.
- `contact-interior.webp` is a standalone 1200 × 900 WebP illustration (141,868 bytes); its source/provenance is recorded beside the asset. It is not a cropped mockup.
- The backend summary projection, backend OpenAPI, baseline contract, frontend contract/OpenAPI snapshots and generated declaration all include `PublicAgentSummary.languages`.
- Backend `bun run check` passed with 128 tests in 35 files. Frontend API drift, Prettier, lint, Next type generation, TypeScript, 288 unit tests in 46 files and an isolated Webpack production build passed. The final isolated serial browser suite had no failed tests; focused follow-up coverage passed five cases with three intentional skips, and the final source review’s 29 targeted tests passed.
- Normal-route runtime inspection found no configuration or session errors. Visual review covered desktop and narrow captures for all three routes against the pinned references; see [design QA](design-qa.md).
- The only remaining validation gap is canonical native 200% browser zoom. Browser automation could not verify it because Windows URL identification stopped the control session; this was a tooling limitation, not an application failure or approval rejection. Equivalent-width and enlarged-text checks do not close this criterion.
