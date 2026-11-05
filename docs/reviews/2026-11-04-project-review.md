# Phase 1 project review

Date: 2026-11-04

## November 5 remediation follow-up

This remains a November 4 historical review snapshot: its branch, clean-tree and failed-run statements describe the inspection state on that date, not the current candidate.

The ten selected findings are verified in the [November 5 remediation specification](../../specs/phase-one-review-remediation/spec.md); the backend-owned behavior is in the companion repository's `specs/phase-one-review-remediation/contract.md`. Both dirty tested candidates are identified by their historical HEADs plus reviewed source/test/config digests in that specification, rather than by HEAD alone. Backend `bun run check` passed with 132 tests in 35 files; frontend final `bun run check` passed with 297 unit tests in 47 files; the clean serial run passed 341 cases with 65 intentional skips and no failures, and the separate dashboard run passed 16/16. Local reports, traces and captures under `.delivery-work/` are ignored and are not Git-delivery evidence.

The final serial browser, exact-data dashboard and guarded normal-runtime check passed. P1-14/P1-18 remain unchecked. F08 is now verified by authorized implementation commits frontend `655587e` and backend `5086b65`, pushed to their working branches on November 5. The remediation did not close Phase 1 or authorize deployment.

The separate [November 5 browser UI verification](2026-11-05-browser-ui-verification.md) records later local disposable-data and visible localhost journeys. It confirms one unresolved pre-hydration property-form submission defect; it does not change this review's historical conclusions or Phase 1 status.

Second pass, using Claude Opus 5.5 medium for audit, code review, and task QA. Both repositories were reviewed. No application code was changed. Tests and the browser were not re-run; behavior claims below come from reading the source and the recorded evidence.

| Repo     | Branch                                                               | Commit    |
| -------- | -------------------------------------------------------------------- | --------- |
| frontend | `docs/phase-one-release-verification` (same commit as `origin/main`) | `7a97dbb` |
| backend  | `main`                                                               | `3690d3a` |

The frontend working tree has an uncommitted edit to `specs/phase-one-public-completion/spec.md`, plus untracked `docs/superpowers/plans/2026-11-04-phase-one-release-verification.md` and this review. The backend working tree is clean.

Phase 1 stays **28 of 30**. P1-14 and P1-18 stay open. Deployment and portfolio items D-01 through D-05 stay open.

The first pass is superseded by this one. It had the same P0, the gallery truncation, the stale spec narrative, the copied session check, and the missing roadmap note. This pass adds the inquiry fallback, the stuck property-inquiry form, the cookie-name copies, the backend roadmap links, and a more precise account of which release gates have evidence.

## Priority

### P0 — must finish before Phase 1 is done

#### Release acceptance on the candidate is still unfinished

- **Found by:** task QA
- **Repos:** frontend and backend
- **Where:** `frontend/specs/phase-one-public-completion/spec.md`, `frontend/docs/superpowers/plans/2026-11-04-phase-one-release-verification.md`
- **What:** Acceptance checkboxes are still open. The 2026-11-04 follow-up ran 388 registered desktop/mobile cases with one worker and did not finish cleanly. The first attempt stopped after 50 passes when the homepage shortcut test exceeded 60 seconds. The retry stopped after 184 passes when mobile Admin sign-in timed out, with 193 cases unrun. Full `bun run check` has not been recorded on these commits. Browser runs used ports 13100 and 3170, so the normal port 3100 runtime check is still open.
- **Recorded and not a clean gate:** the dedicated dashboard fixture passed 16/16. The retry also passed maximum-length content, native zoom, the width matrix, inquiry persistence, and staff access checks. An earlier paragraph in the same spec still says the dashboard run is pending.
- **Next step:** Diagnose the CRM navigation hang after mobile sign-in, then run one clean serial regression, the full quality gates, and the port 3100 runtime check on frontend `7a97dbb` and backend `3690d3a`. Check P1-14 and P1-18 only after those pass.

### P1 — should fix

#### Gallery title clips on small screens

- **Found by:** task QA
- **Repo:** frontend
- **Where:** `frontend/src/features/properties/public/property-gallery.tsx` line 112 (`DialogTitle` uses `truncate`)
- **What:** At 320px and 390px the gallery dialog title is visually cut off. The detail-page title wraps. The public-completion spec still asks for readable long titles, and no acceptance decision records the ellipsis. The full title remains the accessible dialog name.
- **Next step:** Let the dialog title wrap, or record in the spec that the ellipsis is accepted, then review 320px and 390px again.

#### The public-completion spec contradicts itself

- **Found by:** task QA
- **Repo:** frontend
- **Where:** `frontend/specs/phase-one-public-completion/spec.md`
- **What:** The status line still says verification has been in progress since 2026-10-30. The 2026-11-04 section says the maximum-length test still needs a clean run, then a later bullet says the retry passed it. Line 105 still says the code is on `feat/phase-one-public-completion`, and the 2026-10-30 bullets under it have no historical heading. Those older bullets also cite `outputs/phase-one-public-completion/`, which is not in the workspace. Line 94 still lists the dashboard run as pending after the follow-up records a 16/16 pass.
- **Next step:** Update the status line, put the 2026-10-30 bullets under a historical heading, and make the maximum-length, dashboard, and candidate-commit statements match the 2026-11-04 follow-up.

