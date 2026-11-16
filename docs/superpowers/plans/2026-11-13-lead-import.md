# 📥 Lead CSV Import Implementation Plan

> **Goal:** Create new unassigned leads from fully validated CSV batches using the existing reusable property-import mechanics.

---

## 🎯 Objective

Delivered the remaining lead-import slice of P2-04 after the verified lead/property exports and property import. The user selected **New and unassigned**, with no property links. Acceptance is verified; production deployment remains outside this delivery.

---

## 📦 Scope

**In scope**

- Admin/Manager template, upload, preview, row errors, explicit whole-batch confirmation, completion and same-ID recovery.
- Six columns: `name,phone,email,purpose,budget_aed,source`; existing manual lead validation, search mappings and creation history.
- Reuse the actual shared parser/UI, extracting only neutral property-owned helpers now needed by both features.

**Out of scope**

- Agent bulk import, updates/upserts, duplicate matching, assignment/property/stage/history columns, website-source backfills, notes, notifications/auto-replies, XLSX, jobs and deployment.
- New dependencies, importer registries, generic persistence engines or cross-repository source sharing.

---

## ⚙️ Assumptions & Constraints

**Technical**

- [Frontend spec](../../../specs/lead-import/spec.md); backend-owned contract: companion `backend/specs/lead-import/spec.md` and `contract.md`.
- Existing backend `csv-parse` 7.0.3 / `csv-stringify` 6.9.0 and shared CSV UI are sufficient. No install or environment change.
- Limits: 1 MiB CSV, 500 data records, 64 KiB raw record, 6 MiB JSON, 20 preview rows, 100 displayed issues with accurate totals. Preserve BOM bytes and existing 15-second transactions/four-worker backend tests.
- Preserve all existing uncommitted export/property-import work and running user servers/data. No commits or push. Acceptance tests use disposable databases; local rollout applies the additive migration separately after backup.

**Product / Business**

- User-confirmed: every imported lead is **New and unassigned**, with no linked property.
- Delivered defaults: Admin/Manager-only bulk access and `call`/`walk_in` sources, matching existing manual-source validation. Existing Agent self-assigned manual creation is unchanged.
- Each row requires name/purpose/source and at least one phone/email; blank optional fields become null. No duplicate matching or silent row skipping. Identical rows are separate new leads.
- P2-04 is verified after full import/export acceptance for both entities. P2-05 remains separate.

**Dependencies**

- Additive `LeadImportReceipt` migration; existing lead/activity persistence and search normalization.
- Backend leads OpenAPI, frontend lead contract snapshot/generated declarations and disposable browser/database fixtures.

---

## 🧩 Proposed Approach

- **Recommended:** reuse syntax, file inputs, preview/confirmation presentation and recovery mechanics; add lead-specific normalization, strict response validation and atomic persistence. A second importer would duplicate known retry safeguards; a generic import engine would add complexity without another current requirement.
- Flow: template → bounded file decoding → server preview (no writes) → explicit confirmation with CSV/digest/version/UUID → live actor + aggregate receipt check → all leads/history/receipt in one transaction → completion or same-ID retry.
- Required schema shape: six columns above; template contains all six, but only name/purpose/source plus one contact header are mandatory. Purpose is sale/rent; source is call/walk_in. Phone/email use current validation; budget uses exact decimal-to-fils conversion and existing BigInt persistence.

**Existing components to reuse**

- [CSV workflow](../../../src/components/crm/csv-import.tsx), [file field](../../../src/components/crm/csv-import-file-field.tsx), [recovery state](../../../src/components/crm/csv-import-state.ts) and [property adapter example](../../../src/features/properties/crm/property-import.tsx).
- Backend `src/shared/csv/parse-import.ts`, `src/shared/csv/export.ts`, `serializedTransaction`, `requireCurrentStaff`, `leadSearch`, and existing lead creation/activity fields.

**Delivered files and interfaces**

