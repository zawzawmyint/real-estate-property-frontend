# Shared transactional email notifications — frontend compatibility

Status: Implemented locally — closeout verified 2026-11-23. No frontend product/API behavior changed; backend delivery and cross-repository compatibility are locally verified.

## Goal

Preserve existing enquiry and CRM workflows while the backend extends shared transactional email delivery.

## Scope and exclusions

- Backend-owned email expansion: staff assignment, viewing changes, task reminders and enquiry alerts; customer enquiry acknowledgement and viewing confirmation/reminder/reschedule/cancellation.
- No frontend controls, preferences, new API inputs, public delivery status or generated type changes are introduced. Customer email remains optional in existing workflows.

## Behavior and contracts

- Existing business API responses, authorization, submission receipts and uncertain-save reconciliation remain unchanged. UI success means the business operation committed, not that an email reached an inbox.
- Email is produced in backend business transactions and delivered independently of the browser, SSE connections and inbox read state.
- Backend owns the authoritative `specs/transactional-emails/spec.md` in its independent repository. Do not import backend source or introduce a sibling-checkout runtime dependency.

## Acceptance criteria

- [x] Public phone-only and email enquiries retain existing responses and replay behavior.
- [x] Assignment, viewing and task workflows preserve current permissions, errors and recovery behavior with email groups enabled/disabled.
- [x] Existing inbox/SSE behavior remains unchanged; no internal email ledger or recipient data is exposed in API responses.

## Validation

API parity, lint, formatting, typecheck, 440 unit tests and the production build passed. The 2026-11-23 closeout repeated the frontend gate and one clean captured-SMTP Edge run passed all 18 selected desktop/mobile enquiry, assignment, viewing and task cases. Runtime inspection of the active `/properties` session reported no configuration, session or browser errors. The backend-only suppression-diagnostic correction was covered by the post-fix backend gate and focused regression; no frontend API or product behavior changed. Captured SMTP, disposable backend/Redis and isolated runtime inspection were used; no external mail or deployed runtime was used.

## Risks and rollout

This backend extension requires no frontend product deployment or migration. Reassess this spec if a later change modifies any HTTP contract. Backend owns SMTP/Redis activation and queue migration.
