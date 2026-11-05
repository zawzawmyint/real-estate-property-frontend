# 🛠️ Phase 1 Review Remediation Plan

> **Goal:** Resolve the ten selected November 4 review findings through small code fixes, reliable tests and reconciled documentation.

---

## 🎯 Objective

Make gallery titles readable, unblock uncertain property inquiries, define production inquiry ingress, consolidate staff validation and make release evidence reliable. Implementation, repository checks, the complete serial regression, separate dashboard acceptance and guarded runtime checks are verified. Git-delivery acceptance remains open.

---

## 📦 Scope

**In scope**

- The ten findings selected in the [frontend spec](../../../specs/phase-one-review-remediation/spec.md), with corresponding backend spec and backend-owned contract in the companion repository at `specs/phase-one-review-remediation/`.
- Focused regressions, repository gates, full release regression evidence and documentation/Git delivery preparation.

**Out of scope**

- Cookie-name deduplication, redesigns, new business features, schema migrations, deployment and unrelated working-tree changes.
- Automatic commit, push or Phase 1 closure.

---

## ⚙️ Assumptions & Constraints

**Technical**

- Frontend and backend remain independent repositories. Work with the existing primitives, receipt helper, transaction layer and test fixtures; no new dependencies.
- Current HEADs at inspection: frontend `7a97dbb`, backend `3690d3a`, both with local changes. Capture status and reviewed diffs before implementation; do not discard or stage unrelated work.
- Implementation follows the repository-specific skills and current library documentation where needed. No dependency or API data-shape migration was introduced.

**Product / Business**

- Planned policy: require signed inquiries in production and retain unsigned socket fallback only outside production. The user confirmed on 2026-11-05 that inquiries currently come only from the frontend, resolving caller compatibility.
- Preserve historical review results; current summaries must distinguish failed, partial and clean evidence. P1-14/P1-18 stay open until complete acceptance is verified.

**Dependencies**

- Disposable backend fixtures, a supported browser, the existing fault-control proxy, port 3100 runtime inspection and backend health on 4311.
- Separate exact-data dashboard fixture. Git commit requires separate authorization; prepare a reviewable scoped delivery first.

---

## 🧩 Proposed Approach

- Prefer small changes using existing UI and transaction boundaries. Documentation-only closure leaves user-facing issues; broad auth/form redesign adds unnecessary risk.
- Frontend UI: [gallery](../../../src/features/properties/public/property-gallery.tsx), [property inquiry card](../../../src/features/leads/public/property-inquiry-card.tsx), [agency inquiry reference](../../../src/features/leads/public/agency-inquiry-card.tsx) and [receipt helper](../../../src/features/leads/data/submissions.ts).
- Frontend tests: [long content](../../../tests/e2e/public-long-content.spec.ts), [homepage shortcuts](../../../tests/e2e/homepage-redesign.spec.ts), existing inquiry/receipt coverage.
- Backend files, relative to its repository: `src/modules/leads/inquiry-limiter.ts`; proposed `src/modules/auth/staff-actor.ts`; `src/modules/leads/leads.repository.ts`; leads/viewings/tasks/dashboard services. `requireCurrentStaff(identity: Actor, tx: Transaction): Promise<Actor>` owns transaction-scoped session/user validation; keep the current Actor type and native `requireStaff` middleware.
- Data flow: public form → existing Server Action and signed server relay → Express Origin/relay/limiter/schema checks → existing atomic inquiry persistence. Only unsigned production ingress changes; payloads, acknowledgements and replay remain compatible.
- Docs: [completion spec](../../../specs/phase-one-public-completion/spec.md), [review](../../reviews/2026-11-04-project-review.md), [roadmap](../../../ROADMAP.md), feature indexes, backend inquiry contracts/OpenAPI and frontend generated snapshots. Shared status is synchronized while repository-local links remain valid.

---

## 🚀 Execution Plan