- Backend: `src/modules/leads/lead-import.schema.ts`, `.service.ts`, `.repository.ts`, `.controller.ts`; integrated with `leads.routes.ts`/`leads.service.ts`. The feature-local validators are `validateImport` and `importDigest`; template, preview and commit expose the contract behavior.
- Backend: extract property HTTP guards to `src/shared/csv/import-middleware.ts`, update both feature routes, add receipt to `prisma/schema.prisma` plus an additive migration, update `scripts/check-database.ts` and `docs/api/leads.openapi.yaml`.
- Frontend: new thin `src/app/(staff)/crm/leads/import/page.tsx`, adapter `src/features/leads/crm/lead-import.tsx`, and feature-owned `data/import-actions.ts`, `import-request.ts`, `import-types.ts`. Adapter supplies actor/namespace, six columns, lead labels and unassigned/New completion link.
- Frontend: move neutral decoder/identity/issue schemas from property `data/import-input.ts` / `import-types.ts` into shared `src/lib/csv/import.ts`; update property imports directly without compatibility barrels.
- Frontend: refactor [lead action boundary](../../../src/features/leads/data/action-boundary.ts) to expose `runLeadOperation<T>(operation, options)` for existing live staff/Origin/safe-error handling, adding expected-staff checks. Keep `runLeadMutation` as its existing manual/public request-and-response wrapper. Import actions `previewLeadImport(file, expectedStaffId)` / `commitLeadImport(file, identity, expectedStaffId)` use strict batch schemas and bounded 422 errors, not the wrapper's single-lead ID/version assumption. Preserve public-header exceptions and current manual response checks.
- Frontend: add compact manager-only link in [lead inventory actions](../../../src/features/leads/crm/lead-inventory.tsx); refresh `docs/contracts/leads.openapi.yaml` / `src/lib/api/generated/leads.d.ts`; add unit/E2E tests.
- Implemented endpoints: GET `/api/v1/staff/leads/imports/template`, POST `/imports/preview`, POST `/imports/commit` beneath the lead base. Preview has the six-column workflow shape; commit returns `{ submissionId, createdCount, leadIds, replayed }` (201 new / 200 replay). Existing APIs remain compatible.

---

## 🚀 Execution Plan

1. **Reusable mechanics and lead preview** — _(role: fullstack)_ — shared imports remain compatible and lead preview writes nothing.
   - [x] Added regression coverage for mapping, headers/contacts, UTF-8/BOM, sources, budgets, phones and all-row validation.
   - [x] Extracted neutral middleware/file/schema helpers; property consumers use the shared paths directly.
   - [x] Implemented validation/digest/template/preview with ordered authorization/body guards and zero writes.
   - [x] Verified structural 400, limit 413, media 415, invalid-preview 200 and pre-body Agent denial behavior.
2. **Atomic lead/history confirmation** — _(role: backend)_ — one batch per stable identity.
   - [x] Added regression tests for invalid final rows, actor changes/demotion, concurrent IDs, content conflicts and forced defaults.
   - [x] Added the aggregate receipt migration and serialized transaction with write reservation, fresh actor/receipt reads and atomic lead/search/activity/receipt creation.
   - [x] Asserted injected lead, activity and receipt failures leave zero batch records; replay preserves later edits and assignments.
   - [x] Measured 500 lead-plus-activity writes plus receipt in 294 ms, within the existing 15-second budget.
   - [x] Updated backend leads OpenAPI/database checks; verified fresh/populated migrations and full backend gate against disposable SQLite.
3. **Lead adapter and safe action boundary** — _(role: frontend)_ — complete guarded review/confirmation using shared UI.
   - [x] Added tests for response shapes, actor mismatch, file errors, storage isolation/recovery and unchanged manual/public mutations.
   - [x] Extracted `runLeadOperation`, preserving manual/public response guards; implemented feature-owned actions and exact schemas.
   - [x] Refreshed contract/generated types, added route/adapter/list action, and preserved Agent/pipeline controls.
   - [x] Verified explicit retry, reload/reselection, storage handling, actor remounts, duplicate-risk acknowledgement and sensitive-state clearing.
