# Phase 1 review remediation

Status: Verified implementation and release checks — Git-delivery acceptance remains pending.

## Goal

Resolve the ten selected findings from the [November 4 review](../../docs/reviews/2026-11-04-project-review.md), with readable mobile gallery titles, recoverable inquiries, consistent staff validation, reliable shortcut tests and accurate release documentation.

## Scope

- In scope: gallery title clipping; conflicting completion spec; uncommitted review evidence; outdated roadmaps; broken backend documentation links; unsigned inquiry fallback; stuck property inquiry form; duplicated staff checks; homepage guidance documentation mismatch; homepage shortcut test timeout risk.
- Backend changes are defined by the companion repository's `specs/phase-one-review-remediation/spec.md` and backend-owned `contract.md` at that location. Each repository remains independently usable.
- Excluded: cookie-name deduplication (not in the selected list), redesigns, new business features, database migrations, production deployment and automatic roadmap closure.
- The existing October remediation specification is historical verified work and must not be overwritten.

## User flow

1. Open a property gallery at 320px or 390px. The entire property title wraps, including maximum-length unbroken text; photo controls and Close remain usable.
2. Submit a property inquiry. On an uncertain response, retain the exact submission ID and payload and offer explicit retry of that same inquiry.
3. Offer “Edit as a new inquiry” with a confirmation explaining that the previous inquiry may already have been saved and submitting again can create another inquiry.
4. Cancel keeps the original receipt, values and uncertain state. Confirm clears the old receipt and uncertain state, preserves entered values for editing, and creates a new submission ID only on the next explicit send. Preserve any active rate-limit cooldown; editing must not bypass it.
5. A definite failure following an uncertain attempt does not prove the original write failed. Preserve the original receipt until confirmed success or the explicit edit-as-new decision. No automatic write retries.

## Contracts and access

- Existing inquiry payloads, validation, safe acknowledgements, origin checks, privacy boundaries and idempotency stay authoritative.
- Production requires both valid relay headers for both inquiry endpoints; unsigned nonproduction requests retain socket fallback. Missing production headers return the existing safe 403 error without writing a lead. The user confirmed on 2026-11-05 that inquiries currently come only from the frontend; no other current caller needs unsigned production access.
- No browser-held secret, public receipt lookup or lead ID is introduced. The frontend's server-only relay remains the supported production path.
- Transaction-scoped staff validation stays backend-owned. No cross-repository source imports.
- Backend contract authority: companion repository `specs/phase-one-review-remediation/contract.md`; frontend documentation snapshots describe the verified behavior.

## Design

- Gallery titles wrap ordinary and unbroken text with room reserved for Close. Initial focus targets the static title to keep the dialog at the top; keyboard trapping, trigger return-focus, photo navigation and image sizing remain intact. Existing dialog primitives are reused.
- Reuse the agency inquiry card's confirmation pattern and `receiptAfterFailure` from `src/features/leads/data/submissions.ts`. Keep property-specific fields and submission coordination in the property card; do not build a generic form framework.
- Split the seven homepage shortcut destinations into independently named parameterized browser cases. Each case loads the homepage once and follows its real link, asserting the exact sale-filtered URL and result heading. Retain the seven assertions; do not increase the timeout or substitute href-only checks.
- Documentation must separate historical attempts from latest verified status. Keep the November 4 review as a dated snapshot, with a follow-up link if needed. Reconcile current summary, long-content/dashboard results, branch references, native zoom evidence, normal-port runtime evidence and guidance photo approval.
- Edit the frontend roadmap first, then synchronize backend IDs, status and dated evidence. Backend links must resolve locally; describe frontend-only references as companion-repository paths in plain text.
- Stage/commit only reviewed delivery files when separately authorized. Do not stage the workspace wholesale, local traces, `.delivery-work`, credentials, databases or generated artifacts. A draft cannot claim the uncommitted-evidence finding resolved.

## Acceptance criteria

- [x] F01: At 320px/390px the full maximum-length gallery title is readable without ellipsis or control overlap, and Close, arrows and keyboard focus work. The initial two-photo run exposed autofocus scrolling Close from view; the minimal title-focused initial-focus fix passed focused coverage and the clean serial run.
- [x] F02: Production rejects missing, partial or invalid relay headers on both inquiry routes; signed production submissions and nonproduction fallback behave as the backend contract specifies.
- [x] F03: Focused browser coverage confirms same-receipt retry and confirmed edit-as-new, including cancel, preserved values, distinct next ID, pending duplicate guard and retained cooldown.
- [x] F04: One transaction-aware backend staff validation implementation is used by leads, viewings, tasks and dashboard, preserving ownership and role rules.
- [x] F05: Seven independent shortcut cases retain exact URL/result assertions without raised timeouts; their focused applicable-project run passed.
- [x] F06: Completion-spec summaries no longer contradict current evidence; historical sections are labelled and guidance references the approved redesign photo.
- [x] F07: Both roadmaps have matching IDs/status and current evidence; backend-local relative links have been reviewed.
- [ ] F08: The review, verification plan and affected specs are included together in the reviewed Git delivery when a commit is authorized; ignored evidence is identified as local-only. Before a commit this criterion remains open.
- [x] F09: Both repository quality gates and focused browser coverage pass; the clean serial legacy regression, exact-data dashboard acceptance and guarded normal-runtime inspection have candidate-specific evidence. This does not close the broader P1-14/P1-18 acceptance matrices.