#### 2026-11-04 evidence is only in the working tree

- **Found by:** audit and task QA
- **Repo:** frontend
- **Where:** `frontend/specs/phase-one-public-completion/spec.md` (modified); `frontend/docs/superpowers/plans/2026-11-04-phase-one-release-verification.md` (untracked)
- **What:** The spec now links to the verification plan. That plan is untracked, so committing the spec alone leaves a broken link. The new notes also point at `.delivery-work/` captures, and that folder is gitignored.
- **Next step:** Commit the spec and the plan together on this branch. Leave `.delivery-work/` untracked. This review file is also untracked; commit it only if the review should live in the repo.

#### Both roadmaps still describe the 2026-10-30 run

- **Found by:** task QA
- **Repos:** frontend and backend
- **Where:** `frontend/ROADMAP.md` and `backend/ROADMAP.md` (byte-identical)
- **What:** The in-progress paragraph still describes the interrupted 2026-10-30 run. The property and agency redesign notes still say native 200% zoom is unverified, while the 2026-11-04 spec note records a passing Chrome zoom run. There is no 2026-11-04 delivery entry. The checkboxes are right: P1-14 and P1-18 are open, and the count stays 28/30.
- **Next step:** Add one dated note to the frontend roadmap with the candidate commits, what passed, and what is still open, then mirror it. Leave the boxes unchecked.

#### Backend roadmap links point at frontend-only files

- **Found by:** task QA
- **Repo:** backend
- **Where:** `backend/ROADMAP.md`
- **What:** The backend copy is a byte copy of the frontend roadmap, so relative links such as `specs/phase-one-public-completion/spec.md` and `specs/public-homepage-redesign/spec.md` do not exist in the backend repo. The roadmap says links resolve inside each repository.
- **Next step:** In the backend copy, show frontend-only links as companion-repository text, the way the foundation section already does.

### P2 — soon

#### Public inquiry routes accept unsigned requests

- **Found by:** audit
- **Repos:** backend, reached through the frontend rewrite
- **Where:** `backend/src/modules/leads/inquiry-limiter.ts` lines 46–64; `frontend/next.config.ts` rewrites `/api/v1/:path*` to Express
- **What:** If the relay key and signature are missing, Express does not reject the request. It rate-limits by the socket address, including in production. A client that calls Express through the Next rewrite shares the Next server’s address, so those callers share one 5-per-15-minutes bucket. Signed bad relays still return 403. Nothing private is returned. The production config still requires `INQUIRY_RELAY_SECRET`.
- **Next step:** Confirm this fallback is intentional. If it is not, require the relay headers in production.

#### The property inquiry form can stay stuck after an unconfirmed send

- **Found by:** code review
- **Repo:** frontend
- **Where:** `frontend/src/features/leads/public/property-inquiry-card.tsx` lines 34–75 and 163–190
- **What:** After an unconfirmed response, `uncertain` stays true, the fields stay disabled, and the only action is “Retry same inquiry”. A later definite failure does not clear the receipt while `uncertain` is true. The agency inquiry card has an edit-as-new path for this case. The property card does not. Each retry still counts toward the inquiry limit.
- **Next step:** Use the same receipt-reset helper and edit-as-new action the agency card uses.

#### The session cookie name is copied in four places

- **Found by:** code review
- **Repos:** frontend and backend
- **Where:** `frontend/src/proxy.ts` lines 5–8, `frontend/src/lib/api/server.ts` lines 43–46, `frontend/src/lib/auth/transport.ts` line 29, `backend/src/modules/auth/auth.ts` lines 102–106
- **What:** Each site chooses `__Host-agency.session` or `agency.session` with its own production check. The names match today. A change in one place would send signed-in CRM users to login, or forward no cookie, and it would show up in production because of the `__Host-` prefix. Express still checks every request.
- **Next step:** One frontend helper for the cookie name, imported by the proxy and both server modules. Keep a backend test that asserts the same name, since the repos do not share code.

#### The live staff check is copied three times and skipped on the dashboard

- **Found by:** code review
- **Repo:** backend
- **Where:** `backend/src/modules/leads/leads.service.ts` lines 41–58, `backend/src/modules/viewings/viewings.service.ts` lines 29–46, `backend/src/modules/tasks/tasks.service.ts` lines 33–50. `backend/src/modules/dashboard/dashboard.service.ts` does not call it.
- **What:** Leads, viewings, and tasks each reimplement `current()` for disabled, banned, non-staff, and `credentialVersion` mismatches. Tasks and viewings open a leads repository to do it. The dashboard scopes with `actor.role` from `requireStaff`. There is no current bypass, because `requireStaff` and the session hook already reject those conditions. The risk is the next revocation rule landing in only one copy.
- **Next step:** One shared helper next to `requireStaff`, called from leads, viewings, tasks, and the dashboard.