4. **Integrated acceptance and documentation** — _(role: fullstack)_ — evidence for complete P2-04, without implementing P2-05.
   - [x] Added disposable desktop/mobile browser cases for template, invalid rows, contacts, history, keyboard/double clicks and recovery.
   - [x] Covered stale actor, denied Agent, file changes, duplicate rows/fresh IDs, notification absence and 320/390/1532px headers/states.
   - [x] Ran focused lead/property import, export and manual/public lead regressions, both full quality gates, migrations/database checks, API parity and active-page runtime inspection.
   - [x] Completed scoped and independent source review; no actionable findings remained. Documentation reconciliation verified P2-04.

---

## ✅ Acceptance Criteria

**Functional**

- [x] Admin/Manager can template → preview → confirm new leads; Agents cannot bulk import.
- [x] Any invalid row or persistence failure produces zero batch leads/activities/receipts.
- [x] Valid imports create exactly N New/unassigned/unlinked leads, correct search/contact/budget values and one creation entry each.
- [x] Stable retries/reload/concurrent calls create one batch, preserve later changes and isolate lead/property/actor metadata.
- [x] Shared parser/UI/file guards are used directly; existing property import/manual/public lead/export behavior remains compatible.

**Non-functional** (performance, security, accessibility, reliability)

- [x] Limits, exact-byte digest, safe diagnostics, live actor binding and transaction atomicity pass tests; raw CSV is not retained.
- [x] Maximum supported lead-plus-history batch meets the existing transaction budget without timeout/test-worker increases.
- [x] Responsive/keyboard feedback, full checks/builds, contracts, migrations/database checks and final review pass.
- [x] Specs/roadmaps reflect actual delivery; P2-05 and production deployment remain separate.

---

## 🧪 Validation Plan

**Manual tests**

- Inspect template guidance, contact/price errors, preview scrolling, pending/uncertain/success/reload states and the three header actions at 320/390/1532px.
- Confirm imported leads appear in the unassigned/New list with creation history and remain absent from Agent-owned lists until assigned through the existing flow.

**Automated tests**

- Backend `tests/lead-import-parser.test.ts`, `lead-import.test.ts`, `lead-import-authorization.test.ts`, `lead-import-migration.test.ts` and existing migration tests cover bytes/rows/contacts/budget, authorization, no-write preview, rollback, concurrent replay and unchanged later edits.
- Frontend `tests/unit/lead-import-ui.test.ts`, `lead-import-actions.test.ts`, `tests/e2e/lead-import.spec.ts`, existing shared-file/property tests and lead-action regressions cover the reusable UI and boundary extraction.
- Run `bun run check` in both repos, disposable `bun run db:migrate` / `bun run db:check`, existing property-import/CSV-export and affected lead/inquiry browser cases. Record targeted coverage honestly rather than claiming the entire legacy browser suite.

**Rollback / mitigation**

- Disable additive lead-import UI/routes if acceptance fails. Retain imported leads, history and receipts; no destructive automatic data rollback.
- Apply the receipt migration before enabling code. No runtime environment or package rollback is expected.

---

## ⚠️ Risks & Open Questions

**Risks**

- **Shared extraction regresses property/manual lead flows:** keep existing interfaces/permissions/error semantics and run focused compatibility regressions.
- **Duplicates after uncertainty:** persist the actor/feature-scoped identity before commit, re-preview the same file after reload and require acknowledgement before abandoning recovery. Fresh IDs and identical rows intentionally create new leads.
- **Partial history or misleading notifications:** persist leads/activities/receipt atomically and assert zero assignment/inquiry notifications for this unassigned manual-source import.
- **Spreadsheet coercion or provenance mistakes:** preserve phone strings, require plain decimal budgets and explicit allowed source; do not treat reporting exports as templates.
- **Transaction size:** measure 500 rows with their activities; lower and document the cap if needed.

**Open questions** _(blockers for implementation)_

- No unresolved implementation question remains. Admin/Manager bulk access and manual-only source values are delivered; New/unassigned/no property links is user-confirmed. The normal local database received the additive migration after a consistent backup and passed `db:check`; production deployment remains unclaimed.
