# 📥 Property CSV Import Implementation Plan

> **Goal:** Import valid property batches atomically as drafts, with reusable CSV parsing and review UI for future imports.

---

## 🎯 Objective

Deliver property import after the verified CSV export slice. The user approved **rejecting the entire batch if any row is invalid** and authorized implementation after this spec/plan delivery. [Frontend spec](../../../specs/property-import/spec.md); backend authority: companion `backend/specs/property-import/spec.md` and `backend/specs/property-import/contract.md`.

---

## 📦 Scope

**In scope**

- Admin/Manager template, upload, preview, errors, confirmation and completion.
- New drafts only, atomic writes, durable idempotent retry and staff-scoped pending metadata.
- A shared bounded CSV parser and a reusable upload/review UI used by this property feature now.

**Out of scope**

- Lead import, updates, publishing, photos, XLSX, arbitrary mappings, duplicate matching, queues and deployment.
- A registry or generic business/persistence framework. The later verified lead importer completed P2-04.

---

## ⚙️ Assumptions & Constraints

**Technical**

- Keep current independent repositories/feature branches and preserve existing uncommitted export work. No commits/pushes are authorized.
- Add exact-version backend-only `csv-parse` during implementation; existing `csv-stringify` writes the template. No frontend/parser/multipart dependency.
- Limits: **1 MiB UTF-8 CSV, 500 data rows, 64 KiB per record**, bounded 6 MiB JSON transport; preview at most 20 rows and 100 issues.
- Existing Node/Bun versions, four-worker backend test budget and transaction timeouts remain unchanged.
- Use property-owned Server Actions and existing safe cookie/Origin forwarding. No browser backend origin or cross-repository imports.

**Product / Business**

- Every invalid row blocks all inserts. Preview is read-only; explicit confirmation creates new `draft`, `available`, non-featured/non-demo properties with no photos.
- Existing properties are never matched or updated. Same-ID retries must replay the original batch; new intentional IDs can create duplicates and the UI must explain that boundary.
- Limits, preview bounds and reload metadata behavior are implementation defaults recorded in the specs.

**Dependencies**

- Existing property validation/mapping/search, live staff checks, serialized SQLite transactions and existing CRM primitives.
- Add one receipt model/migration before enabling import. Backend OpenAPI owns the additive contract; frontend snapshots/types follow it.

---

## 🧩 Proposed Approach

**Chosen approach:** bounded backend parsing and preview, followed by revalidated atomic confirmation with durable receipt. Browser-only validation cannot authorize data or guarantee atomic writes; background import jobs add infrastructure beyond this batch size.

**Flow:** CSV file → property Server Action byte/UTF-8 checks → Express manager/Origin/body guards → shared CSV parsing → property normalization/schema validation → preview → explicit same-file confirmation → live permission/receipt lock → all property inserts and receipt in one transaction → completion or safe replay.

**Reuse boundary**

- Shared backend `src/shared/csv/parse-import.ts`: CSV syntax, strict headers, limits and logical row metadata only. Parameters declare allowed/required headers and bounds. Property field mapping stays feature-owned.
- Shared frontend `src/components/crm/csv-import.tsx` and a small adjacent helper if needed: upload/preview/confirm/error/recovery presentation and state. Property adapter supplies actions, columns, labels, limits, storage key and completion link. No lead stubs.
- `PropertyImportReceipt` remains property-owned, not generic infrastructure. Store IDs/count/digest/actor/version, never raw CSV or owner fields.

**Backend files** (paths relative to backend)

- Create `src/shared/csv/parse-import.ts` for bounded syntax/header parsing and `src/modules/properties/property-import.schema.ts`, `property-import.service.ts`, `property-import.repository.ts`, `property-import.controller.ts` and `property-import.middleware.ts` for property mapping, transport and persistence.
- Modify `src/modules/properties/properties.routes.ts` and `properties.service.ts` for concrete integration; the property import files reuse existing creation mapping and search normalization.
- Add `PropertyImportReceipt` to `prisma/schema.prisma` and an additive migration. Update `scripts/check-database.ts` and fresh/populated migration assertions for the new table.
- Modify `docs/api/openapi.yaml`, `package.json`, `bun.lock`; add parser, validation, HTTP/atomicity/idempotency test files under `tests/`.

**Frontend files**

- Create [property import page](<../../../src/app/(staff)/crm/properties/import/page.tsx>) and `src/features/properties/crm/property-import.tsx`.
- Add feature-owned import schemas/transport/actions under `src/features/properties/data/`; use the existing session/action boundaries without changing unrelated mutation behavior.
- Add the shared CSV import UI and concrete recovery-state helper only if used by that UI/tests.
- Modify [property inventory page](<../../../src/app/(staff)/crm/properties/page.tsx>) for a compact manager-only Import CSV link. Preserve Agent export access and the corrected export/create action layout.
- Refresh `docs/contracts/properties.openapi.yaml` and regenerate existing property declarations. Add unit tests and `tests/e2e/property-import.spec.ts`; extend backend disposable fixtures only for real test needs.

**API/data changes:** template GET, preview POST and commit POST beneath `/api/v1/staff/properties/imports`; the backend contract defines request/result/error shapes. Existing JSON/export APIs remain compatible. One additive receipt table; no new runtime environment setting.

