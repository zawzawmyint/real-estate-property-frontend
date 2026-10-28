# Review Findings Remediation Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development for the independent backend and pipeline tasks; the parent owns Contact form integration and final verification.

**Goal:** Resolve all confirmed audit, QA and clean-code findings without changing feature scope or permissions.

**Architecture:** Preserve the separate Next.js and Express repositories. Canonicalize phone whitespace at each validation boundary, retain explicit property/general inquiry guards, and share only their repeated persistence operation. Keep unknown agency mode explicit and pipeline announcements tied to the actual outcome.

**Tech Stack:** Existing TypeScript, Zod, React Hook Form, dnd-kit, Express, Prisma, Vitest and Playwright; no new dependencies.

**Spec:** Existing public-contact-and-agents, lead-management and sales-pipeline specs in the affected repositories, with review-remediation amendments added before code changes.

## Constraints and ownership

- Work in the current dirty checkouts to preserve the user's current deliveries. This remediation adds no commit, push, database migration, dependency, private-data exposure or auth/role change; pre-existing dirty dependency changes belong to the earlier delivered feature work.
- Backend worker owns backend phone validation, inquiry-persistence cleanup, relevant OpenAPI and tests, and investigation of the observed auth-body ECONNRESET.
- Pipeline worker owns pipeline announcement code, direct regression tests and the local E2E name helper.
- Parent owns frontend phone validation, unknown-mode caution/usage copy, generated frontend contract snapshots/types, integration tests and quality gates.
- Final spec-updater owns documentation reconciliation after code and tests settle; a fresh reviewer checks the remediation diff.

## Tasks

- [x] **Backend:** Add failing tests for normalized phones/replays and response phone contracts; implement the same whitespace policy used by the frontend, align OpenAPI, and factor only repeated create/activity/receipt persistence while retaining each route's locks/context checks. Diagnose the auth-body test flake and fix a reproducible cause without weakening its 413 assertions. Evidence: affected behavior suites passed 33/33 tests in seven files; final backend quality passed with 94 tests in 23 files; the header-first raw-HTTP probe passed 60 stress executions without a reset while the existing 413 boundary assertions remain strict.
- [x] **Pipeline:** Add failing tests for no-op, canceled, ordinary and terminal drag announcements; fix the messages and consolidate repeated test-name generation.
- [x] **Contact:** Add failing normalization/outage-copy tests; normalize phones before validation and add mode-neutral caution without falsely asserting demo/live status or promising follow-up when mode is unknown.
- [x] **Integrate:** Synchronize backend-owned contracts and frontend generated types; add phone-only pasted-number and outage/announcement browser coverage where appropriate.
- [x] **Verify:** Frontend API drift, lint, formatting, typecheck, 199 unit tests in 34 files and an isolated production build passed; backend final quality passed with 94 tests in 23 files. Focused browser regressions are green. The full browser run reported 163 passed, 8 intentional skips and one pointer-cancel test synchronization failure. After correcting the test to wait for settled drop-animation geometry and verify an active drag before Escape, that case passed three consecutive isolated reruns. All 164 applicable browser cases are covered across these runs; a single clean full-suite rerun is not claimed.
- [x] **Reconcile/review:** Correct stale root status and document actual behavior, evidence and remaining limitations. The final fresh audit found no actionable findings; final browser evidence is recorded in Verify.

## Review focus

- Unicode spaces normalize before length/character checks and receipt hashing; invalid characters and whitespace-only contact remain rejected.
- Phone-only and alternative-contact inquiries preserve deduplication and exact public/staff access boundaries.
- No-op/canceled dragging never announces an imminent save or confirmation; terminal moves retain confirmation.
- Outage copy remains truthful for demo, live and unknown modes and preserves the working enquiry form.
- Cleanup retains atomic lead/activity/receipt creation and independent property/submission locking.
