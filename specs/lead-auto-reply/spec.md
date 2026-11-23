# Website enquiry acknowledgement emails

Status: Implemented locally — closeout verified 2026-11-23. Production activation remains gated on SMTP/Redis hosting, sender authorization and account-wide quota allocation.

## Goal

Let visitors receive an acknowledgement after submitting a new website enquiry while keeping the public form reliable during email-service outages.

## Scope

Property enquiries and general agency enquiries, including Contact/directory and existing chatbot enquiry handoffs. Email is optional; phone-only enquiries still succeed. Manual/imported leads, staff actions, registration, viewing emails and marketing are excluded from this acknowledgement slice. Shared backend delivery now supports the separately delivered [transactional email feature](../transactional-emails/spec.md); this enquiry producer still requires a lead. No generic entity framework or frontend delivery UI is added here.

## User flow

1. Visitor submits the existing enquiry form with a phone number or email, using the current stable submission-ID and uncertain-save recovery behavior.
2. Express commits the enquiry and, when enabled and email is supplied, records one acknowledgement for asynchronous delivery.
3. The form confirms enquiry receipt immediately after database success. Redis/SMTP outages do not require another submission. No promise of successful inbox delivery is made.
4. A matching retry confirms the same enquiry without creating another acknowledgement. A deliberately new submission may create a new lead and acknowledgement under existing rate limits.

## Contracts and access

Authority: companion backend `specs/lead-auto-reply/contract.md`; identical repository-local [contract snapshot](../../docs/contracts/lead-auto-reply.md). Existing public API bodies and 201/200 `{received:true}` responses remain unchanged. Keep existing feature-owned Server Actions, signed inquiry relay, origin checks and backend validation. No frontend Redis, SMTP, encryption or provider secrets. No new proxy route, public delivery-status endpoint or generated API fields are needed.

## Design

Keep existing `src/features/leads/public/property-inquiry-card.tsx` and `agency-inquiry-card.tsx`, labelled optional email controls, accessible validation, loading and recovery states. Preserve the current receipt confirmation without claiming email was sent. No page redesign or CRM delivery-management screen. The email itself uses accessible text/HTML alternatives, escaped text, readable links and application branding; backend templates own its rendering.

## Acceptance criteria

- [x] Property and general enquiry browser flows retain optional email and phone-only input; no new required field or consent assumption is introduced.
- [x] Form success means enquiry received and never implies confirmed email delivery; no queue/provider/private metadata appears in browser responses.
- [x] Lost-response recovery and duplicate-click protection retain the same submission ID and create one enquiry/email intent.
- [x] Redis/SMTP outage does not turn a committed enquiry into a form error or trigger automatic resubmission.
- [x] Disposable public-to-worker checks capture one acknowledgement for each eligible route, none for excluded flows, and retain staff in-app notifications.
- [x] Contract parity, frontend quality checks, scoped desktop/mobile recovery and active-page runtime inspection passed.
- [x] P2-01 was checked after backend/frontend local acceptance; production activation remains separately gated.

## Validation

Extend `tests/e2e/property-inquiry-recovery.spec.ts` and `tests/e2e/public-directory-enquiries.spec.ts` only where the new cross-system outcome needs assertions. Use disposable Express/SQLite, an isolated Redis prefix and captured SMTP; test both public route variants, phone-only, replay and worker outage without exposing an application email-inspection API. Reuse trusted fixture-side database/capture assertions. Review the actual HTML/text email at narrow and wide widths. Run lint, formatting, typecheck, tests, production build and focused browser/runtime checks required by AGENTS.md; test fixtures never deliver to real users.

## Rollout and risks

The additive backend migration and compatible worker are implemented; existing forms require no API rollout coordination. Keep frontend confirmation compatible with disabled mode. Redis/BullMQ/Nodemailer are backend-only dependencies. Local verification covers SMTP cancellation, idempotent operator replay and bounded maintenance. Worker scaling remains within the current same-host SQLite boundary. Production activation still requires a monitored reply-to, authorized sender/domain, actual provider limits, a conservative account-wide allocation shared with other applications, and production Redis/worker hosting. Credentials belong only in ignored backend environment files; no secrets are documented.

## Implementation evidence

Verified on 2026-11-20: backend `bun run check` passed lint, stock formatting, typecheck, 332 tests in 72 files and production build. Frontend API parity, lint, typecheck and 440 tests in 62 files passed; its production build also passed with no frontend product-code change. The final isolated Edge run passed 23 desktop/mobile cases with five configured skips, including all four new captured-email cases. Focused email tests passed 22 cases; fresh migration/rerun/database checks and compiled standalone worker/readiness/inspect smoke passed. The isolated enquiry page was inspected with an active browser session and no reported runtime/configuration errors; 390px/800px email captures were reviewed. No live SMTP/inbox observation, normal-database migration or deployment is claimed.

Closeout verification on 2026-11-23 passed the frontend gate again with API parity, lint, formatting, typecheck, 440 tests in 62 files and production build. A clean captured-SMTP Edge run passed 18 selected desktop/mobile enquiry, assignment, viewing and task cases. The post-fix backend gate passed separately; no frontend API or product behavior changed. No live SMTP/inbox observation, normal-database migration, activation or deployment is claimed.

Original delivery logs are retained locally under backend `.delivery-work/lead-auto-reply/`. November 23 closeout logs are under `.delivery-work/email-closeout/` in each repository. Generated logs and captures are ignored, not source artifacts.