## Validation

- Extend `tests/e2e/public-long-content.spec.ts` to inspect the gallery's actual title visibility and control geometry at 320px/390px. Review screenshots; a passing scroll-width assertion alone cannot prove removal of ellipsis.
- Extend public inquiry browser coverage for uncertain response followed by retry, definite failure, edit cancellation/confirmation, cooldown and single-save/replay behavior; use disposable fixtures and controlled response faults.
- Use `tests/unit/lead-submissions.test.ts` for existing receipt-helper semantics; add only missing behavioral coverage. Backend tests own production ingress and staff revocation coverage.
- Run `bun run check` in each affected repository, focused browser cases, one fresh serial legacy run and separate exact-data dashboard tests. Record commands, SHAs plus uncommitted-diff identity, counts and intentional skips. Do not pool failures into a clean-pass claim.
- On port 3100, verify the expected checkout using Next DevTools with an affected page open and backend health on 4311. Use existing project browser/runtime tooling.
- Check relative Markdown links and formatting alongside the application verification recorded below. Keep the uncommitted Git-delivery criterion open until an authorized commit exists.

## Rollout and risks

- Recommended approach: small fixes using existing components and transaction boundaries. Broad form/auth redesign adds unnecessary risk; documentation-only closure leaves behavior findings unresolved.
- The frontend-only inquiry source was confirmed by the user on 2026-11-05. Signed-only production ingress is implemented and locally verified; coordinate the signed frontend relay before production rollout. Nonproduction socket fallback is retained without a new configuration flag. Future integrations must use a trusted server relay.
- Shared staff validation must run inside each existing transaction; dashboard role selection must use the freshly validated actor inside its aggregate snapshot.
- Isolate the already modified working trees before implementation. Never revert or commit unrelated changes.
- Revert each failing code slice with its associated tests and contract notes. No database rollback is expected. Relaxing a production relay restriction requires an explicit compatibility decision.
- Plan: [implementation plan](../../docs/superpowers/plans/2026-11-05-phase-one-review-remediation.md).

## Implementation evidence

- Historical candidate identity before the gallery focus fix: frontend HEAD `7a97dbb` plus digest `64fc7171aeb668a661998831747f031aa8f8445cb02caaa7bbbaff2ccf68a5c3`. Its valid serial attempt reached 183 passes and 10 intentional skips before the two-photo gallery autofocus failure; it was interrupted after 194 completed cases. The failure preserved dialog trap/return-focus behavior but initially scrolled Close out of view.
- Final candidate identity: frontend HEAD `7a97dbb` plus reviewed source/test/config digest `2d71f35e4b630c5782f6b0c692aaa9b1b89d25627c0f19cfa3420aefe439c28f`; backend HEAD `3690d3a` plus reviewed digest `20f08ac413902b9358ca1e26f470a1d618c6136d4af6455fd2d0d59257813c5c`. Both repositories remain dirty; these identifiers do not claim a commit.
- Backend `bun run check` passed: lint, formatting, typecheck, build and 132 tests in 35 files. Focused ingress/current-staff coverage passed 31 tests in seven files. The backend report is local-only at `backend/var/review-remediation-report.md`.
- Frontend final `bun run check` passed: API check, lint, formatting, typecheck, 297 unit tests in 47 files and production build. Focused post-fix gallery coverage passed two cases with two intentional skips.
- Fresh serial regression passed 341 cases with 65 intentional skips and no failures (406 registered, 24.0 minutes). Fresh exact-data dashboard acceptance passed 16/16 in 1.3 minutes. Both used disposable mutation fixtures.
- Fresh guarded normal runtime used the actual frontend checkout on port 3100 and normal backend public reads only through a proxy blocking writes/cookies/auth. Gallery focus/arrows/Close and empty inquiry validation passed; browser errors/warnings and DevTools configuration/session errors were empty. The normal backend process was not used for mutation verification. A non-failing Next streaming digest observed during recovery tests remains a diagnostic with unproven cause and was absent from the fresh runtime.
- P1-14/P1-18 remain unchecked; F08 remains open until an authorized scoped commit exists.