1. **Establish the scoped baseline** — _(role: fullstack)_ — review both dirty trees, record HEADs and relevant diffs, and isolate delivery work without losing local edits. Use the confirmed frontend-only inquiry source and signed-only production policy in the two feature specs and backend contract. Output: an attributable candidate with the ingress compatibility question resolved.
2. **Wrap gallery titles** — _(role: frontend)_ — extend the maximum-length gallery case to fail on ellipsis/clipping/Close overlap at 320px and 390px, then replace `truncate` with wrapping and unbroken-word handling. Preserve image/navigation/focus behavior; review narrow-screen captures. Output: full title visible and controls usable, verified by focused browser tests.
3. **Recover uncertain property inquiries** — _(role: frontend)_ — add behavioral coverage for uncertain send → identical retry, later definite failure, edit cancellation, edit confirmation, fresh next ID, preserved values and active cooldown. Reuse `receiptAfterFailure` and the agency card's confirmation pattern. Disable edit during pending sends; preserve same-receipt retries without automatic writes. Output: visitors can safely retry or knowingly begin an edited inquiry.
4. **Enforce production inquiry signatures** — _(role: backend)_ — first add production/nonproduction tests in `tests/inquiries.test.ts` and `tests/agency-inquiries.test.ts`; then reject missing production relay headers before rate-limit consumption/writes. Cover missing/partial/malformed/wrong signature, valid signed creation/replay, shared rate budget and development fallback. Update backend contract/OpenAPI descriptions and generate frontend snapshots using existing commands. Output: explicit ingress policy with unchanged data/replay semantics.
5. **Consolidate current staff validation** — _(role: backend)_ — add `staff-actor.ts` and its transaction-aware helper, move the existing actor lookup into auth ownership, and replace the three `current()` copies. Remove only unused lead repository methods/imports. Move dashboard current-actor validation and refreshed-role scoping into its aggregate transaction. Extend existing service ownership/concurrency/dashboard tests for deleted/expired/revoked sessions, disabled/banned/non-staff users, changed roles and credential versions, including changes after actor capture. Output: one implementation with preserved transaction and resource permissions.
6. **Split shortcut browser cases** — _(role: frontend)_ — replace the seven-destination loop in `homepage-redesign.spec.ts` with seven named parameterized tests, each loading once and following its actual shortcut. Retain sale purpose, exact filter URL and results-heading assertions. Run applicable desktop/mobile cases serially; record the changed registered-case count. Output: each destination has its own existing timeout budget, with no increased timeout or reduced assertions.
7. **Run candidate verification** — _(role: fullstack)_ — run `bun run check` in each repository; focused gallery/inquiry/shortcut cases; then `bun run test:e2e --workers=1` with fresh documented fixtures and no early stop. Restart the exact-data fixture and run dashboard separately. Inspect the expected checkout on port 3100 with an affected page open and backend health on 4311. Record commands, candidate/diff identity, counts, skips, failures and reviewed screenshots. Output: current evidence; failures remain open rather than being pooled into a pass.
8. **Reconcile documentation and delivery** — _(role: fullstack)_ — after code/tests settle, delegate final documentation reconciliation to the global `spec-updater`, with ownership of affected specs, indexes, contracts, development docs, review follow-up and roadmaps; avoid concurrent edits to those files. Review its diff/gaps. Update frontend roadmap first, reconcile backend status and replace frontend-only backend links with companion-repository text; verify every backend roadmap relative file link. Label old evidence historical, remove stale summaries/branch claims, reference approved guidance imagery and identify local-only traces. Prepare the review/spec/verification plan together for a scoped Git commit if authorized. Output: accurate docs and reviewable delivery; uncommitted-evidence acceptance stays open until the commit exists.

---

## ✅ Acceptance Criteria

**Functional**

- [x] Gallery titles wrap at 320px/390px with working controls; uncertain property inquiries support explicit same-receipt retry and confirmed edit-as-new.
- [x] Both production inquiry routes require valid signatures; nonproduction fallback, safe errors, replay and rate limits meet the backend contract.
- [x] Leads/viewings/tasks/dashboard use shared current-staff validation with refreshed role and existing ownership rules.
- [x] All seven shortcut destinations retain actual navigation and exact URL/result checks in independent tests.
- [x] Completion spec, guidance wording, roadmaps and backend links agree with verified evidence.
- [ ] A reviewed, separately authorized Git commit includes the review evidence, verification plan and affected specs together.

**Non-functional** (performance, security, accessibility, reliability)

- [x] No secrets or private fields exposed; validation stays transaction-scoped and no automatic inquiry retry is introduced.
- [x] Keyboard/focus/dialog behavior, pending duplicate guards and rate-limit cooldown remain correct.
- [x] Required checks and candidate-specific release runs pass; the broader P1-14/P1-18 and uncommitted Git-delivery criteria remain open.

---

## 🧪 Validation Plan

**Manual tests**

- Inspect full maximum-length gallery titles and Close/arrows/focus at 320px/390px. Check inquiry recovery copy, confirmation/cancel behavior and preserved editable values.
- Confirm runtime project identity on port 3100 and backend health on 4311. Verify backend roadmap links from within that repository.

**Automated tests**

- First reproduce each behavior with focused failing regression coverage, then apply the minimal fix and rerun it.
- Frontend/backend: `bun run check`. Frontend focused runs use `bun run test:e2e tests/e2e/public-long-content.spec.ts tests/e2e/homepage-redesign.spec.ts --workers=1`, plus inquiry recovery cases added to the existing property suite.
- Backend focused runs: `bun run test -- tests/inquiries.test.ts tests/agency-inquiries.test.ts` and existing ownership/concurrency/dashboard suites. Verify service-level stale-actor cases as well as HTTP middleware behavior.
- Run one complete serial legacy suite under its documented fixture configuration and separate dashboard acceptance with the exact-data fixture; do not combine those fixtures or label a failing run clean. New parameterized tests change the old 388 registered-case total.
- Run scoped Markdown formatting/link checks on new documents during drafting. Review coverage against frontend F01–F09 and backend B01–B06; gaps remain explicitly open.

**Rollback / mitigation**

- Revert each code slice with its tests and contract notes; preserve unrelated edits and evidence. No database rollback is expected. Coordinate production ingress rollout with signed frontend support.

---

## ⚠️ Risks & Open Questions

**Risks**

- **Risk:** Unsigned direct production integrations stop working — _Mitigation:_ the user confirmed no such current callers; verify the signed frontend path before enforcement and require future integrations to use a trusted server relay.
- **Risk:** Editing an uncertain inquiry creates a duplicate — _Mitigation:_ explicit confirmation explains the possibility; retry retains the old receipt, editing uses a new one and cooldown remains active.
- **Risk:** Shared auth cleanup weakens revocation timing or dashboard scope — _Mitigation:_ keep helper calls and role-derived queries inside the supplied transactions and test stale actor state.
- **Risk:** Dirty trees and historical evidence cause false completion claims — _Mitigation:_ scoped diffs, candidate identity, no blanket staging and unchecked acceptance until verified.

**Open questions** _(blockers for implementation)_

- None for inquiry caller compatibility: the user confirmed frontend-only submissions on 2026-11-05. Implemented policy: production signed-only, nonproduction socket fallback.
- Git commit authorization is separate from implementation; a commit is needed to close the uncommitted-evidence item, while preparing the scoped files can proceed independently.