---

## 🚀 Execution Plan

1. **Parser and property preview** — _(role: backend)_ — authenticated, bounded, read-only review.
   - [x] Consulted current parser documentation, installed backend-only exact `csv-parse` 7.0.3, and added parser/mapper regression tests.
   - [x] Implemented `parseImport` with configurable headers/caps, logical rows, BOM/quoted-multiline/UTF-8/NUL coverage and raw record boundaries.
   - [x] Implemented property normalization, exact decimal conversion, bounded diagnostics/preview rows and versioned digest.
   - [x] Added template and preview routes with permission/Origin/content/body guards; preview is read-only.
   - [x] Focused tests verify malformed/domain-invalid previews write nothing and Agents are denied before import-body processing.
2. **Atomic confirmation and durable recovery** — _(role: backend)_ — exactly one committed batch per request identity.
   - [x] Added invalid-final-row, defaults/search, rollback, identity, concurrency/conflict and replay-after-deletion coverage.
   - [x] Added the receipt migration with serialized receipt lookup and live staff revalidation in the import transaction.
   - [x] Implemented revalidated all-or-nothing commit with bounded 422 diagnostics and one transaction for drafts/receipt.
   - [x] Verified same actor/content replay, conflict isolation and no recreation of deleted properties.
   - [x] Updated root OpenAPI and database checks; focused and full backend checks passed against disposable databases.
3. **Reusable review UI and property adapter** — _(role: frontend)_ — a complete guarded import journey.
   - [x] Refreshed the property snapshot/types and added decoding, action-boundary, recovery and safe-error tests.
   - [x] Added property-owned preview/commit Server Actions with live identity checks, bounded decoding and allowlisted transport.
   - [x] Built the shared upload/review/confirm UI with no-partial-import UX, bounded results and duplicate guards.
   - [x] Persisted actor-scoped identity/digest/version only; same-file recovery and explicit duplicate-risk acknowledgement handle uncertainty/storage failure.
   - [x] Added the manager-only page, template/download, completion link and Agent-denial coverage without frontend CSV dependencies.
4. **Integration, visual QA and reconciliation** — _(role: fullstack)_ — evidence-backed delivery with lead import still pending.
   - [x] Ran eight disposable browser cases covering template, atomicity, retry/reload, invalidation, access, stale actors and duplicate clicks.
   - [x] Inspected 320/390/1532px states, keyboard/error behavior and the compact three-action inventory header.
   - [x] Both full gates, fresh/populated migrations, disposable database checks and affected import/export regressions passed.
   - [x] Confirmed the normal checkout and active import page through Next DevTools; final source review passed after two scoped remediations.
   - [x] Reconciled feature/root specs, backend contract, snapshots, shared roadmaps/tool inventory and operational guidance. The later verified lead importer completed P2-04.

---

## ✅ Acceptance Criteria

**Functional**

- [x] Template → upload → preview → explicit confirm → complete works for Admin/Manager.
- [x] Any invalid row or persistence failure produces zero imported properties; valid batch creates exactly N drafts.
- [x] Same-ID retries/reload recovery create one batch and cannot leak/replay another actor's result.
- [x] Shared parser/UI are actually used and contain no property business rules; future lead behavior is not scaffolded.

**Non-functional** (performance, security, accessibility, reliability)

- [x] Limits, live transaction authorization, safe validation messages and raw-file non-retention pass targeted tests.
- [x] Phone text, zero values and exact money conversions survive parsing without spreadsheet/type coercion.
- [x] Responsive/keyboard states, full checks/builds, migrations/database verification and source review pass.
- [x] Docs distinguish verified property import, existing export and deferred lead import.

---

## 🧪 Validation Plan

**Manual tests**

- Inspect desktop/mobile action grouping and workflow states with fictional CSVs, including quoted multiline descriptions and long errors.
- Confirm preview counts/visible truncation are honest, no public listing is created, and file data is cleared after success.

**Automated tests**

- Parser/property mapping limits and scalar cases; HTTP/service access, rollback, concurrency, digest and receipt cases.
- Frontend action/file/recovery tests plus disposable browser end-to-end imports and export/property regressions.
- Full repository checks/builds, migration verification, disposable `bun run db:check`, OpenAPI parity and active-page runtime inspection.

**Rollback / mitigation**

- Disable import entry/routes if a gate fails. Retain created business data/receipts; no automatic destructive rollback or receipt deletion.
- Reduce batch cap with synchronized docs/contracts if transaction measurements require it; no default timeout increases.

---

## ⚠️ Risks & Open Questions

**Risks**

- **Duplicate batches after uncertain results:** persist/reuse request identity and require same-file recovery; explicit warning before starting over.
- **Partial writes:** validate all rows and insert drafts/receipt in one transaction, with injected-failure coverage.
- **Over-generalization:** share syntax/presentation only and use small feature-owned functions instead of registries or generic CRUD/import engines.
- **Heavy or malicious input:** enforce file and raw-record caps before parsing, enforce the row cap before business mapping/persistence, reject malformed headers/encoding and bound result DTOs.
- **Spreadsheet coercion:** preserve input strings; templates/guide explain plain decimal prices and phone text columns.

**Open questions** _(blockers for implementation)_

- None. Delivery evidence verifies the stated limits and recovery behavior.