#### Homepage guidance spec still says the section is text-only

- **Found by:** task QA
- **Repo:** frontend
- **Where:** `frontend/specs/phase-one-public-completion/spec.md`; `frontend/src/features/properties/public/homepage-sections.tsx` line 254
- **What:** The completion spec still describes a text-led guidance section with no image. The homepage renders an `EditorialPhoto` named `guidance`. The homepage-redesign spec approves that photo and says it supersedes the earlier composition.
- **Next step:** Point the completion spec’s design line at the redesign spec.

#### The homepage shortcut test can stall a clean serial run

- **Found by:** task QA
- **Repo:** frontend
- **Where:** recorded in `frontend/specs/phase-one-public-completion/spec.md` lines 99–100
- **What:** The desktop homepage shortcut test exceeded 60 seconds because of repeated homepage loads, then passed in 13.5 seconds on the unchanged retry. That timeout stopped the first full serial attempt.
- **Next step:** Reuse one page load or split the destination checks. Raising the timeout would hide the stall.

## What each review found

### Audit

No P0 or P1. The P2 unsigned-inquiry fallback and the P3 working-tree notes are above.

Checked and clear, frontend:

- The only tracked env file is `.env.example`, with an empty relay secret. `.env*` is gitignored.
- `src/proxy.ts` sends `/crm` to `/login` when the session cookie is missing. The cookie name matches the backend in development and production. Live session checks go through the backend.
- `API_URL` stays in server code. Public property reads use `/api/v1/properties`. Both inquiry forms go through a Server Action that builds relay headers in a `server-only` module.
- `ownerName` and `ownerPhone` appear in CRM property code, not in the public pages.

Checked and clear, backend:

- Clean tree. No tracked `.env`, database, log, or upload files. `.env.example` uses placeholders.
- Production config requires a 32-character auth secret, the inquiry relay secret, and HTTPS. Sign-up is disabled. The session cookie is httpOnly and SameSite=Lax, and Secure with the `__Host-` prefix in production.
- Public property queries return published, available listings and omit owner fields. Owner fields are limited to admins and managers.
- Public inquiry responses are `{ received: true }`. Assignment routes are limited to admins and managers. Public agency contact fields in the demo catalog are null.

### Code review

No P0 or P1. The three P2s are the stuck property-inquiry form, the copied cookie name, and the copied `current()` check.

Checked and acceptable, backend:

- Agents can list only their own leads. Lead find, update, and activity add `assignedAgentId` for agents. Assignment is manager-only in middleware and again in the service.
- Viewing and task queries scope agents through the assigned lead. Creating either one uses that same lead lookup, so another agent’s lead is a 404.
- Dashboard agent counts use `assignedAgentId` and ignore query parameters.
- Public inquiry schemas are strict, require phone or email, and reject extra fields such as `assignedAgentId`. The same submission id and payload replays. A different payload on that id conflicts. Invalid relay signatures are 403.
- Sessions last 8 hours, are not refreshed, and are not cached. Disabled, banned, non-staff, and outdated-credential sessions fail at sign-in and at `get-session`.

Checked and acceptable, frontend:

- The CRM cookie check only redirects. CRM data still calls `requireStaffSession()`, which asks the backend `/get-session`.
- Server actions check the session, validate origin, and forward only the session cookie. Agent-only UI blocks do not replace Express rules.
- No frontend file imports backend source. API types come from generated files.
- The inquiry relay refuses to run without its secret.

### Task QA

The P0, the gallery P1, the spec and roadmap P1s, the guidance P2, and the shortcut-test P2 are above. P1-14 and P1-18 were not marked complete.

Confirmed, frontend:

- Both roadmaps check P1-01 through P1-13, P1-15 through P1-17, and P1-19 through P1-30. P1-14, P1-18, D-01 through D-05, Phase 2, and Phase 3 stay open.
- The homepage has the hero and search outside the featured suspense boundary, the featured query `featured=true&pageSize=3&sort=newest`, distinct loading, empty, and retry states, and guidance links to `/agents` and `/contact`. “View all properties” goes to `/properties?purpose=sale`.
- Invalid minimum and maximum budgets are rejected before navigation. Budget fields stack below 400px.

Confirmed, backend:

- Public list and detail selects omit `ownerName` and `ownerPhone`. The mapper returns owner fields only to non-agent staff.
- Anonymous visitors see published, available listings. The query schema accepts `featured`, `pageSize`, and `sort=newest`.
- Both public inquiry routes exist and apply the origin check, rate limit, JSON content type, and 16 KB body limit.
- No new endpoint or contract change for this task.

Unverified by this pass: test counts, browser layout, zoom, and inquiry-to-lead persistence. Those statements come from the spec’s recorded evidence.
